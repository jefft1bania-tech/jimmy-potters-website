'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/products';
import WhatIsIncluded from '@/components/classes/WhatIsIncluded';
import { useScrollReveal } from '@/lib/useScrollReveal';
import classesData from '../../../../data/classes.json';

export default function ClassDetailPage({ params }: { params: { slug: string } }) {
  const classSession = classesData.find((c) => c.slug === params.slug);
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useScrollReveal();

  if (!classSession) {
    return (
      <div className="classes-bg min-h-screen py-20 text-center">
        <div className="section-container relative z-10">
          <div className="card-vibrant p-12">
            <p className="font-heading font-bold text-xl text-brand-text">Class not found</p>
            <Link href="/classes" className="text-vibrant-purple hover:underline mt-4 block font-heading font-bold">
              ← Back to Classes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const spots = classSession.maxStudents - classSession.enrolledCount;
  const isFull = classSession.status === 'full' || spots <= 0;

  const handleRegister = async () => {
    if (!childName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classSession.id,
          childName: childName.trim(),
          stripePriceId: classSession.stripePriceId,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div ref={containerRef} className="classes-bg min-h-screen py-12">
      {/* Floating blobs */}
      <div className="blob-solid w-[400px] h-[400px] -top-32 -right-32 bg-vibrant-purple" />
      <div className="blob-solid w-[300px] h-[300px] bottom-20 -left-32 bg-vibrant-teal" style={{ animationDelay: '5s' }} />

      <div className="section-container relative z-10">
        {/* Breadcrumb */}
        <nav className="text-white/40 text-sm font-body mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-white/70 transition-colors">Home</Link></li>
            <li aria-hidden="true"><span className="mx-1 text-white/20">/</span></li>
            <li><Link href="/classes" className="hover:text-white/70 transition-colors">Classes</Link></li>
            <li aria-hidden="true"><span className="mx-1 text-white/20">/</span></li>
            <li><span className="text-white/60">{classSession.name}</span></li>
          </ol>
        </nav>

        <div className="card-vibrant scroll-reveal">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* ═══ LEFT: Visual Side ═══ */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Hero image — organic wavy frame */}
              <div className="relative aspect-[4/3] frame-wavy">
                <Image
                  src={classSession.images[0]}
                  alt={`Child enjoying ${classSession.name} pottery class`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div className="absolute top-4 left-4 animate-float">
                  <span className="badge-vibrant-teal shadow-lg">Live on Zoom</span>
                </div>
              </div>

              {/* Kit contents */}
              <div className="scroll-reveal" style={{ transitionDelay: '200ms' }}>
                <WhatIsIncluded items={classSession.kitContents} />
              </div>
            </div>

            {/* ═══ RIGHT: Registration Side ═══ */}
            <div className="p-6 md:p-8 lg:p-10 flex flex-col bg-gradient-to-b from-white via-vibrant-lavender/10 to-vibrant-sky/20">
              <h1 className="font-heading font-black text-2xl md:text-3xl text-brand-text leading-tight">
                {classSession.name}
              </h1>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="badge-vibrant-teal">{classSession.ageRange}</span>
                <span className="badge-vibrant-purple">Zoom</span>
                <span className="badge-vibrant-orange">15% Sibling Discount</span>
              </div>

              <p className="mt-4 text-gray-600 font-body leading-relaxed">
                {classSession.description}
              </p>

              {/* Schedule card */}
              <div className="mt-6 rounded-2xl border border-vibrant-purple/10 bg-vibrant-lavender/30 p-5 scroll-reveal" style={{ transitionDelay: '100ms' }}>
                <h3 className="font-heading font-bold text-sm text-brand-text mb-3 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-vibrant-purple text-white text-xs">📅</span>
                  Class Schedule
                </h3>
                <div className="space-y-2">
                  {classSession.schedule.dates.map((date, i) => (
                    <div key={i} className="flex justify-between items-center text-sm font-body py-1.5 px-3 rounded-xl hover:bg-white/60 transition-colors">
                      <span className="text-gray-700 font-medium">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-vibrant-purple/10 text-vibrant-purple text-[10px] font-heading font-black mr-2">
                          {i + 1}
                        </span>
                        {formatDate(date)}
                      </span>
                      <span className="text-gray-400 text-xs">{classSession.schedule.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mt-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-heading font-black bg-gradient-to-r from-vibrant-purple to-vibrant-orange bg-clip-text text-transparent">
                    {formatPrice(classSession.price)}
                  </span>
                  <span className="text-sm text-gray-400 font-body">per child</span>
                </div>
                <p className="text-sm text-vibrant-purple font-heading font-bold mt-1 flex items-center gap-1">
                  <span>👨‍👩‍👧‍👦</span> 15% sibling discount — code SIBLING15
                </p>
              </div>

              {!isFull && (
                <div className="mt-4">
                  <span className="badge-vibrant-lime">{spots} spots remaining</span>
                </div>
              )}

              {/* ═══ REGISTRATION FORM ═══ */}
              {!isFull ? (
                <div className="mt-8 p-6 rounded-2xl bg-white border border-vibrant-purple/10 shadow-sm space-y-5 scroll-reveal" style={{ transitionDelay: '200ms' }}>
                  <h3 className="font-heading font-extrabold text-brand-text text-lg">
                    Ready to Create? 🎨
                  </h3>

                  <div>
                    <label htmlFor="child-name" className="block text-sm font-heading font-bold text-brand-text mb-2">
                      Your Child&apos;s Name <span className="text-vibrant-orange">*</span>
                    </label>
                    <input
                      id="child-name"
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                      placeholder="e.g. Sofia, Max, Ava..."
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-brand-border/60 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/15 outline-none font-body text-brand-text transition-all placeholder:text-gray-300"
                      required
                      aria-required="true"
                      autoComplete="given-name"
                    />
                  </div>

                  <button
                    onClick={handleRegister}
                    disabled={!childName.trim() || loading}
                    className="btn-vibrant w-full text-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 animate-pulse-glow"
                    aria-busy={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Heading to checkout...
                      </span>
                    ) : (
                      `Let's Get Messy! — ${formatPrice(classSession.price)}`
                    )}
                  </button>

                  <p className="text-xs text-gray-400 text-center font-body">
                    Secure checkout via Stripe. We&apos;ll collect your address to ship the clay kit.
                  </p>
                </div>
              ) : (
                <div className="mt-8">
                  <button className="w-full py-4 px-8 rounded-2xl border-2 border-vibrant-purple text-vibrant-purple font-heading font-extrabold text-lg hover:bg-vibrant-purple/5 transition-all focus:outline-none focus:ring-2 focus:ring-vibrant-purple/30">
                    Save My Spot on the Waitlist!
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
