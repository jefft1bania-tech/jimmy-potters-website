import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Supabase redirects land here after:
// - email confirmation on signup
// - magic-link / OTP login
// - password-reset link (handed off to /reset-password once the session is live)
// We exchange the ?code=... for a session, write the cookies, then bounce
// the user to ?next= (same-origin only) or a sensible default.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next');
  const errorParam = url.searchParams.get('error_description') || url.searchParams.get('error');
  const type = url.searchParams.get('type'); // 'recovery' for password reset, 'signup' for confirm, etc.

  // Same-origin only — never trust a redirect param from the email link.
  const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
    ? nextParam
    : null;

  if (errorParam) {
    const redirect = new URL('/login', url.origin);
    redirect.searchParams.set('error', errorParam);
    return NextResponse.redirect(redirect);
  }

  if (!code) {
    const redirect = new URL('/login', url.origin);
    redirect.searchParams.set('error', 'Missing confirmation code. Try the link in your email again.');
    return NextResponse.redirect(redirect);
  }

  // Build a response we can attach auth cookies to.
  let response = NextResponse.redirect(
    new URL(safeNext || (type === 'recovery' ? '/reset-password' : '/account'), url.origin),
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options: CookieOptions) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options: CookieOptions) => {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const redirect = new URL('/login', url.origin);
    redirect.searchParams.set('error', error.message);
    return NextResponse.redirect(redirect);
  }

  return response;
}
