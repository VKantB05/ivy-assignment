'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getProcessedListings, getProcessedProjects } from '../../../lib/api';
import { useSavedListings } from '../../../context/SavedListingsContext';
import {
  ArrowLeft,
  Heart,
  AlertTriangle,
  Flame,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Building,
  User,
  Phone,
  Calendar,
  Layers,
  ExternalLink,
} from 'lucide-react';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const listings = useMemo(() => getProcessedListings(), []);
  const projects = useMemo(() => getProcessedProjects(), []);

  const listing = useMemo(() => {
    return listings.find((l) => l.listing_id === id);
  }, [listings, id]);

  const relatedProject = useMemo(() => {
    if (!listing?.project_id) return null;
    return projects.find((p) => p.project_id === listing.project_id);
  }, [projects, listing]);

  const { isSaved, toggleSave } = useSavedListings();
  const saved = listing ? isSaved(listing.listing_id) : false;

  if (!listing) {
    return (
      <div className="max-w-md mx-auto my-16 bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center border border-red-500/30">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Listing Not Found</h2>
        <p className="text-xs text-slate-400">
          No listing found with ID <span className="font-mono text-emerald-400 font-bold">{id}</span>.
        </p>
        <button
          onClick={() => router.push('/listings')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition-colors"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  const priceFormatted = listing.price
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(listing.price)
    : 'Price on request';

  const pricePerSqft =
    listing.price && listing.carpet_area && listing.carpet_area > 0
      ? (listing.price / listing.carpet_area).toFixed(2)
      : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Listings
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8 relative">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-slate-800 text-emerald-400 border border-slate-700 rounded-lg">
                {listing.locality || 'Chennai'}
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold capitalize bg-slate-800 text-slate-300 border border-slate-700 rounded-lg">
                {listing.property_type || 'Property'}
              </span>
              <span className="px-2.5 py-1 text-xs font-mono bg-slate-950 text-slate-400 rounded-lg border border-slate-800">
                ID: {listing.listing_id}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {listing.apartment_name || 'Property Listing #' + listing.listing_id}
            </h1>

            <div className="flex items-center text-xs text-slate-400">
              <MapPin className="w-4 h-4 mr-1 text-emerald-400 capitalize" />
              <span className="capitalize">{listing.locality || 'Chennai'}, Tamil Nadu</span>
            </div>
          </div>

          {/* Right Action & Price */}
          <div className="flex flex-col items-start md:items-end justify-between space-y-3">
            <button
              onClick={() => toggleSave(listing.listing_id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                saved
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
              <span>{saved ? 'Saved in Favorites' : 'Save Listing'}</span>
            </button>

            <div className="text-left md:text-right">
              <span className="text-3xl font-black text-emerald-400">{priceFormatted}</span>
              {pricePerSqft && (
                <span className="block text-xs text-slate-400 font-mono">
                  ₹{pricePerSqft} per sq.ft.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Audit Data Quality Alerts (if flagged) */}
        {(listing.is_corrupt || listing.is_fake) && (
          <div className="space-y-2">
            {listing.is_corrupt && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-red-400 uppercase tracking-wider">Audit Alert: Corrupt Listing Specification</span>
                  <p className="mt-0.5">
                    This listing was flagged during Phase 1 Data Audit for containing physically impossible parameters (e.g. floor exceeding building total floors, carpet area exceeding super built-up area, negative price, or swapped coordinates).
                  </p>
                </div>
              </div>
            )}
            {listing.is_fake && !listing.is_corrupt && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-3">
                <Flame className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-400 uppercase tracking-wider">Audit Alert: Lead Enquiry Bait Listing</span>
                  <p className="mt-0.5">
                    This listing was flagged for displaying suspicious clickbait pricing (e.g. monthly rental price listed under sale price or fake miniature area) intended solely to generate telephone enquiries.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Key Features Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Bedrooms</span>
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <Bed className="w-5 h-5 text-emerald-400" />
              <span>{listing.bedroom !== undefined ? `${listing.bedroom} BHK` : 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Bathrooms</span>
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <Bath className="w-5 h-5 text-teal-400" />
              <span>{listing.bathroom !== undefined ? `${listing.bathroom} Baths` : 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Carpet Area</span>
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <Maximize2 className="w-5 h-5 text-cyan-400" />
              <span>{listing.carpet_area ? `${listing.carpet_area} sqft` : 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Floor / Total</span>
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <Building className="w-5 h-5 text-indigo-400" />
              <span>
                {listing.floor !== undefined && listing.total_floors !== undefined
                  ? `${listing.floor} / ${listing.total_floors}`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Extended Specs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Specifications Panel */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center">
              <Layers className="w-4 h-4 mr-2 text-emerald-400" /> Property Specifications
            </h3>
            <dl className="divide-y divide-slate-800 text-xs">
              <div className="py-2 flex justify-between">
                <dt className="text-slate-400">Super Built-Up Area</dt>
                <dd className="font-semibold text-white">{listing.super_built_up_area ? `${listing.super_built_up_area} sqft` : 'N/A'}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-slate-400">Furnishing Status</dt>
                <dd className="font-semibold text-white capitalize">{listing.furnishing || 'N/A'}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-slate-400">Facing Direction</dt>
                <dd className="font-semibold text-white capitalize">{listing.facing_direction || 'N/A'}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-slate-400">Balcony Count</dt>
                <dd className="font-semibold text-white">{listing.balcony !== undefined ? listing.balcony : 'N/A'}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-slate-400">Covered Parking</dt>
                <dd className="font-semibold text-white">{listing.covered_parking ? `${listing.covered_parking} Slot(s)` : 'None'}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-slate-400">Website Origin</dt>
                <dd className="font-mono text-emerald-400 capitalize">{listing.website || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          {/* Contact & Advertiser Info */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center">
              <User className="w-4 h-4 mr-2 text-emerald-400" /> Posted By Advertiser
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  {listing.posted_by_name ? listing.posted_by_name[0] : 'A'}
                </div>
                <div>
                  <span className="font-bold text-white block text-sm">{listing.posted_by_name || 'Advertiser'}</span>
                  <span className="text-[11px] text-emerald-400 uppercase font-semibold tracking-wider">
                    {listing.posted_by || 'Agent'}
                  </span>
                </div>
              </div>

              {listing.posted_by_contact && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono font-bold text-white">{listing.posted_by_contact}</span>
                  </div>
                  <a
                    href={`tel:${listing.posted_by_contact}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors"
                  >
                    Call
                  </a>
                </div>
              )}

              {listing.posted_at && (
                <div className="flex items-center space-x-2 text-slate-400 text-xs pt-1">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Posted At: {new Date(listing.posted_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Link Banner (if project_id exists) */}
        {relatedProject && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Associated Project</span>
              <h4 className="font-bold text-white text-sm">{relatedProject.apartment_name}</h4>
              <p className="text-xs text-slate-400">Developer: {relatedProject.developer_name || 'N/A'} • Status: {relatedProject.project_status}</p>
            </div>
            <Link
              href="/projects"
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center"
            >
              <span>View Projects Directory</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        )}

        {/* Description Section */}
        {listing.description && (
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Property Description</h3>
            <p className="text-xs text-slate-300 leading-relaxed p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
              {listing.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
