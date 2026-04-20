'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export interface MemberData {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  preferences: {
    newsletter: boolean;
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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const loadProfile = useCallback(async (userId: string): Promise<MemberData | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, newsletter_opt_in')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    const row = data as unknown as {
      id: string;
      email: string;
      name: string | null;
      role: 'customer' | 'admin';
      newsletter_opt_in: boolean;
    };
    return {
      id: row.id,
      email: row.email,
      name: row.name ?? '',
      role: row.role,
      preferences: { newsletter: row.newsletter_opt_in },
    };
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!mounted) return;
      if (user) {
        const profile = await loadProfile(user.id);
        if (mounted) setMember(profile);
      }
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        if (mounted) setMember(profile);
      } else {
        setMember(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    setShowAuthModal(false);
    return {};
  }, [supabase]);

  const signup = useCallback(async (email: string, name: string, password: string) => {
    if (password.length < 6) return { error: 'Password must be at least 6 characters' };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error: error.message };
    setShowAuthModal(false);
    return {};
  }, [supabase]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setMember(null);
  }, [supabase]);

  const updatePreferences = useCallback(async (prefs: MemberData['preferences']) => {
    if (!member) return { error: 'Not signed in' };
    const { error } = await (supabase.from('profiles') as unknown as {
      update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
    })
      .update({ newsletter_opt_in: prefs.newsletter })
      .eq('id', member.id);
    if (error) return { error: error.message };
    setMember({ ...member, preferences: prefs });
    return {};
  }, [supabase, member]);

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
