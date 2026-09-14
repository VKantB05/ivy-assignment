"""
fake_analysis.py - Deep dive analysis to detect fake listings
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

print("=== 1. CHECKING CONTACT NUMBERS & POSTED_BY_NAME ===")
contacts = Counter(l.get("posted_by_contact") for l in listings)
print("Top contacts by listing count:")
for c, count in contacts.most_common(10):
    print(f"  {c}: {count}")

names = Counter(l.get("posted_by_name") for l in listings)
print("\nTop poster names by listing count:")
for n, count in names.most_common(10):
    print(f"  {n}: {count}")

print("\n=== 2. CHECKING SUSPICIOUS CONTACT PATTERNS ===")
suspicious_contacts = [l["listing_id"] for l in listings if any(p in str(l.get("posted_by_contact")) for p in ["0000", "12345", "99999", "11111"])]
print(f"Suspicious contact numbers count: {len(suspicious_contacts)}")

print("\n=== 3. CHECKING PRICE PER SQFT ANOMALIES BY LOCALITY ===")
locality_prices = defaultdict(list)
for l in listings:
    p = l.get("price", 0)
    ca = l.get("carpet_area", 0)
    if p > 0 and ca > 0:
        locality_prices[l.get("locality")].append((p / ca, l))

print("Locality price per sqft statistics:")
for loc, p_list in locality_prices.items():
    rates = [x[0] for x in p_list]
    avg_rate = sum(rates) / len(rates)
    min_rate = min(rates)
    max_rate = max(rates)
    # Find listings where price per sqft is < 0.3 * avg_rate (extreme low outliers)
    low_outliers = [x[1]["listing_id"] for x in p_list if x[0] < 0.3 * avg_rate]
    high_outliers = [x[1]["listing_id"] for x in p_list if x[0] > 3.0 * avg_rate]
    print(f"  Locality: {loc:15s} | Avg: {avg_rate:6.1f} | Min: {min_rate:6.1f} | Max: {max_rate:6.1f} | Low Outliers (<30% avg): {len(low_outliers)} | High Outliers: {len(high_outliers)}")

print("\n=== 4. CHECKING PROJECT BOUNDARY VIOLATIONS ===")
# Check listings linked to project_id vs project min_area, max_area, price_min, price_max
project_violations = []

def to_inr(val):
    if val is None: return 0
    return val * 10_000_000 if val < 10 else val * 100_000

for l in listings:
    pid = l.get("project_id")
    if pid and pid in projects_by_id:
        proj = projects_by_id[pid]
        p_min = to_inr(proj.get("price_min"))
        p_max = to_inr(proj.get("price_max"))
        a_min = proj.get("min_area_sqft")
        a_max = proj.get("max_area_sqft")
        
        lp = l.get("price", 0)
        la = l.get("carpet_area", 0)
        
        reasons = []
        if p_min > 0 and lp > 0 and lp < 0.5 * p_min:
            reasons.append(f"price ({lp}) way below project min ({p_min})")
        if p_max > 0 and lp > 0 and lp > 2.0 * p_max:
            reasons.append(f"price ({lp}) way above project max ({p_max})")
        if a_min and la > 0 and la < 0.5 * a_min:
            reasons.append(f"area ({la}) way below project min_area ({a_min})")
        if a_max and la > 0 and la > 2.0 * a_max:
            reasons.append(f"area ({la}) way above project max_area ({a_max})")
        if proj.get("locality") and l.get("locality") and proj.get("locality").lower() != l.get("locality").lower():
            reasons.append(f"locality mismatch (listing: {l.get('locality')}, project: {proj.get('locality')})")

        if reasons:
            project_violations.append((l["listing_id"], reasons))

print(f"Project boundary violation listings count: {len(project_violations)}")
for lid, r in project_violations[:10]:
    print(f"  {lid}: {r}")

