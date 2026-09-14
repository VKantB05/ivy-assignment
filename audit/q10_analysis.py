"""
q10_analysis.py - Detailed analysis for Question 10 (projects_with_wrong_listing_count)
"""

import json
from pathlib import Path
from collections import defaultdict, Counter

data_dir = Path(__file__).resolve().parent / "data"

with open(data_dir / "raw_projects.json", "r", encoding="utf-8") as f:
    projects = json.load(f).get("data", [])

with open(data_dir / "raw_listings.json", "r", encoding="utf-8") as f:
    listings = json.load(f).get("data", [])

print(f"Total Projects in raw_projects.json: {len(projects)}")

# Count all listings per project_id
all_counts = defaultdict(int)
live_counts = defaultdict(int)

for l in listings:
    pid = l.get("project_id")
    if pid:
        all_counts[pid] += 1
        if l.get("is_live") is True:
            live_counts[pid] += 1

mismatches_all = 0
mismatches_live = 0

diff_samples = []

for p in projects:
    pid = p["project_id"]
    reported = p.get("total_listings", 0)
    actual_all = all_counts[pid]
    actual_live = live_counts[pid]

    if reported != actual_all:
        mismatches_all += 1
        diff_samples.append((pid, p.get("apartment_name"), reported, actual_all, actual_live))
    if reported != actual_live:
        mismatches_live += 1

print(f"\n1. Comparing reported total_listings vs ALL retrievable listings:")
print(f"   Projects with WRONG listing count: {mismatches_all} (out of {len(projects)})")

print(f"\n2. Comparing reported total_listings vs ACTIVE (is_live=True) listings:")
print(f"   Projects with WRONG listing count: {mismatches_live} (out of {len(projects)})")

print("\nSample projects with count mismatches (Reported vs Actual All vs Actual Live):")
for pid, name, rep, act_all, act_live in diff_samples[:15]:
    print(f"  {pid:6s} | {name:25s} | Reported: {rep:2d} | Actual All: {act_all:2d} | Actual Live: {act_live:2d}")

