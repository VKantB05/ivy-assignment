"""
harvest.py - Phase 1 Data Harvester

Fulfills Phase 1 Requirements:
1. Directory & Environment Isolation: Ensures persistence under audit/data/
2. Authentication Probing: Tests standard API key transport methods (x-api-key, Authorization: Bearer, X-API-Key)
   against /health and /v1/listings to lock in accepted header format.
3. Server Clock & Health Check: Records /health to verify availability and inspects timestamps for explicit +05:30 (IST) offset.
4. Dataset Harvesting (/v1/listings, /v1/rentals, /v1/projects, /v1/analytics): Iterates over pagination offsets, dynamically
   handles varied JSON envelopes (data, listings, rentals, projects, or direct lists), and detects stopping conditions.
5. Discrepancy Logging: Captures non-200 HTTP statuses, 404 routes, schema/format mismatches into diagnostic_log.json.
6. Local Raw Persistence: Dumps unmutated JSON files to disk (raw_listings.json, raw_rentals.json, raw_projects.json, raw_analytics.json).
"""

import argparse
import datetime
import json
import logging
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests

# Try loading .env if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Setup console logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("IvyHarvester")


class HarvesterConfig:
    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        output_dir: Optional[Path] = None,
        batch_size: int = 50,
        request_timeout: int = 15,
        max_retries: int = 3,
        backoff_factor: float = 1.5,
        demo_email: Optional[str] = None,
        demo_password: Optional[str] = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key or os.getenv("API_KEY", "")
        # Resolve output directory to audit/data by default
        if output_dir:
            self.output_dir = Path(output_dir)
        else:
            self.output_dir = Path(__file__).resolve().parent / "data"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.batch_size = batch_size
        self.request_timeout = request_timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.demo_email = demo_email or os.getenv("DEMO_USER_1") or os.getenv("DEMO_EMAIL") or "demo1@ivy.homes"
        self.demo_password = demo_password or os.getenv("DEMO_PASSWORD") or "acd9ab15ef"


