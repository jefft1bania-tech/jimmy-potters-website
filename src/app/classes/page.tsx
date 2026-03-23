import Link from 'next/link';
import Image from 'next/image';
import { getOpenClasses } from '@/lib/classes';
import ClassCard from '@/components/classes/ClassCard';
import WhatIsIncluded from '@/components/classes/WhatIsIncluded';
import ClassesFAQ from '@/components/classes/ClassesFAQ';

export const metadata = {
  title: 'Virtual Pottery Classes for Kids | Jimmy Potters',
  description:
    '4-week virtual pottery classes for kids ages 7-14. Clay kit delivered to your door. Live on Zoom. $155 per child, 15% sibling discount.',
};

export default function ClassesPage() {
  const classes = getOpenClasses();

  return (
    <div className="relative overflow-hidden">
      {/* ═══ DECORATIVE BLOBS ═══ */}
      <div className="blob-bg-purple w-[600px] h-[600px] -top-40 -right-40 opacity-60" />
      <div className="blob-bg-teal w-[500px] h-[500px] top-[800px] -left-60 opacity-50" />
      <div className="blob-bg-orange w-[400px] h-[400px] top-[1600px] -right-32 opacity-40" />

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative pt-8 pb-16" aria-label="Classes hero">
        <div className="section-container">
          <div className="card-vibrant overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Hero Image Side */}
              <div className="relative h-72 lg:h-auto lg:min-h-[420px]">
                <Image
                  src="/images/classes/kids-pottery-hero.jpg"
                  alt="Happy child sculpting colorful clay miniatures in a pottery class"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* Floating badges */}
                <div className="absolute top-4 left-4 animate-float">
                  <span className="badge-vibrant-purple shadow-lg">Ages 7-14</span>
                </div>
                <div className="absolute bottom-4 right-4 animate-float-slow">
                  <span className="badge-vibrant-orange shadow-lg">4-Week Course</span>
                </div>
              </div>

              {/* Hero Content Side */}
              <div className="relative p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-white via-vibrant-lavender/30 to-vibrant-sky/30">
                {/* Decorative blob behind text */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-vibrant-purple/5 blob-shape" />

                <span className="badge-vibrant-teal w-fit mb-4 animate-pop-in">
                  Live on Zoom
                </span>

                <h1 className="font-heading font-black text-4xl md:text-5xl text-brand-text leading-tight">
                  Virtual Pottery
                  <br />
                  <span className="bg-gradient-to-r from-vibrant-purple to-vibrant-teal bg-clip-text text-transparent">
                    for Creative Kids
                  </span>
                </h1>

                <p className="mt-5 text-gray-600 font-body text-lg leading-relaxed max-w-md">
                  Clay kit delivered to your door. Expert instruction live on Zoom.
                  Watch your child create amazing pottery from home.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-vibrant-peach rounded-xl px-4 py-2">
                    <span className="text-xl">💰</span>
                    <span className="font-heading font-bold text-vibrant-orange-dark text-sm">$155 per child</span>
                  </div>
                  <div className="flex items-center gap-2 bg-vibrant-lavender rounded-xl px-4 py-2">
                    <span className="text-xl">👨‍👩‍👧‍👦</span>
                    <span className="font-heading font-bold text-vibrant-purple-dark text-sm">15% sibling discount</span>
                  </div>
                  <div className="flex items-center gap-2 bg-vibrant-mint rounded-xl px-4 py-2">
                    <span className="text-xl">📦</span>
                    <span className="font-heading font-bold text-emerald-700 text-sm">Kit included</span>
                  </div>
                </div>

                <div className="mt-8">
                  <Link href="#available-classes" className="btn-vibrant inline-block">
                    View Classes & Register
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="relative py-16" aria-labelledby="how-it-works">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2
              id="how-it-works"
              className="font-heading font-black text-3xl md:text-4xl text-white"
            >
              How It Works
            </h2>
            <p className="text-white/60 font-body mt-2 text-lg">
              Three simple steps to pottery fun
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="step-card" role="article">
              <div className="step-icon bg-vibrant-lavender">
                <span>🎨</span>
              </div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-vibrant-purple text-white text-xs font-heading font-black mb-3">
                1
              </div>
              <h3 className="font-heading font-bold text-lg text-brand-text">
                Register & Pay
              </h3>
              <p className="text-gray-500 font-body text-sm mt-2 leading-relaxed">
                Choose your class and check out securely with Stripe. Use code{' '}
                <strong className="text-vibrant-purple">SIBLING15</strong> for 15% off siblings.
              </p>
            </div>

            {/* Step 2 */}
            <div className="step-card" role="article">
              <div className="step-icon bg-vibrant-peach">
                <span>📦</span>
              </div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-vibrant-orange text-white text-xs font-heading font-black mb-3">
                2
              </div>
              <h3 className="font-heading font-bold text-lg text-brand-text">
                Receive Your Clay Kit
              </h3>
              <p className="text-gray-500 font-body text-sm mt-2 leading-relaxed">
                A complete kit with clay, tools, and paints ships to your door
                before the first class. No extra purchases needed.
              </p>
            </div>

            {/* Step 3 */}
            <div className="step-card" role="article">
              <div className="step-icon bg-vibrant-sky">
                <span>💻</span>
              </div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-vibrant-teal text-white text-xs font-heading font-black mb-3">
                3
              </div>
              <h3 className="font-heading font-bold text-lg text-brand-text">
                Join on Zoom
              </h3>
              <p className="text-gray-500 font-body text-sm mt-2 leading-relaxed">
                Your private Zoom link arrives by email after payment.
                Join each week for live, guided instruction!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AVAILABLE CLASSES ═══ */}
      <section className="relative py-16" aria-labelledby="available-classes" id="available-classes">
        <div className="section-container">
          <div className="text-center mb-10">
            <h2
              className="font-heading font-black text-3xl md:text-4xl text-white"
            >
              Available Classes
            </h2>
            <p className="text-white/60 font-body mt-2 text-lg">
              Grab your spot before they fill up
            </p>
          </div>

          {classes.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {classes.map((cls, i) => (
                <div
                  key={cls.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <ClassCard classSession={cls} />
                </div>
              ))}
            </div>
          ) : (
            <div className="card-vibrant p-16 text-center">
              <div className="text-5xl mb-4 animate-float">🎨</div>
              <p className="font-heading font-bold text-xl text-brand-text">
                No classes currently scheduled
              </p>
              <p className="text-gray-500 font-body mt-2">
                Follow us on Instagram for announcements about new sessions!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ WHAT'S IN THE KIT ═══ */}
      {classes.length > 0 && (
        <section className="relative py-16" aria-labelledby="kit-contents">
          <div className="section-container">
            <WhatIsIncluded items={classes[0].kitContents} />
          </div>
        </section>
      )}

      {/* ═══ FAQ ═══ */}
      <section className="relative py-16 pb-24" aria-labelledby="faq-heading">
        <div className="section-container">
          <ClassesFAQ />
        </div>
      </section>
    </div>
  );
}
