'use client';

import React, { useState, useMemo } from 'react';
import { getProcessedListings, getProcessedLocalities } from '../../lib/api';
import { ListingCard } from '../../components/ListingCard';
import { ListingFilters } from '../../lib/types';
import { Search, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function ListingsPage() {
  const allListings = useMemo(() => getProcessedListings(), []);
  const localitiesList = useMemo(() => getProcessedLocalities(), []);

  // Filter state
  const [filters, setFilters] = useState<ListingFilters>({
    locality: 'all',
    bedrooms: 'all',
    minPrice: 0,
    maxPrice: 30000000,
    furnishing: 'all',
    propertyType: 'all',
    showCorrupt: false, // Default hide corrupt listings
    showFake: false,    // Default hide fake bait listings
    searchQuery: '',
    sortBy: 'relevance',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  // Real-time Client-Side Fallback Filtering
  const filteredListings = useMemo(() => {
    return allListings.filter((item) => {
      // 1. Locality Filter
      if (filters.locality !== 'all' && item.locality?.toLowerCase() !== filters.locality.toLowerCase()) {
        return false;
      }

      // 2. Bedrooms Filter
      if (filters.bedrooms !== 'all') {
        const bedVal = parseInt(filters.bedrooms);
        if (filters.bedrooms === '4+') {
          if ((item.bedroom || 0) < 4) return false;
        } else if (item.bedroom !== bedVal) {
          return false;
        }
      }

      // 3. Price Range Filter
      const price = item.price || 0;
      if (price < filters.minPrice || price > filters.maxPrice) {
        return false;
      }

      // 4. Furnishing Filter
      if (filters.furnishing !== 'all' && item.furnishing?.toLowerCase() !== filters.furnishing.toLowerCase()) {
        return false;
      }

      // 5. Property Type Filter
      if (filters.propertyType !== 'all' && item.property_type?.toLowerCase() !== filters.propertyType.toLowerCase()) {
        return false;
      }

      // 6. Corrupt / Fake Data Quality Filters
      if (!filters.showCorrupt && item.is_corrupt) {
        return false;
      }
      if (!filters.showFake && item.is_fake) {
        return false;
      }

      // 7. Search Query Filter
      if (filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const text = `${item.listing_id} ${item.apartment_name} ${item.locality} ${item.description} ${item.posted_by_name}`.toLowerCase();
        if (!text.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (filters.sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (filters.sortBy === 'area_desc') return (b.carpet_area || 0) - (a.carpet_area || 0);
      return 0;
    });
  }, [allListings, filters]);

  // Paginated View
  const totalPages = Math.ceil(filteredListings.length / pageSize) || 1;
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredListings.slice(start, start + pageSize);
  }, [filteredListings, currentPage]);

  const resetFilters = () => {
    setFilters({
      locality: 'all',
      bedrooms: 'all',
      minPrice: 0,
      maxPrice: 30000000,
      furnishing: 'all',
      propertyType: 'all',
      showCorrupt: false,
      showFake: false,
      searchQuery: '',
      sortBy: 'relevance',
    });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chennai Locality Audit: Velachery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Browse Chennai Property Listings
          </h1>
          <p className="text-sm text-slate-300">
            Real-time client-side fallback filtering engine across <span className="text-emerald-400 font-bold">{allListings.length}</span> verified listing records.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-right">
            <span className="block text-2xl font-black text-emerald-400">{filteredListings.length}</span>
            <span className="text-xs text-slate-400">Listings Matching</span>
          </div>
        </div>
      </div>

      {/* Filter & Controls Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        {/* Top Search & Reset Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
                setCurrentPage(1);
              }}
              placeholder="Search by apartment name, ID (e.g. MAG-4001518), locality..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
              className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="relevance">Sort by: Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area_desc">Carpet Area: High to Low</option>
            </select>

            <button
              onClick={resetFilters}
              className="p-2.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
          {/* Locality Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Locality</label>
            <select
              value={filters.locality}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, locality: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 capitalize"
            >
              <option value="all">All Localities</option>
              {localitiesList.map((loc) => (
                <option key={loc.locality} value={loc.locality} className="capitalize">
                  {loc.locality} ({loc.listing_count})
                </option>
              ))}
            </select>
          </div>

          {/* Bedrooms Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Bedrooms</label>
            <select
              value={filters.bedrooms}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, bedrooms: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Any Bedroom</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4+">4+ BHK</option>
            </select>
          </div>

          {/* Furnishing Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Furnishing</label>
            <select
              value={filters.furnishing}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, furnishing: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 capitalize"
            >
              <option value="all">Any Furnishing</option>
              <option value="unfurnished">Unfurnished</option>
              <option value="semi-furnished">Semi-Furnished</option>
              <option value="fully-furnished">Fully Furnished</option>
            </select>
          </div>

          {/* Property Type Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Property Type</label>
            <select
              value={filters.propertyType}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, propertyType: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 capitalize"
            >
              <option value="all">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="independent house">Independent House</option>
              <option value="villa">Villa</option>
              <option value="builder floor">Builder Floor</option>
              <option value="plot">Plot</option>
            </select>
          </div>

          {/* Data Quality Toggles */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-center space-x-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showCorrupt}
                onChange={(e) => setFilters((prev) => ({ ...prev, showCorrupt: e.target.checked }))}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
              />
              <span>Show Corrupt (42)</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showFake}
                onChange={(e) => setFilters((prev) => ({ ...prev, showFake: e.target.checked }))}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
              />
              <span>Show Bait (275)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {paginatedListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedListings.map((listing) => (
            <ListingCard key={listing.listing_id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Listings Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No properties matched your current filter selection. Try clearing search keywords or resetting filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-6">
          <span className="text-xs text-slate-400">
            Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> ({filteredListings.length} total items)
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
