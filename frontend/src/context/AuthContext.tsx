'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthSession, User } from '../lib/types';
import { loginWithApi, refreshApiToken } from '../lib/api';

const SESSION_STORAGE_KEY = 'ivy_auth_session';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (userEmail: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed: AuthSession = JSON.parse(stored);
        // Check if refresh token exists
        if (parsed && parsed.access_token) {
          setSession(parsed);
        }
      }
    } catch (err) {
      console.error('Error restoring session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Automatic background token refresh (every 12 mins = 720,000 ms)
  const handleTokenRefresh = useCallback(async () => {
    if (!session || !session.refresh_token) return;
    try {
      const updated = await refreshApiToken(session.refresh_token);
      const newSession: AuthSession = {
        ...session,
        access_token: updated.access_token,
        obtained_at: Date.now(),
      };
      setSession(newSession);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    } catch (err) {
      console.warn('Auto refresh warning:', err);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      handleTokenRefresh();
    }, 12 * 60 * 1000); // 12 minutes
    return () => clearInterval(interval);
  }, [session, handleTokenRefresh]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const newSession = await loginWithApi(email, password);
      setSession(newSession);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (userEmail: string) => {
    return login(userEmail, 'acd9ab15ef');
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        session,
        isLoading,
        login,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
