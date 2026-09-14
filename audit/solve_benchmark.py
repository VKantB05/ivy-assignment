"""
solve_benchmark.py - Comprehensive solver and audit script for Part 2 Benchmark Questions
"""

import json
import datetime
from pathlib import Path
from collections import defaultdict, Counter

data_dir = Path(__file__).resolve().parent / "data"

with open(data_dir / "raw_listings.json", "r", encoding="utf-8") as f:
    listings = json.load(f).get("data", [])

with open(data_dir / "raw_rentals.json", "r", encoding="utf-8") as f:
    rentals = json.load(f).get("data", [])

with open(data_dir / "raw_projects.json", "r", encoding="utf-8") as f:
    projects = json.load(f).get("data", [])

with open(data_dir / "raw_localities.json", "r", encoding="utf-8") as f:
    localities = json.load(f).get("data", [])

# Reference moment
REF_DT = datetime.datetime.fromisoformat("2026-09-10T00:00:00+05:30")
START_7D_DT = REF_DT - datetime.timedelta(days=7)

# -------------------------------------------------------------
# Q1: total_listing_records
# -------------------------------------------------------------
q1_total_listing_records = len(listings)

# -------------------------------------------------------------
# Q3: active_listings
# -------------------------------------------------------------
q3_active_listings = sum(1 for l in listings if l.get("is_live") is True)

# -------------------------------------------------------------
# Q4: corrupt_listing_ids
# Definition: Records describing something physically/logically impossible in real estate
# -------------------------------------------------------------
corrupt_ids = []
corrupt_reasons = {}

for l in listings:
    lid = l["listing_id"]
    ptype = l.get("property_type")
    reasons = []

    # 1. Negative or zero price for a listing
    price = l.get("price")
    if price is not None and price <= 0:
        reasons.append(f"negative/zero price ({price})")

    # 2. Floor > total_floors or negative floor
    fl = l.get("floor")
    tot_fl = l.get("total_floors")
    if fl is not None and tot_fl is not None and tot_fl > 0:
        if fl > tot_fl:
            reasons.append(f"floor ({fl}) > total_floors ({tot_fl})")
    if fl is not None and fl < 0:
        reasons.append(f"negative floor ({fl})")

    # 3. Carpet area > super built up area
    ca = l.get("carpet_area")
    sba = l.get("super_built_up_area")
    if ca is not None and sba is not None and ca > 0 and sba > 0:
        if ca > sba:
            reasons.append(f"carpet_area ({ca}) > super_built_up_area ({sba})")

    # 4. Swapped coordinates (Lat should be ~13, Long should be ~80 for Chennai)
    lat = l.get("latitude", 0)
    lon = l.get("longitude", 0)
    if lat > 50 or lon < 50:
        reasons.append(f"swapped/invalid coords (lat={lat}, lon={lon})")

    # 5. Non-plot with 0 bedrooms, 0 bathrooms, or 0 total_floors
    if ptype != "plot":
        if l.get("bedroom", 0) <= 0:
            reasons.append(f"non-plot with bedroom={l.get('bedroom')}")
        if l.get("bathroom", 0) <= 0:
            reasons.append(f"non-plot with bathroom={l.get('bathroom')}")
        if l.get("total_floors", 0) <= 0:
            reasons.append(f"non-plot with total_floors={l.get('total_floors')}")

    if reasons:
        corrupt_ids.append(lid)
        corrupt_reasons[lid] = reasons

q4_corrupt_listing_ids = sorted(corrupt_ids)

# -------------------------------------------------------------
# Q5: total_monthly_rent (for assigned locality: Velachery)
# -------------------------------------------------------------
velachery_rentals = [r for r in rentals if r.get("locality", "").lower() == "velachery"]
q5_total_monthly_rent = sum(r.get("price", 0) for r in velachery_rentals)

# -------------------------------------------------------------
# Q7: costliest_project
# -------------------------------------------------------------
def to_inr(val):
    if val is None:
        return 0
    return val * 10_000_000 if val < 10 else val * 100_000

costliest = max(projects, key=lambda p: to_inr(p.get("price_max", 0)))
q7_costliest_project = {
    "project_id": costliest["project_id"],
    "price_max_inr": int(to_inr(costliest.get("price_max", 0)))
}

# -------------------------------------------------------------
# Q8: listings_last_7_days
# Window: [2026-09-03T00:00:00+05:30, 2026-09-10T00:00:00+05:30)
# -------------------------------------------------------------
count_7d = 0
for l in listings:
    pstr = l.get("posted_at")
    if pstr:
        pdt = datetime.datetime.fromisoformat(pstr)
        pdt_ist = pdt.astimezone(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))
        if START_7D_DT <= pdt_ist < REF_DT:
            count_7d += 1

