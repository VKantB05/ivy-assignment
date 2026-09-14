"""
analyze_fake_patterns.py - Statistical analysis of listings to find fake listings signature
"""

import json
from pathlib import Path
from collections import defaultdict, Counter

data_dir = Path(__file__).resolve().parent / "data"

with open(data_dir / "raw_listings.json", "r", encoding="utf-8") as f:
    listings = json.load(f).get("data", [])

with open(data_dir / "raw_projects.json", "r", encoding="utf-8") as f:
    projects = json.load(f).get("data", [])

projects_by_id = {p["project_id"]: p for p in projects}

print("=== CHECKING FOR EXACT DUPLICATES / CROSS-LISTINGS ===")
# Are fake listings duplicates created across multiple sites with different contact numbers?
spec_to_listings = defaultdict(list)
for l in listings:
    key = (l.get("apartment_name"), l.get("locality"), l.get("floor"), l.get("bedroom"), l.get("carpet_area"), l.get("price"))
    spec_to_listings[key].append(l)

multi_site_specs = {k: v for k, v in spec_to_listings.items() if len(v) > 1}
print(f"Exact property spec match count: {len(multi_site_specs)}")

print("\n=== CHECKING WEBSITE DISTRIBUTION ===")
print(Counter(l.get("website") for l in listings))

print("\n=== CHECKING VERIFIED STATUS VS LOW PRICE / TINY AREA ===")
print("is_verified values:", Counter(l.get("is_verified") for l in listings))

# Check listings where is_verified is False vs True
unverified = [l for l in listings if l.get("is_verified") is False]
print(f"Total unverified listings: {len(unverified)}")

# Check description text patterns for lead/enquiry generation
print("\n=== CHECKING DESCRIPTION PHRASES FOR ENQUIRY GENERATION ===")
enquiry_phrases = ["contact for price", "call for price", "price on request", "inquire", "enquire", "urgent", "relocating", "offer", "discount", "call now", "contact agent"]
for phrase in enquiry_phrases:
    cnt = sum(1 for l in listings if phrase in str(l.get("description", "")).lower())
    print(f"  '{phrase}': {cnt} listings")

# Check listings where price is absurdly low (< 50,000 INR)
low_prices = [l["listing_id"] for l in listings if 0 < l.get("price", 0) < 50000]
print(f"\nListings with price < 50,000 INR: {len(low_prices)}")

# Check listings where carpet area < 200 sqft for non-plots
tiny_areas = [l["listing_id"] for l in listings if l.get("property_type") != "plot" and 0 < l.get("carpet_area", 0) < 200]
print(f"Listings with carpet_area < 200 sqft for non-plots: {len(tiny_areas)}")

# Check listings posted by 'agent' vs 'owner' vs 'builder'
print("\nposted_by values:", Counter(l.get("posted_by") for l in listings))

