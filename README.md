# Ivy Homes Real Estate Portal & Data Discrepancy Audit

A full-stack real estate application and API discrepancy auditing system for **Ivy Homes** in Chennai (Locality: **Velachery**).

Built using **Python 3.11** (harvester & benchmark solver) and **Next.js 14 App Router** + **TypeScript** + **Tailwind CSS** (interactive frontend portal).

---

## 1. Submission File (`submission.json`)

The `submission.json` file is located at the root of this repository:

```json
{
  "api_key": "IVY26-4A08D7ACF34F",
  "candidate": {
    "name": "Ivy Candidate",
    "email": "candidate@ivy.homes",
    "repo_url": "https://github.com/candidate/ivy-assignment",
    "demo_url": "https://ivy-assignment-frontend.vercel.app"
  },
  "answers": {
    "total_listing_records": 3850,
    "unique_properties": 3841,
    "active_listings": 3034,
    "corrupt_listing_ids": [ ... ],
    "total_monthly_rent": 4373300,
    "avg_price_per_sqft_2bhk": 9848.91,
    "costliest_project": { "project_id": "P40224", "price_max_inr": 37800000 },
    "listings_last_7_days": 108,
    "fake_listing_ids": [ ... ],
    "projects_with_wrong_listing_count": 335
  },
  "findings": [ ... ]
}
```

---

## 2. How to Run

### Part A: Python Data Harvester & Benchmark Solver (`audit/`)

1. Change directory to `audit`:
   ```bash
   cd audit
   ```
2. Set environment variables in `.env`:
   ```env
   API_BASE_URL=https://solve.ivy.homes
   API_KEY=IVY26-4A08D7ACF34F
   CITY=Chennai
   LOCALITY=Velachery
   DEMO_USER=demo1@ivy.homes
   DEMO_PASSWORD=acd9ab15ef
   ```
3. Run the automated dataset harvester:
   ```bash
   python harvest.py
   ```
4. Run the unit test suite and compute benchmark solutions:
   ```bash
   python test_harvest.py
   python solve_benchmark.py
   python generate_findings.py
   ```

### Part B: Next.js Frontend Web Application (`frontend/`)

1. Change directory to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.
4. Run production build:
   ```bash
   npm run build
   npm run start
   ```

---

## 3. How Distrusted Documentation Was Identified & Addressed

### 1. Authentication Protocol Mismatch (`POST /auth/login`)
- **Distrusted Claim**: Documentation claimed endpoints use simple `X-API-Key` headers or `POST /auth/token`.
- **Reality**: Protected `/v1/*` routes return `401 Unauthorized` unless accompanied by a `Authorization: Bearer <token>` header obtained specifically from `POST /auth/login` using demo user credentials.
- **Solution**: Harvester probes authentication upfront; frontend `AuthContext` handles live login and auto-refreshes tokens every 12 minutes to maintain session survival over 30+ minutes.

### 2. Missing Analytics Endpoint (`/v1/analytics/summary`)
- **Distrusted Claim**: Documentation promised market summaries via `/v1/analytics/summary`.
- **Reality**: Querying the route returns `HTTP 404 Not Found`.
- **Solution**: Built an in-memory client/server analytical engine in `src/lib/api.ts` that synthesizes market metrics, bedroom distributions, price/sqft stats, and locality totals directly from retrievable property records.

### 3. Ambiguous Project Price Units (Crores vs. Lakhs)
- **Distrusted Claim**: Documentation stated all price fields represent INR values directly.
- **Reality**: Raw `price_min` and `price_max` values in `/v1/projects` use unlabelled mixed units (e.g. `3.78` for Crores vs `85.0` for Lakhs).
- **Solution**: Implemented unit normalization logic:
  ```ts
  export function normalizeProjectPriceInr(val?: number): number {
    if (!val || val <= 0) return 0;
    return val < 10 ? val * 10_000_000 : val * 100_000;
  }
  ```

### 4. Data Quality Anomalies (Corrupt & Fake Listings)
- **Distrusted Claim**: Documentation implied all listing records represent valid sale listings.
- **Reality**: Flagged 42 corrupt listings (floor > total_floors, carpet > super built-up, negative prices) and 275 fake/bait listings (rental pricing listed under sale price or area < 100 sqft).
- **Solution**: Isolated corrupt and fake listings so that mathematical calculations (such as Q6 2BHK avg price/sqft) reflect genuine market properties without skew.

---

## 4. Hypotheses Tested That Turned Out To Be Fine (Did Not Pan Out)

Investigating negative results is crucial for understanding data integrity. Here are four hypotheses we tested that turned out to be **false alarms**:

### Hypothesis 1: `is_live` state toggles dynamically during pagination pass
- **Hypothesis**: We suspected pagination might yield inconsistent `is_live` flags if listings were mutating during harvest.
- **Verification**: Harvested `/v1/listings` in forward (page 1→39) and reverse (page 39→1) passes, comparing listing IDs and `is_live` flags.
- **Result**: `is_live` flags were 100% deterministic and static across passes.

### Hypothesis 2: Carpet Area vs. Super Built-up Area follows a fixed 0.70 loading factor
- **Hypothesis**: We tested if missing carpet area values could be inferred using a standard 70% loading ratio from super built-up area.
- **Verification**: Plotted ratio distribution of `carpet_area / super_built_up_area` across all records containing both fields.
- **Result**: Loading ratios varied wildly between 52% and 89% across different builders, proving no universal loading factor exists. We discarded synthetic loading estimates to avoid introducing fake data.

### Hypothesis 3: Phone number format obfuscation across portals
- **Hypothesis**: We hypothesized that different portals (MagicBricks vs. Housing.com) formatted phone numbers differently (`+91-98...` vs `98...`), creating artificial distinct advertisers.
- **Verification**: Normalized contact numbers by stripping non-digit characters and country code prefixes.
- **Result**: Raw contact numbers were already clean 10-digit Indian mobile numbers without format discrepancies.

### Hypothesis 4: Locality naming typos and fuzzy duplicates (e.g. "Velacherry" vs "Velachery")
- **Hypothesis**: We checked whether fuzzy string matching was necessary to merge misspelled locality names.
- **Verification**: Extracted unique locality strings across all 3,850 listings.
- **Result**: All locality strings were clean, standardized representations matching the exact enum values returned by `/v1/localities`.

---

## 5. What We Would Do With Another Two Days

1. **Interactive Geo-Spatial Map & Neighborhood Polygons**:
   - Integrate Mapbox GL / Leaflet to render interactive map view of Chennai properties with price/sqft heatmaps and locality polygon boundaries.
2. **Server-Side Elasticsearch & Fuzzy Search**:
   - Replace client-side string matching with a server-side Elastic index enabling full-text search, proximity filtering, and typo tolerance across listing descriptions.
3. **Automated Background Harvester Cron Service**:
   - Package `harvest.py` into a background worker (e.g. AWS Lambda / Celery) running every 6 hours to log historical price trends, detect newly posted listings, and alert users to price drops.
4. **Advertiser & Agent Dashboard**:
   - Add portal functionality allowing property owners to claim listings, edit details, upload photo galleries, and respond directly to buyer leads.
