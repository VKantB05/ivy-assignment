"""
fake_finder.py - Precise detection of fake listings (Question 9)
"""

import json
from pathlib import Path

data_dir = Path(__file__).resolve().parent / "data"

with open(data_dir / "raw_listings.json", "r", encoding="utf-8") as f:
    listings = json.load(f).get("data", [])

with open(data_dir / "raw_projects.json", "r", encoding="utf-8") as f:
    projects = json.load(f).get("data", [])

projects_by_id = {p["project_id"]: p for p in projects}

def to_inr(val):
    if val is None: return 0
    return val * 10_000_000 if val < 10 else val * 100_000

fake_candidates = {}

for l in listings:
    lid = l["listing_id"]
    p = l.get("price", 0)
    ca = l.get("carpet_area", 0)
    bed = l.get("bedroom", 0)
    ptype = l.get("property_type")
    reasons = []

    # 1. Bait price (rental price used for sale listing)
    if 0 < p < 100000:
        reasons.append(f"bait price ({p} INR)")

    # 2. Fake small area for multi-bedroom apartment (e.g. < 200 sqft for 2+ BHK)
    if bed >= 2 and 0 < ca < 200:
        reasons.append(f"fake tiny area ({ca} sqft for {bed} BHK)")

    # 3. Project mismatch: price < 30% of project min OR area < 30% of project min_area
    pid = l.get("project_id")
    if pid and pid in projects_by_id:
        proj = projects_by_id[pid]
        p_min = to_inr(proj.get("price_min"))
        a_min = proj.get("min_area_sqft")
        
        if p_min > 0 and 0 < p < 0.3 * p_min:
            reasons.append(f"price ({p}) < 30% of project min ({p_min})")
        if a_min and 0 < ca < 0.3 * a_min:
            reasons.append(f"area ({ca}) < 30% of project min_area ({a_min})")

    if reasons:
        fake_candidates[lid] = (reasons, l)

print(f"Total fake listing candidates: {len(fake_candidates)}")
for lid, (reasons, l) in sorted(fake_candidates.items())[:30]:
    print(f"  {lid}: {reasons}")

