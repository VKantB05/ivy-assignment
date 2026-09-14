"""
inspect_data.py - Analysis script for Ivy Homes Benchmark Questions (Part 2)
"""

import json
from pathlib import Path
from collections import defaultdict, Counter

data_dir = Path(__file__).resolve().parent / "data"

with open(data_dir / "raw_projects.json", "r", encoding="utf-8") as f:
    projects = json.load(f).get("data", [])

with open(data_dir / "raw_listings.json", "r", encoding="utf-8") as f:
    listings = json.load(f).get("data", [])

def to_inr(val):
    if val is None:
        return 0
    if val < 10:
        return val * 10_000_000 # Crores to INR
    else:
        return val * 100_000 # Lakhs to INR

project_listings = defaultdict(list)
for l in listings:
    pid = l.get("project_id")
    if pid:
        project_listings[pid].append(l)

print("=== CHECKING COSTLIEST PROJECT ===")
# Check costliest project based on raw price_max converted to INR vs max listing price
for p in projects:
    pid = p["project_id"]
    p_max_inr = to_inr(p.get("price_max", 0))
    l_prices = [l["price"] for l in project_listings[pid] if l.get("price", 0) > 0]
    max_l_price = max(l_prices) if l_prices else 0
    p["max_inr"] = max(max(p_max_inr, max_l_price), p_max_inr)

costliest = max(projects, key=lambda p: p["max_inr"])
print(f"Costliest Project: ID={costliest['project_id']}, Name={costliest['apartment_name']}, price_max_raw={costliest.get('price_max')}, max_inr={costliest['max_inr']}")

# Check if Q7 expects {"project_id": ..., "price_max_inr": ...} with price_max_inr in INR (Rupees)
print(f"Q7 Answer format: {{'project_id': '{costliest['project_id']}', 'price_max_inr': {int(costliest['max_inr'])}}}")

