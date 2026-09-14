'use client';

import React from 'react';
import Link from 'next/link';
import { Listing } from '../lib/types';
import { useSavedListings } from '../context/SavedListingsContext';
import { Heart, ShieldCheck, AlertTriangle, Flame, MapPin, Bed, Bath, Maximize2, ExternalLink } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const { isSaved, toggleSave } = useSavedListings();
  const saved = isSaved(listing.listing_id);

  const priceFormatted = listing.price
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(listing.price)
    : 'Price on request';

  const pricePerSqft =
    listing.price && listing.carpet_area && listing.carpet_area > 0
      ? (listing.price / listing.carpet_area).toFixed(0)
      : null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-xl transition-all hover:-translate-y-1 flex flex-col group relative">
      {/* Top Image Banner / Placeholder */}
      <div className="relative h-44 bg-slate-800/80 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-10" />
        
        {/* Locality & Type Badge */}
        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-slate-900/90 text-emerald-400 border border-emerald-500/30 rounded-lg backdrop-blur-sm">
            {listing.locality || 'Chennai'}
          </span>
          {listing.property_type && (
            <span className="px-2.5 py-1 text-[11px] font-semibold capitalize bg-slate-900/80 text-slate-300 border border-slate-700/60 rounded-lg backdrop-blur-sm">
              {listing.property_type}
            </span>
          )}
        </div>

        {/* Save Heart Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleSave(listing.listing_id);
          }}
          className={`absolute top-3 right-3 z-20 p-2 rounded-xl backdrop-blur-md transition-all ${
            saved
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
              : 'bg-slate-900/70 text-slate-400 hover:text-red-400 hover:bg-slate-900'
          }`}
          title={saved ? 'Remove from Saved' : 'Save Listing'}
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
        </button>

        {/* Verification & Data Quality Badges */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center space-x-1.5">
          {listing.is_verified && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> Verified
            </span>
          )}
          {listing.is_corrupt && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-300 border border-red-500/30 flex items-center" title="Impossible specification flagged in audit">
              <AlertTriangle className="w-3 h-3 mr-1 text-red-400" /> Corrupt Data
            </span>
          )}
          {listing.is_fake && !listing.is_corrupt && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center" title="Enquiry bait / anomalous pricing">
              <Flame className="w-3 h-3 mr-1 text-amber-400" /> Bait Price
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
              {listing.apartment_name || 'Listing #' + listing.listing_id}
            </h3>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-emerald-400">{priceFormatted}</span>
            {pricePerSqft && (
              <span className="text-xs text-slate-400 font-mono">
                (₹{pricePerSqft}/sqft)
              </span>
            )}
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center space-x-1.5">
            <Bed className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{listing.bedroom !== undefined ? `${listing.bedroom} BHK` : 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Bath className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span>{listing.bathroom !== undefined ? `${listing.bathroom} Bath` : 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Maximize2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>{listing.carpet_area ? `${listing.carpet_area} sqft` : 'N/A'}</span>
          </div>
        </div>

        {/* Bottom Details & Link */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-400 flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500 capitalize" />
            <span className="capitalize">{listing.locality || 'Chennai'}</span>
          </div>

          <Link
            href={`/listings/${listing.listing_id}`}
            className="inline-flex items-center text-xs font-bold text-emerald-400 hover:text-emerald-300 group/link"
          >
            <span>View Details</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
