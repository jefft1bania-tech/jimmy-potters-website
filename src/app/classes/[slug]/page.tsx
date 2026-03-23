'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/products';
import Badge from '@/components/shared/Badge';
import WhatIsIncluded from '@/components/classes/WhatIsIncluded';

// Note: In production, fetch class data from an API route to keep Zoom links server-side
// For now, we use static data without Zoom fields (PublicClassSession)
import classesData from '../../../../data/classes.json';

export default function ClassDetailPage({ params }: { params: { slug: string } }) {
  const classSession = classesData.find((c) => c.slug === params.slug);
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!classSession) {
    return (
      <div className="py-20 text-center">
        <div className="section-container">
          <div className="card p-12">
            <p className="font-heading font-bold text-xl text-brand-text">Class not found</p>
            <Link href="/classes" className="text-brand-cta hover:underline mt-4 block">
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
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <div className="py-12">
      <div className="section-container">
        {/* Breadcrumb */}
        <nav className="text-white/50 text-sm font-body mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2">→</span>
          <Link href="/classes" className="hover:text-white">Classes</Link>
          <span className="mx-2">→</span>
          <span className="text-white/80">{classSession.name}</span>
        </nav>

        <div className="card p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Left: Images */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <Image
                  src={classSession.images[0]}
                  alt={classSession.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              <WhatIsIncluded items={classSession.kitContents} />
            </div>

            {/* Right: Details + Registration */}
            <div className="flex flex-col">
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text">
                {classSession.name}
              </h1>

              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="teal">{classSession.ageRange}</Badge>
                <Badge variant="purple">Zoom</Badge>
              </div>

              <p className="mt-4 text-gray-600 font-body leading-relaxed">
                {classSession.description}
              </p>

              {/* Schedule */}
              <div className="mt-6 bg-gray-50 rounded-xl p-4">
                <h3 className="font-heading font-bold text-sm text-brand-text mb-3">
                  📅 Class Schedule
                </h3>
                <div className="space-y-2">
                  {classSession.schedule.dates.map((date, i) => (
                    <div key={i} className="flex justify-between text-sm font-body">
                      <span className="text-gray-700">Week {i + 1}: {formatDate(date)}</span>
                      <span className="text-gray-500">{classSession.schedule.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-3xl font-heading font-extrabold text-brand-orange">
                  {formatPrice(classSession.price)}
                </span>
                <span className="text-sm text-gray-500 font-body">per child</span>
              </div>
              <p className="text-sm text-brand-cta font-heading font-bold mt-1">
                15% sibling discount — use code SIBLING15 at checkout
              </p>

              {/* Spots */}
              {!isFull && (
                <div className="mt-3">
                  <Badge variant="green">{spots} spots remaining</Badge>
                </div>
              )}

              {/* Registration Form */}
              {!isFull ? (
                <div className="mt-8 space-y-4">
                  <div>
                    <label className="block text-sm font-heading font-bold text-brand-text mb-2">
                      Child&apos;s Name *
                    </label>
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="Enter your child's name"
                      className="w-full px-4 py-3 rounded-xl border-2 border-brand-border focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20 outline-none font-body text-brand-text transition-all"
                    />
                  </div>

                  <button
                    onClick={handleRegister}
                    disabled={!childName.trim() || loading}
                    className="w-full py-4 px-8 rounded-xl bg-brand-cta hover:bg-brand-cta-hover text-white font-heading font-bold text-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? 'Redirecting to checkout...' : `Register Now — ${formatPrice(classSession.price)} 🎨`}
                  </button>
                </div>
              ) : (
                <div className="mt-8">
                  <button className="w-full py-4 px-8 rounded-xl border-2 border-brand-cta text-brand-cta font-heading font-bold text-lg">
                    Class Full — Join Waitlist
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
