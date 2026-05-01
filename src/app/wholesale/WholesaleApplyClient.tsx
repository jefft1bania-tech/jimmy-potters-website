'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { track } from '@/lib/analytics/client';

type Form = {
  companyName: string;
  companyWebsite: string;
  companyAddress: string;
  contactName: string;
  email: string;
  phone: string;
  password: string;
  expectedVolume: '' | 'under_5k' | '5k_25k' | '25k_100k' | 'over_100k';
  notes: string;
};

const EMPTY: Form = {
  companyName: '',
  companyWebsite: '',
  companyAddress: '',
  contactName: '',
  email: '',
  phone: '',
  password: '',
  expectedVolume: '',
  notes: '',
};

const VOLUME_TO_CENTS: Record<Form['expectedVolume'], number | null> = {
  '': null,
  under_5k: 250000,
  '5k_25k': 1500000,
  '25k_100k': 6250000,
  over_100k: 15000000,
};

export default function WholesaleApplyClient() {
  const router = useRouter();
  const { signup, member, loading: authLoading } = useAuth();

  const [form, setForm] = useState<Form>(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ email: string; applicationId: string } | null>(null);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [k]: e.target.value }));
  };

  const canSubmit =
    !!form.companyName.trim() &&
    !!form.contactName.trim() &&
    !!form.email.trim() &&
    !!form.phone.trim() &&
    form.password.length >= 6 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    // Step 1 — create the Supabase auth account. Supabase sends the
    // confirmation email itself (via emailRedirectTo in AuthProvider).
    const authResult = await signup(form.email.trim(), form.contactName.trim(), form.password);
    if (authResult.error) {
      // Treat "user already exists" as a soft path — we'll still record the
      // application; they can sign in with their existing password.
      const msg = authResult.error.toLowerCase();
      const alreadyExists = msg.includes('already') || msg.includes('registered') || msg.includes('exists');
      if (!alreadyExists) {
        setError(authResult.error);
        setSubmitting(false);
        return;
      }
    }

    // Step 2 — persist the application.
    try {
      const res = await fetch('/api/wholesale/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          companyAddress: form.companyAddress.trim(),
          companyWebsite: form.companyWebsite.trim(),
          contactName: form.contactName.trim(),
          contactEmail: form.email.trim(),
          contactPhone: form.phone.trim(),
          expectedAnnualVolumeCents: VOLUME_TO_CENTS[form.expectedVolume],
          notes: form.notes.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);

      // Analytics: the #1 brand/functionality KPI.
      track('wholesale_apply_submit', {
        volume_band: form.expectedVolume || 'unspecified',
        has_website: !!form.companyWebsite.trim(),
        application_id: data.applicationId,
      });

      setSuccess({ email: form.email.trim(), applicationId: data.applicationId });
      setForm(EMPTY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Already-signed-in wholesale buyers can skip the account step.
  const alreadySignedIn = !authLoading && !!member;

  if (success) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-[#F7F3EE] to-[#EFE8DE] flex items-center px-4 py-16">
        <div className="max-w-xl mx-auto w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100">
          <div className="bg-gradient-to-br from-[#1a1a1a] via-[#2a2420] to-[#1a1a1a] p-8 text-center">
            <div className="inline-flex w-14 h-14 rounded-full items-center justify-center bg-[#C9A96E]/20 border border-[#C9A96E]/40 mb-3">
              <svg className="w-7 h-7 text-[#E8D5A3]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-xs font-body font-semibold tracking-[0.3em] uppercase text-[#E8D5A3] mb-2">Application Received</p>
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-white">
              Welcome to the wholesale roster
            </h1>
          </div>
          <div className="p-8 md:p-10 space-y-4">
            <p className="text-stone-800 font-body leading-relaxed">
              Thanks — your application is in, and we just created your account under{' '}
              <span className="font-bold">{success.email}</span>.
            </p>
            <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm text-stone-700 font-body">
              <p className="flex gap-2"><span className="font-bold text-[#C9A96E]">1.</span> Check your inbox — confirm your email address (takes 30 seconds).</p>
              <p className="flex gap-2"><span className="font-bold text-[#C9A96E]">2.</span> We review every application personally. Expect a reply within <strong>1–2 business days</strong>.</p>
              <p className="flex gap-2"><span className="font-bold text-[#C9A96E]">3.</span> Once approved, your wholesale pricing unlocks automatically at sign-in.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/shop"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#C9A96E] text-[#1a1a1a] hover:bg-[#E8D5A3] font-body font-semibold py-3 px-6 rounded-xl transition-all text-sm"
              >
                Browse the Catalog
              </Link>
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center border border-stone-300 text-stone-700 hover:border-stone-400 font-body font-semibold py-3 px-6 rounded-xl transition-all text-sm"
              >
                Return Home
              </Link>
            </div>
            <p className="text-[11px] text-stone-500 text-center font-body pt-2">
              Reference: {success.applicationId.slice(0, 8)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F3EE]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#2a2420] to-[#1a1a1a]">
        <div className="absolute inset-0 opacity-[0.22]">
          <Image
            src="/images/brand/about-garden.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#1a1a1a]" />
        <div className="relative section-container py-16 md:py-20 text-center">
          <span className="inline-block font-body text-[10px] font-semibold tracking-[0.3em] uppercase text-[#E8D5A3] mb-4">
            For Retailers & Plant Shops
          </span>
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-white leading-[1.05] tracking-tight">
            Stock Jimmy Potters in Your Store
          </h1>
          <p className="text-white/85 font-body mt-4 text-lg max-w-2xl mx-auto">
            Two minutes, one form. Create your wholesale account and we&apos;ll review your application within 1–2 business days.
          </p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            {[
              ['Tiered Pricing', 'Up to 50% off retail'],
              ['Low MOQ', 'Start with 12 pieces'],
              ['Lead Time', '4–6 weeks'],
              ['Terms', 'Net 30 on approval'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-3">
                <div className="text-[10px] font-body font-semibold tracking-[0.2em] uppercase text-[#E8D5A3]">{title}</div>
                <div className="text-white/90 text-sm font-body font-semibold mt-1 leading-tight">{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two-path banner — approved buyers sign in, new shops apply.
          Hidden when the visitor is already authenticated. */}
      {!alreadySignedIn && (
        <section className="section-container pt-10 md:pt-12">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200">
              <div className="p-6 md:p-7 flex flex-col items-start gap-2">
                <span className="text-[10px] font-body font-semibold tracking-[0.25em] uppercase text-stone-500">New shop</span>
                <h3 className="font-heading font-bold text-lg text-stone-900">Apply for a wholesale account</h3>
                <p className="text-sm text-stone-600 font-body">Two-minute form below — review in 1–2 business days.</p>
                <a
                  href="#apply-form"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-body font-semibold text-[#C9A96E] hover:underline"
                >
                  Scroll to application
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                  </svg>
                </a>
              </div>
              <div className="p-6 md:p-7 flex flex-col items-start gap-2 bg-[#C9A96E]/10 ring-1 ring-inset ring-[#C9A96E]/30">
                <span className="text-[10px] font-body font-semibold tracking-[0.25em] uppercase text-[#C9A96E]">Approved buyer</span>
                <h3 className="font-heading font-bold text-lg text-stone-900">Sign in to your account</h3>
                <p className="text-sm text-stone-600 font-body">Wholesale pricing unlocks at sign-in once you&apos;re approved.</p>
                <Link
                  href="/login?redirect=/account"
                  className="mt-2 inline-flex items-center gap-2 bg-[#1a1a1a] text-white hover:bg-[#2a2420] font-body font-semibold py-2.5 px-5 rounded-xl transition-all text-sm"
                >
                  Sign In
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Form */}
      <section id="apply-form" className="section-container py-12 md:py-16 scroll-mt-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 md:p-10">
            <div className="mb-6">
              <h2 className="font-heading font-bold text-2xl text-black">Create Your Wholesale Account</h2>
              <p className="text-stone-600 text-sm font-body mt-1">
                One form creates your wholesale login and submits your application at the same time.
              </p>
            </div>

            {!alreadySignedIn && (
              <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="text-sm font-body text-stone-700">
                  Already a wholesale buyer?
                </span>
                <Link
                  href="/login?redirect=/account"
                  aria-label="Sign in to your wholesale account"
                  className="inline-flex items-center gap-1.5 bg-[#1a1a1a] text-white hover:bg-[#2a2420] font-body font-semibold py-2 px-4 rounded-lg transition-all text-xs whitespace-nowrap"
                >
                  Sign In
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            )}

            {alreadySignedIn && (
              <div className="rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/30 px-4 py-3 mb-5 text-xs text-stone-800 font-body">
                You&apos;re signed in as <strong>{member?.email}</strong>. Your application will be linked to this account — no new password needed (just leave that field as-is, we&apos;ll skip the account-creation step).
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
              {/* Business */}
              <fieldset className="space-y-4">
                <legend className="font-heading font-bold text-xs uppercase tracking-[0.15em] text-stone-500">
                  Your Shop
                </legend>
                <TextField
                  label="Shop or Company Name"
                  required
                  id="companyName"
                  value={form.companyName}
                  onChange={set('companyName')}
                  placeholder="e.g. Fern & Clay Goods"
                  autoComplete="organization"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Website (optional)"
                    id="companyWebsite"
                    value={form.companyWebsite}
                    onChange={set('companyWebsite')}
                    placeholder="fernandclay.com"
                    autoComplete="url"
                  />
                  <SelectField
                    label="Expected Annual Order Volume"
                    id="expectedVolume"
                    value={form.expectedVolume}
                    onChange={set('expectedVolume')}
                    options={[
                      ['', 'Prefer not to say'],
                      ['under_5k', 'Under $5,000'],
                      ['5k_25k', '$5,000 – $25,000'],
                      ['25k_100k', '$25,000 – $100,000'],
                      ['over_100k', 'Over $100,000'],
                    ]}
                  />
                </div>
                <TextField
                  label="Business Address (optional — helps us estimate shipping)"
                  id="companyAddress"
                  value={form.companyAddress}
                  onChange={set('companyAddress')}
                  placeholder="Street, City, State, ZIP"
                  autoComplete="street-address"
                />
              </fieldset>

              {/* Contact */}
              <fieldset className="space-y-4 pt-2">
                <legend className="font-heading font-bold text-xs uppercase tracking-[0.15em] text-stone-500">
                  Your Contact Info
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Your Name"
                    required
                    id="contactName"
                    value={form.contactName}
                    onChange={set('contactName')}
                    placeholder="Jamie Rivera"
                    autoComplete="name"
                  />
                  <TextField
                    label="Phone"
                    required
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                  />
                </div>
                <TextField
                  label="Email (becomes your wholesale login)"
                  required
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@yourshop.com"
                  autoComplete="email"
                />
                <div>
                  <label htmlFor="password" className="block text-xs font-heading font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Create Password <span className="text-[#C9A96E]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="At least 6 characters"
                      required={!alreadySignedIn}
                      minLength={alreadySignedIn ? 0 : 6}
                      autoComplete="new-password"
                      className="w-full px-4 py-3 pr-16 rounded-xl border border-stone-300 focus:border-[#C9A96E] focus:ring-4 focus:ring-[#C9A96E]/15 outline-none font-body text-stone-900 transition-all bg-white placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-body font-semibold text-stone-500 hover:text-stone-700"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </fieldset>

              {/* Notes */}
              <div className="pt-2">
                <label htmlFor="notes" className="block text-xs font-heading font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Tell us about your shop (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={set('notes')}
                  rows={3}
                  placeholder="What do you carry? Who's your customer? Anything custom you'd love to stock?"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[#C9A96E] focus:ring-4 focus:ring-[#C9A96E]/15 outline-none font-body text-stone-900 transition-all bg-white placeholder:text-stone-400 resize-y"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 font-body">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit && !alreadySignedIn}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#C9A96E] text-[#1a1a1a] hover:bg-[#E8D5A3] disabled:opacity-50 disabled:cursor-not-allowed font-body font-semibold py-4 px-6 rounded-xl transition-all text-sm shadow-sm"
              >
                {submitting ? 'Submitting…' : alreadySignedIn ? 'Submit Application' : 'Create Account'}
                {!submitting && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </button>

              <p className="text-[11px] text-stone-500 text-center font-body">
                No payment info required. Your account is created instantly — wholesale pricing unlocks after our review.
              </p>
            </form>
          </div>

          {/* Reassurance below form */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <Reassurance icon="⚡" title="2 minutes" body="Create in one form — no PDF, no back-and-forth" />
            <Reassurance icon="🤝" title="Personal review" body="Jimmy reads every application himself" />
            <Reassurance icon="🔒" title="Your data" body="Used only for account + shipping. No sharing." />
          </div>
        </div>
      </section>
    </div>
  );
}

function TextField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-heading font-bold text-stone-700 uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-[#C9A96E] ml-0.5">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[#C9A96E] focus:ring-4 focus:ring-[#C9A96E]/15 outline-none font-body text-stone-900 transition-all bg-white placeholder:text-stone-400"
      />
    </div>
  );
}

function SelectField({
  label,
  id,
  value,
  onChange,
  options,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-heading font-bold text-stone-700 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[#C9A96E] focus:ring-4 focus:ring-[#C9A96E]/15 outline-none font-body text-stone-900 transition-all bg-white appearance-none"
      >
        {options.map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Reassurance({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white/70 p-4">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-heading font-bold text-sm text-stone-900">{title}</div>
      <div className="text-xs font-body text-stone-600 mt-1 leading-relaxed">{body}</div>
    </div>
  );
}
