'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getOpenClasses } from '@/lib/classes';
import ClassCard from '@/components/classes/ClassCard';
import WhatIsIncluded from '@/components/classes/WhatIsIncluded';
import ClassesFAQ from '@/components/classes/ClassesFAQ';
import { useScrollReveal } from '@/lib/useScrollReveal';

export default function ClassesPageClient() {
  const classes = getOpenClasses();
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef} className="classes-bg min-h-screen">
      {/* ═══ FLOATING BLOB DECORATIONS ═══ */}
      <div className="blob-solid w-[500px] h-[500px] -top-48 -right-48 bg-vibrant-purple" />
      <div className="blob-solid w-[400px] h-[400px] top-[600px] -left-48 bg-vibrant-teal" style={{ animationDelay: '3s' }} />
      <div className="blob-solid w-[350px] h-[350px] top-[1200px] right-[-100px] bg-vibrant-orange" style={{ animationDelay: '6s' }} />
      <div className="blob-solid w-[300px] h-[300px] top-[1800px] left-[-80px] bg-vibrant-purple" style={{ animationDelay: '9s' }} />
      <div className="blob-solid w-[250px] h-[250px] top-[2400px] right-[-60px] bg-vibrant-teal" style={{ animationDelay: '4s' }} />

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative pt-8 pb-16" aria-label="Classes hero">
        <div className="section-container relative z-10">
          <div className="card-vibrant overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Hero Image — irregular organic frame */}
              <div className="relative h-80 lg:h-auto lg:min-h-[460px] overflow-hidden">
                <Image
                  src="/images/classes/kids-pottery-hero.jpg"
                  alt="Happy child sculpting colorful clay miniatures with bright paints and tools"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* Organic overlay shape at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/20 to-transparent" />
                {/* Floating badges */}
                <div className="absolute top-5 left-5 animate-float">
                  <span className="badge-vibrant-purple shadow-lg text-base px-4 py-1.5">Ages 7-14</span>
                </div>
                <div className="absolute bottom-5 right-5 animate-float-slow">
                  <span className="badge-vibrant-orange shadow-lg text-base px-4 py-1.5">4 Weeks of Fun!</span>
                </div>
              </div>

              {/* Hero Content */}
              <div className="relative p-8 md:p-12 lg:p-14 flex flex-col justify-center bg-gradient-to-br from-white via-vibrant-lavender/30 to-vibrant-sky/40">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-vibrant-purple/5 blob-shape" />
                <div className="absolute bottom-10 -left-16 w-32 h-32 bg-vibrant-teal/5 blob-shape" style={{ animationDelay: '4s' }} />

                <span className="badge-vibrant-teal w-fit mb-5 animate-pop-in text-base px-4 py-1.5">
                  Live on Zoom
                </span>

                <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-[3.5rem] text-brand-text leading-[1.1]">
                  Get Creative.
                  <br />
                  <span className="bg-gradient-to-r from-vibrant-purple via-vibrant-pink to-vibrant-teal bg-clip-text text-transparent">
                    Get Messy!
                  </span>
                </h1>

                <p className="mt-5 text-gray-600 font-body text-lg leading-relaxed max-w-md">
                  Virtual pottery classes where kids sculpt, paint, and create
                  amazing art — with a clay kit delivered right to your door.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-vibrant-peach rounded-2xl px-4 py-2.5 shadow-sm">
                    <span className="text-xl" aria-hidden="true">💰</span>
                    <span className="font-heading font-bold text-vibrant-orange-dark text-sm">$155 per child</span>
                  </div>
                  <div className="flex items-center gap-2 bg-vibrant-lavender rounded-2xl px-4 py-2.5 shadow-sm">
                    <span className="text-xl" aria-hidden="true">👨‍👩‍👧‍👦</span>
                    <span className="font-heading font-bold text-vibrant-purple-dark text-sm">15% sibling discount</span>
                  </div>
                  <div className="flex items-center gap-2 bg-vibrant-mint rounded-2xl px-4 py-2.5 shadow-sm">
                    <span className="text-xl" aria-hidden="true">📦</span>
                    <span className="font-heading font-bold text-emerald-700 text-sm">Full kit included</span>
                  </div>
                </div>

                <div className="mt-8">
                  <Link href="#available-classes" className="btn-vibrant inline-block text-lg">
                    Let&apos;s Get Messy! 🎨
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="relative py-20" aria-labelledby="how-it-works">
        <div className="section-container relative z-10">
          <div className="text-center mb-14 scroll-reveal">
            <h2 id="how-it-works" className="font-heading font-black text-3xl md:text-4xl text-white">
              How It Works
            </h2>
            <p className="text-white/50 font-body mt-3 text-lg">
              Three simple steps to pottery fun
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="step-card scroll-reveal" style={{ transitionDelay: '0ms' }}>
              <div className="step-icon bg-vibrant-lavender"><span>🎨</span></div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-vibrant-purple text-white text-xs font-heading font-black mb-3">1</div>
              <h3 className="font-heading font-bold text-lg text-brand-text">Pick Your Class</h3>
              <p className="text-gray-500 font-body text-sm mt-2 leading-relaxed">
                Choose a session and check out securely. Use code <strong className="text-vibrant-purple">SIBLING15</strong> for 15% off siblings!
              </p>
            </div>

            <div className="step-card scroll-reveal" style={{ transitionDelay: '150ms' }}>
              <div className="step-icon bg-vibrant-peach"><span>📦</span></div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-vibrant-orange text-white text-xs font-heading font-black mb-3">2</div>
              <h3 className="font-heading font-bold text-lg text-brand-text">Unbox Your Kit</h3>
              <p className="text-gray-500 font-body text-sm mt-2 leading-relaxed">
                Clay, tools, paints — everything arrives at your door before class starts. No supply runs needed.
              </p>
            </div>

            <div className="step-card scroll-reveal" style={{ transitionDelay: '300ms' }}>
              <div className="step-icon bg-vibrant-sky"><span>🤩</span></div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-vibrant-teal text-white text-xs font-heading font-black mb-3">3</div>
              <h3 className="font-heading font-bold text-lg text-brand-text">Create & Get Messy!</h3>
              <p className="text-gray-500 font-body text-sm mt-2 leading-relaxed">
                Join live on Zoom each week. Our instructors guide every project — laughter and clay hands guaranteed!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AVAILABLE CLASSES ═══ */}
      <section className="relative py-20" aria-labelledby="available-classes" id="available-classes">
        <div className="section-container relative z-10">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="font-heading font-black text-3xl md:text-4xl text-white">
              Grab Your Spot!
            </h2>
            <p className="text-white/50 font-body mt-3 text-lg">
              Classes fill up fast — don&apos;t miss out
            </p>
          </div>

          {classes.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {classes.map((cls, i) => (
                <div key={cls.id} className="scroll-reveal-scale" style={{ transitionDelay: `${i * 120}ms` }}>
                  <ClassCard classSession={cls} />
                </div>
              ))}
            </div>
          ) : (
            <div className="card-vibrant p-16 text-center scroll-reveal">
              <div className="text-5xl mb-4 animate-float">🎨</div>
              <p className="font-heading font-bold text-xl text-brand-text">No classes right now — but stay tuned!</p>
              <p className="text-gray-500 font-body mt-2">Follow us on Instagram for new session drops.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ WHAT'S IN THE KIT ═══ */}
      {classes.length > 0 && (
        <section className="relative py-20" aria-labelledby="kit-contents">
          <div className="section-container relative z-10 scroll-reveal">
            <WhatIsIncluded items={classes[0].kitContents} />
          </div>
        </section>
      )}

      {/* ═══ FAQ ═══ */}
      <section className="relative py-20 pb-28" aria-labelledby="faq-heading">
        <div className="section-container relative z-10 scroll-reveal">
          <ClassesFAQ />
        </div>
      </section>
    </div>
  );
}
