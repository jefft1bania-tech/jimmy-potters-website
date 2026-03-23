'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { useState } from 'react';
import { formatPrice } from '@/lib/products';

// Import class data for registration
import classesData from '../../../data/classes.json';

export default function AccountPage() {
  const { member, loading, logout, updatePreferences, setShowAuthModal } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [childName, setChildName] = useState('');
  const [registering, setRegistering] = useState(false);

  const openClasses = classesData.filter((c) => c.status === 'open');

  if (loading) {
    return (
      <div className="shop-section text-center">
        <div className="card-faire-detail p-16">
          <p className="text-gray-400 font-body">Loading...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="shop-section">
        <div className="card-faire-detail p-16 max-w-lg mx-auto text-center">
          <div className="text-4xl mb-4">🏺</div>
          <h1 className="font-heading font-black text-2xl text-brand-text">
            Join Jimmy Potters
          </h1>
          <p className="text-gray-400 font-body mt-3 leading-relaxed">
            Create a free account to receive newsletters, get notified about
            new pottery drops, register for classes, and stay up to date.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="btn-vibrant mt-6 inline-block"
          >
            Sign Up / Log In
          </button>
        </div>
      </div>
    );
  }

  const handleToggle = async (key: keyof typeof member.preferences) => {
    setSaving(true);
    setSaved(false);
    const updated = { ...member.preferences, [key]: !member.preferences[key] };
    await updatePreferences(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClassRegister = async (cls: typeof classesData[0]) => {
    if (!childName.trim()) return;
    setRegistering(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: cls.id,
          childName: childName.trim(),
          stripePriceId: cls.stripePriceId,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const prefs = [
    {
      key: 'newsletter' as const,
      label: 'Newsletter',
      description: 'Monthly updates with pottery tips, behind-the-scenes, and community stories',
      icon: '📧',
    },
    {
      key: 'newProducts' as const,
      label: 'New Product Drops',
      description: 'Be the first to know when new one-of-a-kind pottery is listed',
      icon: '🏺',
    },
    {
      key: 'classSchedule' as const,
      label: 'Class Schedule Updates',
      description: 'Get notified when new virtual pottery class sessions open for registration',
      icon: '🎨',
    },
  ];

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="shop-section">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="card-vibrant overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-vibrant-purple via-vibrant-teal to-vibrant-orange p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                🏺
              </div>
              <div>
                <h1 className="font-heading font-black text-2xl text-white">
                  {member.name}
                </h1>
                <p className="text-white/70 font-body text-sm">{member.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ CLASS REGISTRATION ═══ */}
        {openClasses.length > 0 && (
          <div className="card-vibrant overflow-hidden mb-6">
            {/* Gradient header */}
            <div className="bg-gradient-to-r from-vibrant-purple/10 to-vibrant-teal/10 p-6 md:p-8 border-b border-vibrant-purple/10">
              <h2 className="font-heading font-black text-xl text-brand-text flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">🎨</span>
                Register for a Class
              </h2>
              <p className="text-gray-500 font-body text-sm mt-1">
                Sign up your child directly from your account
              </p>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {openClasses.map((cls) => {
                const spots = cls.maxStudents - cls.enrolledCount;
                return (
                  <div key={cls.id} className="rounded-2xl border border-vibrant-purple/10 overflow-hidden">
                    {/* Class info header */}
                    <div className="bg-vibrant-lavender/20 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-heading font-extrabold text-lg text-brand-text">
                            {cls.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="badge-vibrant-teal text-xs">{cls.ageRange}</span>
                            <span className="badge-vibrant-purple text-xs">Live on Zoom</span>
                            {spots <= 5 && spots > 0 && (
                              <span className="badge-vibrant-orange text-xs animate-count-pulse">
                                Only {spots} spots left!
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-2xl font-heading font-black bg-gradient-to-r from-vibrant-purple to-vibrant-orange bg-clip-text text-transparent">
                            {formatPrice(cls.price)}
                          </span>
                          <p className="text-xs text-gray-400 font-body">per child</p>
                        </div>
                      </div>
                    </div>

                    {/* Schedule + Registration */}
                    <div className="p-5 space-y-4">
                      {/* Schedule row */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-body text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <span className="text-base" aria-hidden="true">📅</span>
                          {cls.schedule.dayOfWeek}s, {cls.schedule.time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-base" aria-hidden="true">📆</span>
                          {cls.schedule.dates.map(formatDate).join(', ')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-base" aria-hidden="true">📦</span>
                          Clay kit included
                        </span>
                      </div>

                      {/* Sibling discount callout */}
                      <div className="flex items-center gap-2 bg-vibrant-lavender/30 rounded-xl px-4 py-2.5">
                        <span className="text-sm" aria-hidden="true">👨‍👩‍👧‍👦</span>
                        <span className="text-xs font-heading font-bold text-vibrant-purple-dark">
                          15% sibling discount — use code SIBLING15 at checkout
                        </span>
                      </div>

                      {/* Registration form */}
                      {spots > 0 ? (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1">
                            <label htmlFor={`child-name-${cls.id}`} className="sr-only">
                              Child&apos;s name for {cls.name}
                            </label>
                            <input
                              id={`child-name-${cls.id}`}
                              type="text"
                              value={childName}
                              onChange={(e) => setChildName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleClassRegister(cls)}
                              placeholder="Your child's name"
                              className="w-full px-4 py-3 rounded-xl border-2 border-brand-border/60 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/15 outline-none font-body text-brand-text text-sm transition-all placeholder:text-gray-300"
                              required
                              autoComplete="given-name"
                            />
                          </div>
                          <button
                            onClick={() => handleClassRegister(cls)}
                            disabled={!childName.trim() || registering}
                            className="btn-vibrant !py-3 !px-6 !text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            aria-busy={registering}
                          >
                            {registering ? 'Loading...' : "Let's Get Messy! 🎨"}
                          </button>
                        </div>
                      ) : (
                        <button className="w-full py-3 px-6 rounded-xl border-2 border-vibrant-purple text-vibrant-purple font-heading font-bold text-sm hover:bg-vibrant-purple/5 transition-all">
                          Class Full — Join Waitlist
                        </button>
                      )}

                      {/* Spots remaining */}
                      {spots > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="badge-vibrant-lime text-xs">{spots} spots remaining</span>
                          <Link
                            href={`/classes/${cls.slug}`}
                            className="text-xs text-vibrant-purple font-heading font-bold hover:underline"
                          >
                            View full details →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notification Preferences */}
        <div className="card-vibrant p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-lg text-brand-text">
              Notification Preferences
            </h2>
            {saved && (
              <span className="badge-vibrant-lime text-xs animate-pop-in">Saved!</span>
            )}
          </div>

          <div className="space-y-4">
            {prefs.map((pref) => (
              <div
                key={pref.key}
                className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-vibrant-lavender/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl" aria-hidden="true">{pref.icon}</span>
                  <div>
                    <p className="font-heading font-bold text-sm text-brand-text">{pref.label}</p>
                    <p className="text-xs text-gray-400 font-body mt-0.5">{pref.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(pref.key)}
                  disabled={saving}
                  className={`relative w-12 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-vibrant-purple/30 focus:ring-offset-2 ${
                    member.preferences[pref.key]
                      ? 'bg-vibrant-purple'
                      : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={member.preferences[pref.key]}
                  aria-label={`${pref.label}: ${member.preferences[pref.key] ? 'enabled' : 'disabled'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                      member.preferences[pref.key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="card-vibrant p-6 md:p-8 mb-6">
          <h2 className="font-heading font-bold text-lg text-brand-text mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/shop" className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-vibrant-peach/30 transition-colors group">
              <span className="text-xl group-hover:scale-110 transition-transform">🏺</span>
              <span className="font-heading font-bold text-sm text-brand-text">Shop Pottery</span>
            </Link>
            <Link href="/classes" className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-vibrant-lavender/30 transition-colors group">
              <span className="text-xl group-hover:scale-110 transition-transform">🎨</span>
              <span className="font-heading font-bold text-sm text-brand-text">Browse All Classes</span>
            </Link>
          </div>
        </div>

        {/* Logout */}
        <div className="text-center">
          <button
            onClick={logout}
            className="text-sm text-gray-400 font-body hover:text-red-400 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
