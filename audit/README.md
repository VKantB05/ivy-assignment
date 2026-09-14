# Ivy Assignment - Phase 1: Data Harvester

## Overview
This directory contains the Phase 1 implementation for harvesting, authentication probing, server clock validation, dynamic pagination, and local unmutated persistence.

## Features
- **Directory & Environment Isolation**: Dedicated environment (`venv`) with `requests` and `pandas`.
- **Authentication Probing**: Automatically detects and locks in the server's accepted auth header (`x-api-key`, `Authorization: Bearer`, or `X-API-Key`) against `/health` and `/v1/listings`.
- **Server Clock & Health Check**: Validates `/health` endpoint and explicitly audits for the `+05:30` (IST) timestamp offset.
- **Dataset Harvesting**: Supports `/v1/listings`, `/v1/rentals`, `/v1/projects`, and `/v1/analytics`. Dynamically extracts data across multiple envelope formats and respects termination conditions (`has_more: false`, total count, batch sizing).
- **Discrepancy Logging**: Logs any non-200 responses, 404 missing routes, or schema mismatches into `data/diagnostic_log.json`.
- **Local Raw Persistence**: Unmutated server JSON payloads stored in:
  - `data/raw_listings.json`
  - `data/raw_rentals.json`
  - `data/raw_projects.json`
  - `data/raw_analytics.json`

## Setup & Execution

### 1. Activate Environment
```bash
# Windows
.\venv\Scripts\activate

# Linux / Mac
source venv/bin/activate
```

### 2. Configure Credentials
Copy `.env.example` to `.env` and fill in your API details:
```env
API_BASE_URL=https://api.yourserver.com
API_KEY=your_secret_api_key
```

### 3. Run Harvester
```bash
# Using .env values
python harvest.py

# Or passing arguments via CLI
python harvest.py --base-url https://api.yourserver.com --api-key your_secret_api_key
```

### 4. Run Automated Mock Verification
```bash
python test_harvest.py
```
