import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from './types';

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Components cannot set cookies; middleware handles refresh instead.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // see above
          }
        },
      },
    },
  );
}

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  role: 'customer' | 'admin';
  newsletter_opt_in: boolean;
};

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, name, role, newsletter_opt_in')
    .eq('id', user.id)
    .single();

  return (profile as UserProfile | null) ?? null;
}

export async function requireAdmin(): Promise<UserProfile> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Response('Not found', { status: 404 });
  }
  return profile;
}
