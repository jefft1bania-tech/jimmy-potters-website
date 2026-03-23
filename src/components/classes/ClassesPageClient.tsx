'use client';

import { getOpenClasses } from '@/lib/classes';
import ClassCard from '@/components/classes/ClassCard';
import WhatIsIncluded from '@/components/classes/WhatIsIncluded';
import ClassesFAQ from '@/components/classes/ClassesFAQ';
import ClassesHero from '@/components/classes/ClassesHero';
import { useScrollReveal } from '@/lib/useScrollReveal';

export default function ClassesPageClient() {
  const classes = getOpenClasses();
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef} className="classes-bg min-h-screen">
      {/* ═══ FLOATING BLOB DECORATIONS (below hero) ═══ */}
      <div className="blob-solid w-[400px] h-[400px] top-[900px] -left-48 bg-vibrant-teal" style={{ animationDelay: '3s' }} />
      <div className="blob-solid w-[350px] h-[350px] top-[1400px] right-[-100px] bg-vibrant-orange" style={{ animationDelay: '6s' }} />
      <div className="blob-solid w-[300px] h-[300px] top-[2000px] left-[-80px] bg-vibrant-purple" style={{ animationDelay: '9s' }} />
      <div className="blob-solid w-[250px] h-[250px] top-[2600px] right-[-60px] bg-vibrant-teal" style={{ animationDelay: '4s' }} />

      {/* ═══ IMMERSIVE ANIMATED HERO ═══ */}
      <ClassesHero />

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
