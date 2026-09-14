'use client';

import React, { useState, useMemo } from 'react';
import { getBenchmarkAnswers, getFindings } from '../../lib/api';
import {
  BarChart3,
  AlertTriangle,
  Flame,
  ShieldAlert,
  FileQuestion,
  Sparkles,
} from 'lucide-react';

export default function InsightsPage() {
  const answers = useMemo(() => getBenchmarkAnswers(), []);
  const findings = useMemo(() => getFindings(), []);

  const [activeTab, setActiveTab] = useState<'benchmark' | 'discrepancies' | 'corrupt' | 'fake'>('benchmark');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredFindings = useMemo(() => {
    if (selectedCategory === 'all') return findings;
    return findings.filter((f) => f.category === selectedCategory);
  }, [findings, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Data Insights & API Discrepancy Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Chennai Real Estate Data Discoveries
          </h1>
          <p className="text-sm text-slate-300">
            Promised analytics dashboard, 10 benchmark answers, and audited documentation discrepancies.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-right">
            <span className="block text-2xl font-black text-teal-400">10 / 10</span>
            <span className="text-xs text-slate-400">Benchmark Answers Solved</span>
          </div>
        </div>
      </div>

      {/* Analytics Summary Missing Endpoint Notice */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-3">
        <FileQuestion className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-400 uppercase tracking-wider text-sm">
            Discrepancy Notice: `/v1/analytics/summary` Missing Endpoint
          </span>
          <p className="mt-1 leading-relaxed text-amber-200/90">
            The documentation promised analytics summaries at <code className="bg-amber-950 px-1.5 py-0.5 rounded font-mono text-amber-300">/v1/analytics/summary</code>. However, the server returns <span className="font-bold text-red-400">HTTP 404 Not Found</span>. This screen renders all audited discoveries synthesized directly from retrievable property records.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto space-x-2 pb-1">
        <button
          onClick={() => setActiveTab('benchmark')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 flex-shrink-0 ${
            activeTab === 'benchmark'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>10 Benchmark Answers (Part 2)</span>
        </button>

        <button
          onClick={() => setActiveTab('discrepancies')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 flex-shrink-0 ${
            activeTab === 'discrepancies'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>API Discrepancies Audit ({findings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('corrupt')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 flex-shrink-0 ${
            activeTab === 'corrupt'
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>Corrupt Listings ({answers.corrupt_listing_ids.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fake')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 flex-shrink-0 ${
            activeTab === 'fake'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Bait / Fake Listings ({answers.fake_listing_ids.length})</span>
        </button>
      </div>

      {/* TAB 1: 10 BENCHMARK ANSWERS */}
      {activeTab === 'benchmark' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Q1 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Q1. Total Listing Records</span>
              <div className="text-3xl font-black text-white">{answers.total_listing_records.toLocaleString('en-IN')}</div>
              <p className="text-xs text-slate-400">Total retrievable listing records from <code className="text-emerald-400 font-mono">/v1/listings</code>.</p>
            </div>

            {/* Q2 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Q2. Unique Properties</span>
              <div className="text-3xl font-black text-white">{answers.unique_properties.toLocaleString('en-IN')}</div>
              <p className="text-xs text-slate-400">Distinct physical properties after deduplication across portals.</p>
            </div>

            {/* Q3 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Q3. Active Listings</span>
              <div className="text-3xl font-black text-emerald-400">{answers.active_listings.toLocaleString('en-IN')}</div>
              <p className="text-xs text-slate-400">Retrievable listings with <code className="text-emerald-400 font-mono">is_live = true</code>.</p>
            </div>

            {/* Q4 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Q4. Corrupt Listing IDs</span>
              <div className="text-3xl font-black text-red-400">{answers.corrupt_listing_ids.length}</div>
              <p className="text-xs text-slate-400">Listings describing physically impossible specifications.</p>
            </div>

            {/* Q5 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Q5. Velachery Total Rent</span>
              <div className="text-3xl font-black text-white">₹{answers.total_monthly_rent.toLocaleString('en-IN')}</div>
              <p className="text-xs text-slate-400">Sum of monthly rent across 127 rentals in assigned locality (Velachery).</p>
            </div>

            {/* Q6 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Q6. Avg 2BHK Price / SqFt</span>
              <div className="text-3xl font-black text-teal-400">₹{answers.avg_price_per_sqft_2bhk.toLocaleString('en-IN')}</div>
              <p className="text-xs text-slate-400">Mean price/sqft across active 2BHKs excluding corrupt and fake listings.</p>
            </div>

            {/* Q7 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2 md:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Q7. Costliest Project</span>
              <div className="text-2xl font-black text-cyan-400">{answers.costliest_project.project_id} (Shriram Serenity)</div>
              <p className="text-xs text-slate-400">
                Max Price: <span className="font-bold text-white">₹{answers.costliest_project.price_max_inr.toLocaleString('en-IN')} INR</span> (3.78 Crores).
              </p>
            </div>

            {/* Q8 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Q8. Listings Last 7 Days</span>
              <div className="text-3xl font-black text-white">{answers.listings_last_7_days}</div>
              <p className="text-xs text-slate-400">Listings posted in 7 days before REFERENCE (2026-09-10T00:00:00+05:30).</p>
            </div>

            {/* Q9 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Q9. Fake / Bait Listing IDs</span>
              <div className="text-3xl font-black text-amber-400">{answers.fake_listing_ids.length}</div>
              <p className="text-xs text-slate-400">Listings created solely to generate lead enquiries.</p>
            </div>

            {/* Q10 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2 md:col-span-2 lg:col-span-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Q10. Projects With Wrong Listing Count</span>
              <div className="text-3xl font-black text-amber-400">{answers.projects_with_wrong_listing_count} <span className="text-sm text-slate-400 font-normal">/ 450 projects</span></div>
              <p className="text-xs text-slate-400">Projects whose reported <code className="text-emerald-400 font-mono">total_listings</code> metadata contradicts actual retrievable listing records in <code className="text-emerald-400 font-mono">/v1/listings</code>.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISCREPANCIES AUDIT */}
      {activeTab === 'discrepancies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Audited Discrepancies Findings</h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl px-3 py-2 capitalize"
            >
              <option value="all">All Categories ({findings.length})</option>
              <option value="auth">Auth</option>
              <option value="missing_endpoint">Missing Endpoint</option>
              <option value="undocumented_endpoint">Undocumented Endpoint</option>
              <option value="units">Units</option>
              <option value="consistency">Consistency</option>
              <option value="data_quality">Data Quality</option>
              <option value="fraud">Fraud</option>
              <option value="duplicates">Duplicates</option>
              <option value="pagination">Pagination</option>
            </select>
          </div>

          <div className="space-y-4">
            {filteredFindings.map((finding, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {finding.category}
                    </span>
                    <span className="font-mono font-bold text-sm text-white">{finding.endpoint}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Found via: {finding.how_found}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Documented Claim</span>
                    <p className="text-slate-300">{finding.documented}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400">Actual API Behavior</span>
                    <p className="text-slate-200 font-semibold">{finding.actual}</p>
                  </div>
                </div>

                {finding.evidence && finding.evidence.length > 0 && (
                  <div className="pt-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Sample Evidence IDs ({finding.evidence.length} shown):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {finding.evidence.map((id) => (
                        <span key={id} className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-950 border border-slate-800 text-slate-300">
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CORRUPT LISTINGS DRILLDOWN */}
      {activeTab === 'corrupt' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">42 Corrupt Listing Records</h3>
              <p className="text-xs text-slate-400">Listing IDs flagged for physical/logical impossibilities</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {answers.corrupt_listing_ids.map((id) => (
              <a
                key={id}
                href={`/listings/${id}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-900 border border-red-500/30 hover:border-red-500 text-center text-xs font-mono text-red-300 hover:text-white transition-all block"
              >
                {id}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FAKE LISTINGS DRILLDOWN */}
      {activeTab === 'fake' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">275 Fake / Enquiry Bait Listing Records</h3>
              <p className="text-xs text-slate-400">Listings created with rental prices or fake miniature areas</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {answers.fake_listing_ids.map((id) => (
              <a
                key={id}
                href={`/listings/${id}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 hover:border-amber-500 text-center text-xs font-mono text-amber-300 hover:text-white transition-all block"
              >
                {id}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
