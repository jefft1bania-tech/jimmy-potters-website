'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { useState } from 'react';

export default function AccountPage() {
  const { member, loading, logout, updatePreferences } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (loading) {
    return (
      <div className="shop-section text-center">
        <div className="card-faire-detail p-16">
          <p className="text-black font-body">Loading...</p>
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
          <p className="text-black font-body mt-3 leading-relaxed">
            Create a free account to receive newsletters, get notified about
            new pottery drops, and stay up to date.
          </p>
          <Link href="/login?redirect=/account" className="btn-vibrant mt-6 inline-block">
            Sign Up / Log In
          </Link>
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

  const prefs = [
    {
      key: 'newsletter' as const,
      label: 'Newsletter',
      description: 'Monthly updates with pottery tips, behind-the-scenes, and new product drops',
      icon: '📧',
    },
  ];

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
                    <p className="text-xs text-black font-body mt-0.5">{pref.description}</p>
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
            <Link href="/about" className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-vibrant-lavender/30 transition-colors group">
              <span className="text-xl group-hover:scale-110 transition-transform">📖</span>
              <span className="font-heading font-bold text-sm text-brand-text">About Us</span>
            </Link>
          </div>
        </div>

        {/* Logout */}
        <div className="text-center">
          <button
            onClick={logout}
            className="text-sm text-black font-body hover:text-red-400 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
