'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface MemberData {
  id: string;
  email: string;
  name: string;
  preferences: {
    newsletter: boolean;
    newProducts: boolean;
    classSchedule: boolean;
  };
}

interface AuthContextType {
  member: MemberData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, name: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updatePreferences: (prefs: MemberData['preferences']) => Promise<{ error?: string }>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setMember(data.member || null))
      .catch(() => setMember(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      setMember(data.member);
      setShowAuthModal(false);
      return {};
    } catch {
      return { error: 'Login failed. Please try again.' };
    }
  }, []);

  const signup = useCallback(async (email: string, name: string, password: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      setMember(data.member);
      setShowAuthModal(false);
      return {};
    } catch {
      return { error: 'Signup failed. Please try again.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/me', { method: 'DELETE' });
    setMember(null);
  }, []);

  const updatePreferences = useCallback(async (prefs: MemberData['preferences']) => {
    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      setMember(data.member);
      return {};
    } catch {
      return { error: 'Failed to update preferences.' };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ member, loading, login, signup, logout, updatePreferences, showAuthModal, setShowAuthModal }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
