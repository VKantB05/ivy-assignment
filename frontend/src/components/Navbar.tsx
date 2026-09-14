'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useSavedListings } from '../context/SavedListingsContext';
import { Building2, Heart, BarChart3, Home, Key, LogOut, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { savedIds } = useSavedListings();

  const navItems = [
    { name: 'Listings', href: '/listings', icon: Home },
    { name: 'Rentals', href: '/rentals', icon: Key },
    { name: 'Projects', href: '/projects', icon: Building2 },
    { name: 'Saved', href: '/saved', icon: Heart, badge: savedIds.length },
    { name: 'Insights & Audit', href: '/insights', icon: BarChart3, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/90 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/listings" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-emerald-400">
              Ivy Homes
            </span>
            <span className="block text-[10px] text-emerald-400 font-medium tracking-wider uppercase">
              Chennai Real Estate Audit
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/listings' && pathname === '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500 text-slate-950">
                    {item.badge}
                  </span>
                )}
                {item.highlight && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Audit
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                {user.email.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <span className="block font-medium text-slate-200">{user.email}</span>
                <span className="inline-flex items-center text-[10px] text-emerald-400 font-medium">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Active Session
                </span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:opacity-90 shadow-md shadow-emerald-500/20 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
