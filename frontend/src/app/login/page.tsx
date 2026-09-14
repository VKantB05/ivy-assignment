'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Building2, KeyRound, Mail, AlertCircle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, demoLogin, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in
  if (user) {
    return (
      <div className="max-w-md mx-auto my-16 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Already Signed In</h2>
        <p className="text-sm text-slate-300">You are logged in as <span className="font-mono text-emerald-400 font-bold">{user.email}</span>.</p>
        <button
          onClick={() => router.push('/listings')}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:opacity-90 transition-opacity"
        >
          Go to Listings
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push('/listings');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = async (demoEmail: string) => {
    setError(null);
    setIsSubmitting(true);
    setEmail(demoEmail);
    setPassword('acd9ab15ef');
    try {
      await demoLogin(demoEmail);
      router.push('/listings');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-10 px-4">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-emerald-500/5 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20">
            <Building2 className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Sign In to Ivy Homes</h1>
          <p className="text-xs text-slate-400 mt-1">Authenticate against live server API (solve.ivy.homes)</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Authentication Failed</span>
              <p className="text-xs text-red-300/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Demo Accounts Quick Login */}
        <div className="mb-8 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
              <Zap className="w-3.5 h-3.5 mr-1" /> One-Click Demo Accounts
            </span>
            <span className="text-[10px] text-slate-400">Password: acd9ab15ef</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {['demo1@ivy.homes', 'demo2@ivy.homes', 'demo3@ivy.homes'].map((demo) => (
              <button
                key={demo}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDemoClick(demo)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-700/60 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-600/40 text-slate-200 transition-all text-center truncate"
              >
                {demo.split('@')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Standard Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo1@ivy.homes"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:opacity-95 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
          <p className="flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1" />
            Session protected with 30-minute auto token refresh
          </p>
        </div>
      </div>
    </div>
  );
}
