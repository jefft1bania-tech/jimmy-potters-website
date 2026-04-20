'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export interface MemberData {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'wholesale';
  preferences: {
    newsletter: boolean;
  };
}

export type AuthResult = { error?: string };

interface AuthContextType {
  member: MemberData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, name: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updatePreferences: (prefs: MemberData['preferences']) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('user already registered') || m.includes('already exists')) {
    return 'An account with that email already exists. Try signing in instead.';
  }
  if (m.includes('invalid login credentials')) {
    return 'Wrong email or password.';
  }
  if (m.includes('email not confirmed') || m.includes('confirm your email')) {
    return 'Check your inbox to confirm your email first.';
  }
  if (m.includes('password should be at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (m.includes('rate limit') || m.includes('over_email_send_rate_limit')) {
    return 'Too many requests. Wait a minute and try again.';
  }
  if (m.includes('invalid email')) {
    return 'That email address looks invalid.';
  }
  if (m.includes('token') && (m.includes('expired') || m.includes('invalid'))) {
    return 'This link expired or was already used. Request a new one.';
  }
  // Fallback — surface Supabase's phrase rather than swallowing it.
  return message;
}

function siteOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return process.env.NEXT_PUBLIC_URL || '';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);

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
      role: 'customer' | 'admin' | 'wholesale';
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

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: friendlyError(error.message) };
    return {};
  }, [supabase]);

  const signup = useCallback(async (email: string, name: string, password: string): Promise<AuthResult> => {
    if (password.length < 6) return { error: 'Password must be at least 6 characters.' };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${siteOrigin()}/auth/callback`,
      },
    });
    if (error) return { error: friendlyError(error.message) };
    return {};
  }, [supabase]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setMember(null);
  }, [supabase]);

  const updatePreferences = useCallback(async (prefs: MemberData['preferences']): Promise<AuthResult> => {
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

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteOrigin()}/reset-password`,
    });
    if (error) return { error: friendlyError(error.message) };
    return {};
  }, [supabase]);

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    if (newPassword.length < 6) return { error: 'Password must be at least 6 characters.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: friendlyError(error.message) };
    return {};
  }, [supabase]);

  const resendConfirmation = useCallback(async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${siteOrigin()}/auth/callback` },
    });
    if (error) return { error: friendlyError(error.message) };
    return {};
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        member,
        loading,
        login,
        signup,
        logout,
        updatePreferences,
        requestPasswordReset,
        updatePassword,
        resendConfirmation,
      }}
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
