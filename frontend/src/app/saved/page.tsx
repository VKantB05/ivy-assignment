'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useSavedListings } from '../../context/SavedListingsContext';
import { getProcessedListings } from '../../lib/api';
import { ListingCard } from '../../components/ListingCard';
import { Heart, Trash2, ArrowRight } from 'lucide-react';

export default function SavedListingsPage() {
  const { user } = useAuth();
  const { savedIds, clearSaved } = useSavedListings();
  const allListings = useMemo(() => getProcessedListings(), []);

  const savedListings = useMemo(() => {
    return allListings.filter((item) => savedIds.includes(item.listing_id));
  }, [allListings, savedIds]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>User Isolated Bookmark Storage</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Saved Listings ({savedListings.length})
          </h1>
          <p className="text-sm text-slate-300">
            {user ? (
              <span>Bookmarked properties for <span className="font-mono text-emerald-400 font-bold">{user.email}</span>. Persisted across page refreshes and re-logins.</span>
            ) : (
              <span>Saved in local session. Sign in to sync across devices.</span>
            )}
          </p>
        </div>

        {savedListings.length > 0 && (
          <button
            onClick={clearSaved}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-slate-700 text-xs font-bold text-slate-300 transition-colors flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Saved</span>
          </button>
        )}
      </div>

      {/* Saved Listings Grid */}
      {savedListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedListings.map((listing) => (
            <ListingCard key={listing.listing_id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white">No Saved Listings Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You haven&apos;t bookmarked any listings under this account. Click the heart icon on any property card to save it for later.
          </p>
          <Link
            href="/listings"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <span>Explore Property Listings</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
