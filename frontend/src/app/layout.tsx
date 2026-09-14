import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SavedListingsProvider } from '../context/SavedListingsContext';
import { Navbar } from '../components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ivy Homes Real Estate & Data Audit',
  description: 'Chennai Real Estate Property Explorer, Rental Engine, Projects Directory & Data Integrity Audit',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950`}>
        <AuthProvider>
          <SavedListingsProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-400">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                <p>© 2026 Ivy Homes Internship Assignment. Chennai Locality: Velachery.</p>
                <p className="text-emerald-400/80 font-mono">Reference Date: 2026-09-10T00:00:00+05:30 (IST)</p>
              </div>
            </footer>
          </SavedListingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
