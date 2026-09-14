'use client';

import React, { useState, useMemo } from 'react';
import { getProcessedProjects } from '../../lib/api';
import { Building2, Search, AlertCircle, ShieldCheck } from 'lucide-react';
import { Project } from '../../lib/types';

export default function ProjectsPage() {
  const allProjects = useMemo(() => getProcessedProjects(), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  const localities = useMemo(() => {
    const set = new Set<string>();
    allProjects.forEach((p) => {
      if (p.locality) set.add(p.locality.toLowerCase());
    });
    return Array.from(set).sort();
  }, [allProjects]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    allProjects.forEach((p) => {
      if (p.project_status) set.add(p.project_status.toLowerCase());
    });
    return Array.from(set).sort();
  }, [allProjects]);

  const filteredProjects = useMemo(() => {
    return allProjects.filter((item) => {
      if (selectedLocality !== 'all' && item.locality?.toLowerCase() !== selectedLocality) {
        return false;
      }
      if (selectedStatus !== 'all' && item.project_status?.toLowerCase() !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const text = `${item.project_id} ${item.apartment_name} ${item.developer_name} ${item.locality} ${item.rera_number}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [allProjects, selectedLocality, selectedStatus, searchQuery]);

  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage]);

  const formatPriceRange = (p: Project) => {
    if (!p.price_min && !p.price_max) return 'Price on Request';
    
    // Helper to format raw float min/max into Lakhs or Crores text
    const formatSingle = (raw: number) => {
      if (raw < 10) {
        return `₹${raw} Cr`;
      } else {
        return `₹${raw} Lakhs`;
      }
    };

    const minStr = p.price_min ? formatSingle(p.price_min) : '';
    const maxStr = p.price_max ? formatSingle(p.price_max) : '';

    if (minStr && maxStr) {
      return `${minStr} – ${maxStr}`;
    }
    return minStr || maxStr;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Chennai Projects Directory & Unit Normalization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Real Estate Projects ({allProjects.length})
          </h1>
          <p className="text-sm text-slate-300">
            Normalized price ranges (Lakhs & Crores converted to INR), developer details, tower specs, and listing count audit.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-right">
          <span className="block text-2xl font-black text-cyan-400">{filteredProjects.length}</span>
          <span className="text-xs text-slate-400">Projects Displayed</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search projects by name, developer, ID (e.g. P40001), RERA..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={selectedLocality}
            onChange={(e) => {
              setSelectedLocality(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none capitalize"
          >
            <option value="all">All Localities</option>
            {localities.map((loc) => (
              <option key={loc} value={loc} className="capitalize">
                {loc}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none capitalize"
          >
            <option value="all">All Statuses</option>
            {statuses.map((st) => (
              <option key={st} value={st} className="capitalize">
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProjects.map((project) => {
          const priceDisplay = formatPriceRange(project);

          return (
            <div
              key={project.project_id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg capitalize">
                    {project.locality || 'Chennai'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{project.project_id}</span>
                </div>

                <h3 className="font-bold text-lg text-white line-clamp-1">
                  {project.apartment_name}
                </h3>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Developer: <span className="font-semibold text-slate-200">{project.developer_name || 'N/A'}</span>
                </span>

                <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Normalized Price Range</span>
                  <span className="text-lg font-black text-cyan-400">{priceDisplay}</span>
                  {project.price_max_inr && project.price_max_inr > 0 && (
                    <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                      Max Price: ₹{project.price_max_inr.toLocaleString('en-IN')} INR
                    </span>
                  )}
                </div>
              </div>

              {/* Specifications & Dates */}
              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                <div className="flex justify-between text-slate-400">
                  <span>Project Status:</span>
                  <span className="font-semibold text-emerald-400 capitalize">{project.project_status || 'Active'}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Towers / Units / Floors:</span>
                  <span className="font-semibold text-slate-200">
                    {project.total_towers || 0} Towers • {project.total_units || 0} Units • {project.total_floors || 0} Fl.
                  </span>
                </div>

                {project.min_area_sqft && project.max_area_sqft && (
                  <div className="flex justify-between text-slate-400">
                    <span>Unit Area Range:</span>
                    <span className="font-semibold text-slate-200">{project.min_area_sqft} – {project.max_area_sqft} sqft</span>
                  </div>
                )}

                {project.possession_date && (
                  <div className="flex justify-between text-slate-400">
                    <span>Possession Date:</span>
                    <span className="font-semibold text-slate-200">{project.possession_date}</span>
                  </div>
                )}
              </div>

              {/* Audit Discrepancy Alert for Wrong Listing Count */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Reported Listings: <span className="font-bold text-white">{project.total_listings}</span></span>
                {project.count_mismatch ? (
                  <span className="text-amber-400 font-semibold flex items-center" title="Project reports wrong listing count compared to retrievable listings">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" /> Actual: {project.actual_listings_count}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Count Verified
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-6">
          <span className="text-xs text-slate-400">
            Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> ({filteredProjects.length} projects)
          </span>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
