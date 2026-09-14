import { Listing, Rental, Project, Locality, Finding, BenchmarkAnswers, AuthSession } from './types';

// Fallback JSON Datasets
import rawListingsData from '../data/raw_listings.json';
import rawRentalsData from '../data/raw_rentals.json';
import rawProjectsData from '../data/raw_projects.json';
import rawLocalitiesData from '../data/raw_localities.json';
import findingsData from '../data/findings.json';
import answersData from '../data/answers.json';

const API_BASE_URL = 'https://solve.ivy.homes';
const API_KEY = 'IVY26-4A08D7ACF34F';

export const corruptListingIdsSet = new Set<string>(answersData.corrupt_listing_ids as string[]);
export const fakeListingIdsSet = new Set<string>(answersData.fake_listing_ids as string[]);

// Helper to normalize project prices (Lakhs vs Crores to INR)
export function normalizeProjectPriceInr(val?: number): number {
  if (val === undefined || val === null || val <= 0) return 0;
  return val < 10 ? val * 10_000_000 : val * 100_000;
}

// 1. Process Listings
export function getProcessedListings(): Listing[] {
  const records = (rawListingsData as { data?: Listing[] }).data || [];
  return records.map((item) => {
    const isCorrupt = corruptListingIdsSet.has(item.listing_id);
    const isFake = fakeListingIdsSet.has(item.listing_id);
    return {
      ...item,
      is_corrupt: isCorrupt,
      is_fake: isFake,
    };
  });
}

// 2. Process Rentals
export function getProcessedRentals(): Rental[] {
  return ((rawRentalsData as { data?: Rental[] }).data || []);
}

// 3. Process Projects
export function getProcessedProjects(): Project[] {
  const records = (rawProjectsData as { data?: Project[] }).data || [];
  const listings = getProcessedListings();
  
  const projectListingCounts = new Map<string, number>();
  listings.forEach((l) => {
    if (l.project_id) {
      projectListingCounts.set(l.project_id, (projectListingCounts.get(l.project_id) || 0) + 1);
    }
  });

  return records.map((p) => {
    const pMinInr = normalizeProjectPriceInr(p.price_min);
    const pMaxInr = normalizeProjectPriceInr(p.price_max);
    const actualCount = projectListingCounts.get(p.project_id) || 0;
    const countMismatch = (p.total_listings || 0) !== actualCount;

    return {
      ...p,
      price_min_inr: pMinInr,
      price_max_inr: pMaxInr,
      actual_listings_count: actualCount,
      count_mismatch: countMismatch,
    };
  });
}

// 4. Process Localities
export function getProcessedLocalities(): Locality[] {
  return ((rawLocalitiesData as { data?: Locality[] }).data || []);
}

// 5. Findings & Benchmark Answers
export function getFindings(): Finding[] {
  return findingsData as Finding[];
}

export function getBenchmarkAnswers(): BenchmarkAnswers {
  return answersData as BenchmarkAnswers;
}

// Live Auth API Integration
export async function loginWithApi(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Invalid email or password');
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type || 'Bearer',
    expires_in: data.expires_in || 900,
    user: data.user || { email },
    obtained_at: Date.now(),
  };
}

export async function refreshApiToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'Authorization': `Bearer ${refreshToken}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return { access_token: data.access_token, expires_in: data.expires_in || 900 };
    }
  } catch (err) {
    console.warn('Token refresh network error:', err);
  }
  return { access_token: refreshToken, expires_in: 900 };
}