class DataHarvester:
    def __init__(self, config: HarvesterConfig):
        self.config = config
        self.session = requests.Session()
        self.accepted_auth_header: Dict[str, str] = {}
        self.access_token: Optional[str] = None
        self.diagnostic_log: Dict[str, Any] = {
            "harvest_started_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "base_url": self.config.base_url,
            "auth_probing": {},
            "server_health": {},
            "endpoints": {},
            "discrepancies": [],
            "harvest_completed_at": None,
            "status": "in_progress"
        }

    def log_discrepancy(
        self,
        endpoint: str,
        issue_type: str,
        status_code: Optional[int] = None,
        message: str = "",
        details: Any = None
    ) -> None:
        """Capture non-200 HTTP statuses, 404s, or schema/format mismatches."""
        discrepancy = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "endpoint": endpoint,
            "issue_type": issue_type,
            "status_code": status_code,
            "message": message,
            "details": details
        }
        self.diagnostic_log["discrepancies"].append(discrepancy)
        logger.warning(f"DISCREPANCY on {endpoint}: [{issue_type}] (Status: {status_code}) - {message}")

    def attempt_login(self) -> Optional[str]:
        """Attempt login at /auth/login with demo credentials and API key."""
        login_url = f"{self.config.base_url}/auth/login"
        headers = {}
        if self.config.api_key:
            headers["X-API-Key"] = self.config.api_key
        payload = {
            "email": self.config.demo_email,
            "password": self.config.demo_password
        }
        try:
            res = self.session.post(login_url, json=payload, headers=headers, timeout=self.config.request_timeout)
            if res.status_code == 200:
                data = res.json()
                token = data.get("access_token")
                if token:
                    self.access_token = token
                    logger.info(f"Successfully logged in via /auth/login as {self.config.demo_email}")
                    return token
        except Exception as exc:
            logger.warning(f"Login attempt failed: {exc}")
        return None

    def request_with_retry(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> requests.Response:
        """Executes HTTP request with exponential backoff retry for transient network/429 issues."""
        attempt = 0
        req_headers = dict(headers or {})
        while attempt < self.config.max_retries:
            attempt += 1
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    headers=req_headers,
                    params=params,
                    timeout=self.config.request_timeout
                )
                if response.status_code == 401 and self.config.demo_email and attempt == 1:
                    # Token might be missing or expired, attempt login refresh
                    new_token = self.attempt_login()
                    if new_token:
                        req_headers["Authorization"] = f"Bearer {new_token}"
                        self.accepted_auth_header["Authorization"] = f"Bearer {new_token}"
                        continue
                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 2))
                    wait_time = max(retry_after, int(self.config.backoff_factor ** attempt))
                    logger.warning(f"Rate limited (429) on {url}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                return response
            except requests.RequestException as exc:
                if attempt >= self.config.max_retries:
                    raise
                wait_time = self.config.backoff_factor ** attempt
                logger.warning(f"Request failed ({exc}). Retrying in {wait_time:.1f}s...")
                time.sleep(wait_time)
        raise RuntimeError(f"Exceeded max retries for {url}")

    def probe_authentication(self) -> Dict[str, str]:
        """
        Tests standard API key transport methods against /health and /v1/listings:
        - x-api-key: <key>
        - Authorization: Bearer <key>
        - X-API-Key: <key>
        - X-API-Key + Authorization: Bearer <login_token>
        - No auth header
        Locks in the accepted header format.
        """
        logger.info("=== Phase 1.1: Authentication Probing ===")
        candidates = []
        if self.config.api_key:
            candidates = [
                ("x-api-key", {"x-api-key": self.config.api_key}),
                ("Authorization: Bearer", {"Authorization": f"Bearer {self.config.api_key}"}),
                ("X-API-Key", {"X-API-Key": self.config.api_key}),
            ]
        # Also include unauthenticated attempt
        candidates.append(("None (No Auth Header)", {}))

        probe_results = []
        selected_header: Optional[Dict[str, str]] = None
        selected_name: Optional[str] = None

        test_endpoints = ["/health", "/v1/listings"]

        for scheme_name, headers in candidates:
            scheme_record = {
                "scheme": scheme_name,
                "headers_tested": list(headers.keys()),
                "endpoint_results": {}
            }
            logger.info(f"Probing auth scheme: {scheme_name}")

            all_ok = True
            for ep in test_endpoints:
                url = f"{self.config.base_url}{ep}"
                try:
                    res = self.session.request("GET", url, headers=headers, timeout=self.config.request_timeout)
                    scheme_record["endpoint_results"][ep] = {
                        "status_code": res.status_code,
                        "success": res.status_code == 200
                    }
                    if res.status_code != 200:
                        all_ok = False
                except Exception as exc:
                    scheme_record["endpoint_results"][ep] = {
                        "error": str(exc),
                        "success": False
                    }
                    all_ok = False

            probe_results.append(scheme_record)
            listings_res = scheme_record["endpoint_results"].get("/v1/listings", {})
            if listings_res.get("status_code") == 200 and selected_header is None:
                selected_header = headers
                selected_name = scheme_name
                logger.info(f"-> Auth probe SUCCESS: Locked in header scheme '{scheme_name}' via /v1/listings")

        # If direct headers failed on /v1/listings, check if /auth/login is required
        if selected_header is None:
            logger.info("Direct header probing required authentication token. Attempting /auth/login probe...")
            token = self.attempt_login()
            if token:
                auth_combo = {
                    "X-API-Key": self.config.api_key,
                    "Authorization": f"Bearer {token}"
                }
                scheme_name = "X-API-Key + Bearer (POST /auth/login)"
                scheme_record = {
                    "scheme": scheme_name,
                    "headers_tested": list(auth_combo.keys()),
                    "endpoint_results": {}
                }
                url = f"{self.config.base_url}/v1/listings"
                try:
                    res = self.session.request("GET", url, headers=auth_combo, timeout=self.config.request_timeout)
                    scheme_record["endpoint_results"]["/v1/listings"] = {
                        "status_code": res.status_code,
                        "success": res.status_code == 200
                    }
                    if res.status_code == 200:
                        selected_header = auth_combo
                        selected_name = scheme_name
                        logger.info(f"-> Auth probe SUCCESS: Locked in '{scheme_name}' via /v1/listings")
                except Exception as exc:
                    scheme_record["endpoint_results"]["/v1/listings"] = {"error": str(exc), "success": False}
                probe_results.append(scheme_record)

        if selected_header is None:
            # Fallback check on /health
            for record in probe_results:
                health_res = record["endpoint_results"].get("/health", {})
                if health_res.get("status_code") == 200:
                    matching_headers = next((h for name, h in candidates if name == record["scheme"]), {})
                    selected_header = matching_headers
                    selected_name = record["scheme"]
                    logger.info(f"-> Auth probe fallback: Locked in '{selected_name}' via /health")
                    break

        if selected_header is None:
            selected_header = candidates[0][1] if candidates else {}
            selected_name = candidates[0][0] if candidates else "Default"
            self.log_discrepancy(
                endpoint="/v1/listings",
                issue_type="AUTH_PROBE_FAILED",
                status_code=None,
                message="Could not confirm working auth scheme with 200 OK. Falling back to primary candidate.",
                details={"probe_results": probe_results}
            )

        self.accepted_auth_header = selected_header
        self.diagnostic_log["auth_probing"] = {
            "selected_scheme": selected_name,
            "selected_headers": list(selected_header.keys()),
            "probe_history": probe_results
        }
        return self.accepted_auth_header

    def check_server_health(self) -> Dict[str, Any]:
        """
        Records /health to verify server availability and verifies whether the
        timestamp includes an explicit +05:30 (IST) offset.
        """
        logger.info("=== Phase 1.2: Server Clock & Health Check ===")
        url = f"{self.config.base_url}/health"
        health_info: Dict[str, Any] = {
            "endpoint": "/health",
            "is_reachable": False,
            "status_code": None,
            "timestamp_found": None,
            "has_ist_offset": False,
            "detected_offset": None,
            "clock_audit_verdict": "FAILED",
            "raw_payload": None,
            "response_headers": {}
        }

        try:
            res = self.request_with_retry("GET", url, headers=self.accepted_auth_header)
            health_info["status_code"] = res.status_code
            health_info["response_headers"] = dict(res.headers)

            if res.status_code == 200:
                health_info["is_reachable"] = True
                try:
                    payload = res.json()
                    health_info["raw_payload"] = payload
                except json.JSONDecodeError:
                    health_info["raw_payload"] = res.text
                    self.log_discrepancy(
                        endpoint="/health",
                        issue_type="INVALID_JSON_RESPONSE",
                        status_code=200,
                        message="Health endpoint returned 200 but content was not valid JSON",
                        details={"content": res.text[:200]}
                    )

                # Search for timestamp fields in payload or headers
                timestamp_candidate = None
                if isinstance(health_info["raw_payload"], dict):
                    for key in ["timestamp", "server_time", "time", "date", "datetime", "clock"]:
                        if key in health_info["raw_payload"]:
                            timestamp_candidate = str(health_info["raw_payload"][key])
                            break

                if not timestamp_candidate and "Date" in res.headers:
                    timestamp_candidate = res.headers["Date"]

                health_info["timestamp_found"] = timestamp_candidate

                # Check for explicit +05:30 (IST) offset
                if timestamp_candidate:
                    ist_match = re.search(r"(\+05:?30|IST)", timestamp_candidate, re.IGNORECASE)
                    if ist_match:
                        health_info["has_ist_offset"] = True
                        health_info["detected_offset"] = ist_match.group(0)
                        health_info["clock_audit_verdict"] = "PASSED_IST"
                        logger.info(f"Clock Check: Verified explicit IST (+05:30) offset in '{timestamp_candidate}'")
                    else:
                        health_info["has_ist_offset"] = False
                        offset_match = re.search(r"([+-]\d{2}:?\d{2}|Z|UTC|GMT)", timestamp_candidate)
                        health_info["detected_offset"] = offset_match.group(0) if offset_match else "None"
                        health_info["clock_audit_verdict"] = "NON_IST_OFFSET"
                        self.log_discrepancy(
                            endpoint="/health",
                            issue_type="CLOCK_OFFSET_MISMATCH",
                            status_code=200,
                            message=f"Timestamp '{timestamp_candidate}' does not include explicit +05:30 (IST) offset.",
                            details={"detected_offset": health_info["detected_offset"]}
                        )
                else:
                    self.log_discrepancy(
                        endpoint="/health",
                        issue_type="TIMESTAMP_MISSING",
                        status_code=200,
                        message="No recognizable timestamp field found in /health response payload or headers."
                    )
            else:
                self.log_discrepancy(
                    endpoint="/health",
                    issue_type="HTTP_ERROR",
                    status_code=res.status_code,
                    message=f"/health endpoint returned non-200 status code: {res.status_code}"
                )
        except Exception as exc:
            self.log_discrepancy(
                endpoint="/health",
                issue_type="CONNECTION_ERROR",
                status_code=None,
                message=f"Failed to connect to /health: {exc}"
            )

        self.diagnostic_log["server_health"] = health_info
        return health_info

    def _extract_items_from_envelope(
        self,
        endpoint_name: str,
        payload: Any
    ) -> Tuple[List[Any], Dict[str, Any]]:
        """
        Dynamically handles varied JSON envelopes:
        - data, listings, rentals, projects, analytics, results, items
        - direct lists
        Returns (items_list, metadata_dict).
        """
        if isinstance(payload, list):
            return payload, {"envelope_type": "direct_list", "count": len(payload)}

        if isinstance(payload, dict):
            # Known envelope keys
            possible_keys = [
                endpoint_name.lstrip("/v1/").replace("-", "_"),
                "data",
                "items",
                "results",
                "records",
                "listings",
                "rentals",
                "projects",
                "analytics"
            ]
            for key in possible_keys:
                if key in payload and isinstance(payload[key], list):
                    meta = {k: v for k, v in payload.items() if k != key}
                    meta["envelope_type"] = f"dict.{key}"
                    return payload[key], meta

            # If dict has a single key containing a list
            for key, val in payload.items():
                if isinstance(val, list):
                    meta = {k: v for k, v in payload.items() if k != key}
                    meta["envelope_type"] = f"dict.{key}"
                    return val, meta

            # Dict with no list
            return [payload], {"envelope_type": "single_dict_record"}

        return [], {"envelope_type": "unknown_type", "type": str(type(payload))}

    def harvest_endpoint(
        self,
        endpoint: str,
        raw_output_filename: str
    ) -> Dict[str, Any]:
        """
        Iterates over pagination offsets.
        Dynamically handles envelopes and auto-detects stopping conditions:
        - has_more: false
        - total reached
        - empty batch or batch < limit
        Dumps unmutated JSON to disk.
        """
        logger.info(f"=== Harvesting Endpoint: {endpoint} -> {raw_output_filename} ===")
        url = f"{self.config.base_url}{endpoint}"
        endpoint_meta = {
            "endpoint": endpoint,
            "status": "pending",
            "total_pages_fetched": 0,
            "total_records_harvested": 0,
            "envelope_detected": None,
            "stop_reason": None,
            "pages": []
        }

        raw_batches: List[Any] = []
        all_records: List[Any] = []

        offset = 0
        page_num = 1
        max_pages = 500  # Guard against runaway pagination

        while page_num <= max_pages:
            params = {
                "offset": offset,
                "limit": self.config.batch_size,
                "page": page_num
            }

            try:
                res = self.request_with_retry("GET", url, headers=self.accepted_auth_header, params=params)
            except Exception as exc:
                self.log_discrepancy(
                    endpoint=endpoint,
                    issue_type="REQUEST_FAILED",
                    status_code=None,
                    message=f"Request failed at offset {offset}: {exc}",
                    details={"params": params}
                )
                endpoint_meta["stop_reason"] = f"Request error: {exc}"
                break

            if res.status_code != 200:
                self.log_discrepancy(
                    endpoint=endpoint,
                    issue_type="NON_200_STATUS",
                    status_code=res.status_code,
                    message=f"Endpoint returned HTTP {res.status_code} at offset {offset}",
                    details={"params": params, "response_sample": res.text[:200]}
                )
                endpoint_meta["stop_reason"] = f"HTTP {res.status_code}"
                break

            try:
                raw_payload = res.json()
            except json.JSONDecodeError:
                self.log_discrepancy(
                    endpoint=endpoint,
                    issue_type="INVALID_JSON",
                    status_code=res.status_code,
                    message=f"Endpoint returned invalid JSON at offset {offset}",
                    details={"params": params, "content_snippet": res.text[:200]}
                )
                endpoint_meta["stop_reason"] = "Invalid JSON"
                break

            # Preserve unmutated payload batch
            raw_batches.append(raw_payload)

            items, envelope_meta = self._extract_items_from_envelope(endpoint, raw_payload)
            if not endpoint_meta["envelope_detected"]:
                endpoint_meta["envelope_detected"] = envelope_meta.get("envelope_type")

            all_records.extend(items)
            batch_count = len(items)

            page_record = {
                "page": page_num,
                "offset": offset,
                "records_in_batch": batch_count,
                "meta": envelope_meta
            }
            endpoint_meta["pages"].append(page_record)
            logger.info(f"{endpoint} [Page {page_num} | Offset {offset}]: Harvested {batch_count} records")

            # Check stopping conditions:
            # 1. Empty batch
            if batch_count == 0:
                endpoint_meta["stop_reason"] = "Empty batch received (0 items)"
                break

            # 2. Envelope explicitly states has_more: false
            if isinstance(raw_payload, dict):
                has_more = raw_payload.get("has_more")
                if has_more is False:
                    endpoint_meta["stop_reason"] = "Envelope specified has_more: false"
                    break

                # 3. Total count reached
                total = raw_payload.get("total") or envelope_meta.get("total")
                if isinstance(total, int) and len(all_records) >= total:
                    endpoint_meta["stop_reason"] = f"Total count reached ({len(all_records)} >= {total})"
                    break

            # 4. Direct list or single payload smaller than batch_size
            if envelope_meta.get("envelope_type") == "single_dict_record":
                endpoint_meta["stop_reason"] = "Single record envelope (non-paginated)"
                break

            if batch_count < self.config.batch_size:
                endpoint_meta["stop_reason"] = f"Batch size ({batch_count}) < requested limit ({self.config.batch_size})"
                break

            offset += batch_count
            page_num += 1

        endpoint_meta["total_pages_fetched"] = len(raw_batches)
        endpoint_meta["total_records_harvested"] = len(all_records)
        endpoint_meta["status"] = "completed" if len(raw_batches) > 0 else "empty_or_failed"

        # Local Raw Persistence: Dumps unmutated JSON files to disk
        output_path = self.config.output_dir / raw_output_filename
        raw_storage_payload = {
            "endpoint": endpoint,
            "harvested_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "records_count": len(all_records),
            "pages_count": len(raw_batches),
            "stop_reason": endpoint_meta["stop_reason"],
            "raw_batches": raw_batches,
            "data": all_records
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(raw_storage_payload, f, indent=2, ensure_ascii=False)

        logger.info(
            f"Successfully persisted raw data to {output_path} "
            f"({len(all_records)} total records, {len(raw_batches)} pages)"
        )
        self.diagnostic_log["endpoints"][endpoint] = endpoint_meta
        return endpoint_meta

    def run(self) -> Dict[str, Any]:
        """Orchestrate Phase 1 Harvesting."""
        logger.info(f"Starting Phase 1 Harvesting against Base URL: {self.config.base_url}")
        logger.info(f"Data output directory: {self.config.output_dir}")

        # Step 1: Authentication Probing
        self.probe_authentication()

        # Step 2: Server Clock & Health Check
        self.check_server_health()

        # Step 3: Dataset Harvesting
        target_endpoints = [
            ("/v1/listings", "raw_listings.json"),
            ("/v1/rentals", "raw_rentals.json"),
            ("/v1/projects", "raw_projects.json"),
            ("/v1/localities", "raw_localities.json"),
            ("/v1/analytics", "raw_analytics.json"),
        ]

        for ep, filename in target_endpoints:
            self.harvest_endpoint(ep, filename)

        # Step 4: Discrepancy & Diagnostic Log Persistence
        self.diagnostic_log["harvest_completed_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.diagnostic_log["status"] = "completed"

        diag_path = self.config.output_dir / "diagnostic_log.json"
        with open(diag_path, "w", encoding="utf-8") as f:
            json.dump(self.diagnostic_log, f, indent=2, ensure_ascii=False)

        logger.info(f"Diagnostic log saved to: {diag_path}")
        logger.info("=== Phase 1 Harvesting Complete ===")
        return self.diagnostic_log


def main():
    parser = argparse.ArgumentParser(
        description="Phase 1 Data Harvester - Probing, Clock Check, Dataset Harvesting & Local Raw Persistence"
    )
    parser.add_argument(
        "--base-url",
        type=str,
        default=os.getenv("API_BASE_URL"),
        help="API Base URL (e.g. https://api.example.com or http://localhost:8000). Also reads from API_BASE_URL env var."
    )
    parser.add_argument(
        "--api-key",
        type=str,
        default=os.getenv("API_KEY"),
        help="API Key for authentication. Also reads from API_KEY env var."
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Custom output directory. Defaults to audit/data/"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="Batch size for pagination requests. Default: 50"
    )

    args = parser.parse_args()

    if not args.base_url:
        logger.error(
            "Missing API Base URL! Please provide it via --base-url <URL> or set API_BASE_URL in .env / environment."
        )
        logger.info("Example usage:")
        logger.info("  python harvest.py --base-url https://api.ivyhomes.com --api-key YOUR_KEY")
        sys.exit(1)

    config = HarvesterConfig(
        base_url=args.base_url,
        api_key=args.api_key,
        output_dir=args.output_dir,
        batch_size=args.batch_size
    )

    harvester = DataHarvester(config)
    harvester.run()


if __name__ == "__main__":
    main()
