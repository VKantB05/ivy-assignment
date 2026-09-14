"""
fake_deep_dive.py - Deep dive into fake listings detection
"""

import json
from pathlib import Path

data_dir = Path(__file__).resolve().parent / "data"

with open(data_dir / "raw_listings.json", "r", encoding="utf-8") as f:
    listings = json.load(f).get("data", [])

print("=== 1. SEARCHING DESCRIPTIONS FOR FAKE/DEMO/CLICKBAIT KEYWORDS ===")
keywords = ["fake", "demo", "clickbait", "enquiry", "inquiry", "sample", "test", "lead", "dummy", "placeholder", "call for", "special offer", "unbelievable", "discount", "urgent"]

keyword_matches = []
for l in listings:
    desc = str(l.get("description", "")).lower()
    matched = [k for k in keywords if k in desc]
    if matched:
        keyword_matches.append((l["listing_id"], matched, desc[:100]))

print(f"Listings matching description keywords: {len(keyword_matches)}")
for lid, m, snippet in keyword_matches[:10]:
    print(f"  {lid}: {m} -> {snippet}")

print("\n=== 2. EXAMINING ABSURDLY LOW PRICES (e.g. price < 500,000 INR) ===")
low_price_listings = [l for l in listings if 0 < l.get("price", 0) < 500000]
print(f"Listings with price < 5 Lakhs: {len(low_price_listings)}")
for l in low_price_listings[:10]:
    print(f"  ID: {l['listing_id']} | Type: {l.get('property_type')} | Price: {l.get('price')} | Bed: {l.get('bedroom')} | Area: {l.get('carpet_area')} | Locality: {l.get('locality')}")

print("\n=== 3. EXAMINING PRICE PER SQFT DISTRIBUTION ===")
ppsqft_list = [(l["price"] / l["carpet_area"], l) for l in listings if l.get("price", 0) > 0 and l.get("carpet_area", 0) > 0]
ppsqft_list.sort(key=lambda x: x[0])

print("Lowest 20 price_per_sqft listings:")
for rate, l in ppsqft_list[:20]:
    print(f"  ID: {l['listing_id']} | ppsqft: {rate:.2f} | price: {l.get('price')} | area: {l.get('carpet_area')} | ptype: {l.get('property_type')} | locality: {l.get('locality')}")

print("\nHighest 10 price_per_sqft listings:")
for rate, l in ppsqft_list[-10:]:
    print(f"  ID: {l['listing_id']} | ppsqft: {rate:.2f} | price: {l.get('price')} | area: {l.get('carpet_area')} | ptype: {l.get('property_type')} | locality: {l.get('locality')}")

