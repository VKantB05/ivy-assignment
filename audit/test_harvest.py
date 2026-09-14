"""
test_harvest.py - Unit and Integration Mock Tests for Phase 1 Data Harvester
"""

import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from harvest import DataHarvester, HarvesterConfig


class MockServerHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Silence default stderr logging
        pass

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        # 1. Health check endpoint with explicit +05:30 IST offset
        if path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response_data = {
                "status": "healthy",
                "timestamp": "2026-09-13T16:50:00+05:30",
                "service": "ivy-property-service"
            }
            self.wfile.write(json.dumps(response_data).encode("utf-8"))
            return

        # 2. Auth check for /v1/* endpoints
        auth_key = (
            self.headers.get("x-api-key")
            or self.headers.get("X-API-Key")
            or (
                self.headers.get("Authorization", "").replace("Bearer ", "")
                if "Bearer " in self.headers.get("Authorization", "")
                else None
            )
        )

        if auth_key != "secret-test-token":
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
            return

        # 3. /v1/listings endpoint with data envelope & pagination
        if path == "/v1/listings":
            offset = int(query.get("offset", [0])[0])
            all_listings = [
                {"id": "L1", "title": "2BHK Koramangala", "price": 8500000},
                {"id": "L2", "title": "3BHK Indiranagar", "price": 14500000},
                {"id": "L3", "title": "1BHK HSR Layout", "price": 4500000},
            ]
            batch = all_listings[offset : offset + 2]
            has_more = (offset + len(batch)) < len(all_listings)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(
                json.dumps({
                    "data": batch,
                    "offset": offset,
                    "has_more": has_more,
                    "total": len(all_listings)
                }).encode("utf-8")
            )
            return

        # 4. /v1/rentals endpoint with rentals envelope
        if path == "/v1/rentals":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(
                json.dumps({
                    "rentals": [
                        {"id": "R1", "rent": 35000, "deposit": 150000},
                    ],
                    "has_more": False
                }).encode("utf-8")
            )
            return

        # 5. /v1/projects endpoint returns 404 (to test discrepancy logging)
        if path == "/v1/projects":
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))
            return

        # 6. /v1/analytics endpoint returns direct list
        if path == "/v1/analytics":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps([]).encode("utf-8"))
            return

        # Default 404
        self.send_response(404)
        self.end_headers()


def run_mock_test():
    server = HTTPServer(("127.0.0.1", 8998), MockServerHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    test_output_dir = Path(__file__).resolve().parent / "data"
    test_output_dir.mkdir(parents=True, exist_ok=True)

    config = HarvesterConfig(
        base_url="http://127.0.0.1:8998",
        api_key="secret-test-token",
        output_dir=test_output_dir,
        batch_size=2
    )

    try:
        harvester = DataHarvester(config)
        diag = harvester.run()

        # Assertions
        assert diag["server_health"]["has_ist_offset"] is True, "IST offset check failed"
        assert diag["server_health"]["clock_audit_verdict"] == "PASSED_IST", "Clock audit verdict mismatch"
        assert (test_output_dir / "raw_listings.json").exists(), "raw_listings.json was not created"
        assert (test_output_dir / "raw_rentals.json").exists(), "raw_rentals.json was not created"
        assert (test_output_dir / "raw_projects.json").exists(), "raw_projects.json was not created"
        assert (test_output_dir / "raw_analytics.json").exists(), "raw_analytics.json was not created"
        assert (test_output_dir / "diagnostic_log.json").exists(), "diagnostic_log.json was not created"

        with open(test_output_dir / "raw_listings.json", "r", encoding="utf-8") as f:
            listings_data = json.load(f)
            assert len(listings_data["data"]) == 3, f"Expected 3 listings, got {len(listings_data['data'])}"
            assert listings_data["pages_count"] == 2, f"Expected 2 pages, got {listings_data['pages_count']}"

        # Check discrepancy logging captured the 404 on /v1/projects
        discrepancies = diag["discrepancies"]
        project_404 = any(d["endpoint"] == "/v1/projects" and d["status_code"] == 404 for d in discrepancies)
        assert project_404, "404 discrepancy for /v1/projects was not logged"

        print("ALL TESTS PASSED SUCCESSFULLY!")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    run_mock_test()