q8_listings_last_7_days = count_7d

# -------------------------------------------------------------
# Q9: fake_listing_ids
# Listings that are not real, existing solely to generate enquiries
# -------------------------------------------------------------
projects_by_id = {p["project_id"]: p for p in projects}
fake_ids = []
fake_reasons = {}

for l in listings:
    lid = l["listing_id"]
    if lid in q4_corrupt_listing_ids:
        continue # Don't double count corrupt listings as fake

    p = l.get("price", 0)
    ca = l.get("carpet_area", 0)
    bed = l.get("bedroom", 0)
    ptype = l.get("property_type")
    reasons = []

    # 1. Monthly rental amount listed as sale price (< 50,000 INR)
    if 0 < p < 50000:
        reasons.append(f"bait price ({p} INR)")

    # 2. Fake miniature area for multi-bedroom unit (< 200 sqft for 2+ BHK)
    if ptype != "plot" and bed >= 2 and 0 < ca < 200:
        reasons.append(f"fake tiny area ({ca} sqft for {bed} BHK)")

    if reasons:
        fake_ids.append(lid)
        fake_reasons[lid] = reasons

q9_fake_listing_ids = sorted(fake_ids)

# -------------------------------------------------------------
# Q2: unique_properties
# Among all records, genuine or not, distinct physical properties described
# Property signature: (locality, apartment_name, floor, total_floors, bedroom, bathroom, carpet_area, property_type)
# -------------------------------------------------------------
property_specs = set()
for l in listings:
    spec = (
        l.get("locality"),
        l.get("apartment_name"),
        l.get("floor"),
        l.get("total_floors"),
        l.get("bedroom"),
        l.get("bathroom"),
        l.get("carpet_area"),
        l.get("property_type")
    )
    property_specs.add(spec)

q2_unique_properties = len(property_specs)

# -------------------------------------------------------------
# Q6: avg_price_per_sqft_2bhk
# Active 2BHK listings, excluding Q4 (corrupt) and Q9 (fake)
# Mean of (price / carpet_area), rounded to 2 decimals
# -------------------------------------------------------------
excluded_ids = set(q4_corrupt_listing_ids) | set(q9_fake_listing_ids)
valid_2bhk_rates = []

for l in listings:
    lid = l["listing_id"]
    if lid in excluded_ids:
        continue
    if l.get("is_live") is True and l.get("bedroom") == 2:
        p = l.get("price", 0)
        ca = l.get("carpet_area", 0)
        if p > 0 and ca > 0:
            valid_2bhk_rates.append(p / ca)

q6_avg_price_per_sqft_2bhk = round(sum(valid_2bhk_rates) / len(valid_2bhk_rates), 2) if valid_2bhk_rates else 0.0

# -------------------------------------------------------------
# Q10: projects_with_wrong_listing_count
# -------------------------------------------------------------
project_listing_counts = defaultdict(int)
for l in listings:
    pid = l.get("project_id")
    if pid:
        project_listing_counts[pid] += 1

wrong_projects_count = 0
for p in projects:
    pid = p["project_id"]
    reported = p.get("total_listings", 0)
    actual = project_listing_counts[pid]
    if reported != actual:
        wrong_projects_count += 1

q10_projects_with_wrong_listing_count = wrong_projects_count

# -------------------------------------------------------------
# Summary Output
# -------------------------------------------------------------
answers = {
    "total_listing_records": q1_total_listing_records,
    "unique_properties": q2_unique_properties,
    "active_listings": q3_active_listings,
    "corrupt_listing_ids": q4_corrupt_listing_ids,
    "total_monthly_rent": q5_total_monthly_rent,
    "avg_price_per_sqft_2bhk": q6_avg_price_per_sqft_2bhk,
    "costliest_project": q7_costliest_project,
    "listings_last_7_days": q8_listings_last_7_days,
    "fake_listing_ids": q9_fake_listing_ids,
    "projects_with_wrong_listing_count": q10_projects_with_wrong_listing_count
}

print("=== BENCHMARK ANSWERS SUMMARY ===")
print(json.dumps(answers, indent=2))

with open(data_dir / "answers.json", "w", encoding="utf-8") as f:
    json.dump(answers, f, indent=2)

print(f"\nAnswers saved to {data_dir / 'answers.json'}")

