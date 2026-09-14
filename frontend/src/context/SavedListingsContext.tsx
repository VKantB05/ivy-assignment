'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface SavedListingsContextType {
  savedIds: string[];
  isSaved: (listingId: string) => boolean;
  toggleSave: (listingId: string) => void;
  clearSaved: () => void;
}

const SavedListingsContext = createContext<SavedListingsContextType | undefined>(undefined);

export const SavedListingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const storageKey = user ? `saved_listings_${user.email}` : 'saved_listings_guest';

  // Load user-isolated saved listings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSavedIds(JSON.parse(stored));
      } else {
        setSavedIds([]);
      }
    } catch (err) {
      console.error('Error loading saved listings:', err);
      setSavedIds([]);
    }
  }, [storageKey]);

  const toggleSave = (listingId: string) => {
    setSavedIds((prev) => {
      let updated: string[];
      if (prev.includes(listingId)) {
        updated = prev.filter((id) => id !== listingId);
      } else {
        updated = [...prev, listingId];
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving to localStorage:', err);
      }
      return updated;
    });
  };

  const isSaved = (listingId: string) => {
    return savedIds.includes(listingId);
  };

  const clearSaved = () => {
    setSavedIds([]);
    localStorage.removeItem(storageKey);
  };

  return (
    <SavedListingsContext.Provider value={{ savedIds, isSaved, toggleSave, clearSaved }}>
      {children}
    </SavedListingsContext.Provider>
  );
};

export function useSavedListings(): SavedListingsContextType {
  const context = useContext(SavedListingsContext);
  if (!context) {
    throw new Error('useSavedListings must be used within a SavedListingsProvider');
  }
  return context;
}
