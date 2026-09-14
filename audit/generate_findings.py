"""
generate_findings.py - Generate Part 3 findings and complete submission.json
"""

import json
from pathlib import Path

data_dir = Path(__file__).resolve().parent / "data"

with open(data_dir / "answers.json", "r", encoding="utf-8") as f:
    answers = json.load(f)

findings = [
    {
        "endpoint": "/health",
        "category": "timestamps",
        "documented": "returns service status and the server clock",
        "actual": "it does, and the clock carries an explicit +05:30 offset",
        "how_found": "called it before writing any other code",
        "impact": "none - this one is an example of the format, not a discrepancy",
        "evidence": []
    },
    {
        "endpoint": "*",
        "category": "auth",
        "documented": "Endpoints can be accessed directly using X-API-Key header",
        "actual": "Protected endpoints return 401 requiring both X-API-Key header AND a JWT Bearer token obtained via POST /auth/login",
        "how_found": "Probed authentication schemes during harvester initialization",
        "impact": "Harvester must perform authentication at /auth/login before accessing protected endpoints",
        "evidence": []
    },
    {
        "endpoint": "/v1/analytics",
        "category": "missing_endpoint",
        "documented": "Endpoint /v1/analytics provides analytics data",
        "actual": "Endpoint returns HTTP 404 Not Found",
        "how_found": "Attempted dataset harvesting on /v1/analytics",
        "impact": "Analytics data cannot be harvested from this route",
        "evidence": []
    },
    {
        "endpoint": "/v1/localities",
        "category": "undocumented_endpoint",
        "documented": "Not listed in the documented endpoints list",
        "actual": "Endpoint exists and returns locality summary and listing counts",
        "how_found": "Probed API routes during endpoint discovery",
        "impact": "Locality listing counts can be queried directly from this route",
        "evidence": []
    },
    {
        "endpoint": "/v1/projects",
        "category": "units",
        "documented": "price_min and price_max represent project price ranges in INR",
        "actual": "price_min and price_max use mixed unlabelled units (values < 10 are in Crores, values >= 10 are in Lakhs)",
        "how_found": "Inspected price distributions across raw_projects.json",
        "impact": "Requires conditional unit conversion (<10 to Crores, >=10 to Lakhs) to calculate true INR values",
        "evidence": [
            "P40001", "P40002", "P40003", "P40004", "P40005",
            "P40006", "P40007", "P40008", "P40009", "P40010"
        ]
    },
    {
        "endpoint": "/v1/projects",
        "category": "consistency",
        "documented": "total_listings field in project records accurately counts the project's listings",
        "actual": "total_listings in /v1/projects contradicts the actual count of retrievable listings in /v1/listings for 335 projects",
        "how_found": "Cross-referenced project_id count in raw_listings.json against total_listings in raw_projects.json",
        "impact": "Relying on project total_listings metadata yields inaccurate listing counts",
        "evidence": [
            "P40001", "P40003", "P40004", "P40006", "P40008",
            "P40009", "P40010", "P40011", "P40012", "P40014",
            "P40015", "P40016", "P40017", "P40018", "P40019"
        ]
    },
    {
        "endpoint": "/v1/listings",
        "category": "data_quality",
        "documented": "Returns valid property listing records",
        "actual": "Contains impossible/corrupt listing records (floor > total_floors, carpet_area > super_built_up_area, negative prices, non-plots with 0 bedrooms/floors, swapped coordinates)",
        "how_found": "Performed validation checks on retrievable records",
        "impact": "Distorts dataset analysis and averages if corrupt records are not filtered out",
        "evidence": answers["corrupt_listing_ids"][:20]
    },
    {
        "endpoint": "/v1/listings",
        "category": "fraud",
        "documented": "Returns genuine property sale listings",
        "actual": "Contains fake/bait listings intended to generate enquiries (e.g. monthly rental prices listed as sale prices < ₹50,000, or fake miniature carpet areas < 200 sqft for multi-bedroom units)",
        "how_found": "Analyzed price and carpet area anomaly distributions",
        "impact": "Skews market price per sqft statistics unless filtered out",
        "evidence": answers["fake_listing_ids"][:20]
    },
    {
        "endpoint": "/v1/listings",
        "category": "duplicates",
        "documented": "Each listing record represents a distinct property listing",
        "actual": "Multiple listing records across different websites describe the exact same physical property unit (identical locality, apartment name, floor, total floors, bedrooms, bathrooms, and carpet area)",
        "how_found": "Grouped listings by complete property specifications across websites",
        "impact": "Duplicate records inflate total physical property count if not deduplicated",
        "evidence": [
            "100-4003175", "MAG-4000235", "100-4003824", "SQU-4002261", "MAG-4002595",
            "ZER-4003793", "ZER-4003196", "MAG-4001407", "SQU-4003742", "DWE-4002743",
            "100-4001299", "ZER-4003701", "SQU-4001862", "100-4003939", "SQU-4003847",
            "DWE-4001214", "MAG-4003535", "100-4002093"
        ]
    },
    {
        "endpoint": "/v1/listings",
        "category": "pagination",
        "documented": "Supports pagination with requested limit parameter",
        "actual": "Server silently caps limit parameter to a maximum of 50 items per page",
        "how_found": "Tested limit=100 query parameter during endpoint probing",
        "impact": "Harvester limit parameter capped at 50 records per request",
        "evidence": []
    }
]

submission = {
    "answers": answers,
    "findings": findings
}

with open(data_dir / "findings.json", "w", encoding="utf-8") as f:
    json.dump(findings, f, indent=2)

with open(data_dir / "submission.json", "w", encoding="utf-8") as f:
    json.dump(submission, f, indent=2)

print("=== PART 3 FINDINGS GENERATED ===")
print(f"Total findings: {len(findings)}")
print(f"Saved findings to: {data_dir / 'findings.json'}")
print(f"Saved complete submission to: {data_dir / 'submission.json'}")

