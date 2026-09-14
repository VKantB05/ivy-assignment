'use client';

import React, { useState, useMemo } from 'react';
import { getProcessedRentals } from '../../lib/api';
import { Key, Search, Bed, Bath, Maximize2, Phone } from 'lucide-react';

export default function RentalsPage() {
  const allRentals = useMemo(() => getProcessedRentals(), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('all');
  const [selectedBedrooms, setSelectedBedrooms] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  const localities = useMemo(() => {
    const set = new Set<string>();
    allRentals.forEach((r) => {
      if (r.locality) set.add(r.locality.toLowerCase());
    });
    return Array.from(set).sort();
  }, [allRentals]);

  const filteredRentals = useMemo(() => {
    return allRentals.filter((item) => {
      if (selectedLocality !== 'all' && item.locality?.toLowerCase() !== selectedLocality) {
        return false;
      }
      if (selectedBedrooms !== 'all') {
        const bedVal = parseInt(selectedBedrooms);
        if (selectedBedrooms === '4+') {
          if ((item.bedroom || 0) < 4) return false;
        } else if (item.bedroom !== bedVal) {
          return false;
        }
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const text = `${item.listing_id} ${item.title} ${item.apartment_name} ${item.locality} ${item.description}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [allRentals, selectedLocality, selectedBedrooms, searchQuery]);

  const totalPages = Math.ceil(filteredRentals.length / pageSize) || 1;
  const paginatedRentals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRentals.slice(start, start + pageSize);
  }, [filteredRentals, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Key className="w-3.5 h-3.5" />
            <span>Chennai Rental Property Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Explore Rental Properties ({allRentals.length})
          </h1>
          <p className="text-sm text-slate-300">
            Browse monthly rentals across Chennai localities with accurate monthly rent, deposit, and maintenance breakdowns.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-right">
          <span className="block text-2xl font-black text-indigo-400">{filteredRentals.length}</span>
          <span className="text-xs text-slate-400">Matching Rentals</span>
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
            placeholder="Search rentals by title, apartment name, locality..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
            value={selectedBedrooms}
            onChange={(e) => {
              setSelectedBedrooms(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none"
          >
            <option value="all">Any Bedroom</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4+">4+ BHK</option>
          </select>
        </div>
      </div>

      {/* Rentals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedRentals.map((rental) => {
          const rentFormatted = rental.price
            ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rental.price)
            : 'N/A';

          return (
            <div
              key={rental.listing_id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg capitalize">
                    {rental.locality || 'Chennai'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{rental.listing_id}</span>
                </div>

                <h3 className="font-bold text-base text-white line-clamp-1">
                  {rental.title || rental.apartment_name || 'Rental Unit'}
                </h3>
                <span className="text-xs text-slate-400 block mt-0.5">{rental.apartment_name}</span>

                <div className="mt-3">
                  <span className="text-xl font-black text-indigo-400">{rentFormatted}</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
              </div>

              {/* Deposit & Maintenance Breakdown */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Security Deposit:</span>
                  <span className="font-semibold text-slate-200">
                    {rental.deposit ? `₹${rental.deposit.toLocaleString('en-IN')}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Maintenance:</span>
                  <span className="font-semibold text-slate-200">
                    {rental.maintenance ? `₹${rental.maintenance.toLocaleString('en-IN')}/mo` : 'Included'}
                  </span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                <div className="flex items-center space-x-1">
                  <Bed className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{rental.bedroom !== undefined ? `${rental.bedroom} BHK` : 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Bath className="w-3.5 h-3.5 text-teal-400" />
                  <span>{rental.bathroom !== undefined ? `${rental.bathroom} Bath` : 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{rental.carpet_area ? `${rental.carpet_area} sqft` : 'N/A'}</span>
                </div>
              </div>

              {/* Contact Footer */}
              {rental.posted_by_contact && (
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <span className="text-xs text-slate-400 truncate max-w-[150px]">{rental.posted_by_name || 'Landlord'}</span>
                  <a
                    href={`tel:${rental.posted_by_contact}`}
                    className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-500/30 transition-colors flex items-center space-x-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-6">
          <span className="text-xs text-slate-400">
            Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> ({filteredRentals.length} rentals)
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
