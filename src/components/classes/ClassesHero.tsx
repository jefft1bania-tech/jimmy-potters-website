'use client';

import Link from 'next/link';

/**
 * Fully animated, CSS-driven hero for the Classes portal.
 * No static photo dependency — uses floating emoji art, animated shapes,
 * gradient overlays, and kinetic typography for an immersive kid experience.
 */
export default function ClassesHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden" aria-label="Classes hero">
      {/* ═══ ANIMATED BACKGROUND LAYERS ═══ */}

      {/* Base gradient — deep purple to warm indigo */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2d1b69] via-[#241452] to-[#1a0e3a]" />

      {/* Animated mesh gradient overlay */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute inset-[-50%] animate-[gradient-drift_25s_ease-in-out_infinite_alternate]"
          style={{
            background: `
              radial-gradient(ellipse 500px 500px at 30% 30%, rgba(168, 85, 247, 0.3) 0%, transparent 70%),
              radial-gradient(ellipse 400px 400px at 70% 70%, rgba(56, 189, 248, 0.25) 0%, transparent 70%),
              radial-gradient(ellipse 350px 350px at 50% 20%, rgba(236, 72, 153, 0.15) 0%, transparent 70%),
              radial-gradient(ellipse 300px 300px at 80% 30%, rgba(249, 115, 22, 0.2) 0%, transparent 70%)
            `,
          }}
        />
      </div>

      {/* ═══ FLOATING POTTERY ELEMENTS ═══ */}

      {/* Large floating emoji art pieces — scattered across hero */}
      <div className="absolute top-[8%] left-[5%] text-6xl md:text-7xl animate-float opacity-20 select-none pointer-events-none" aria-hidden="true">🏺</div>
      <div className="absolute top-[15%] right-[8%] text-5xl md:text-6xl animate-float-slow opacity-15 select-none pointer-events-none" aria-hidden="true" style={{ animationDelay: '1s' }}>🎨</div>
      <div className="absolute bottom-[20%] left-[8%] text-5xl md:text-6xl animate-float opacity-15 select-none pointer-events-none" aria-hidden="true" style={{ animationDelay: '2s' }}>🖌️</div>
      <div className="absolute bottom-[30%] right-[12%] text-4xl md:text-5xl animate-float-slow opacity-20 select-none pointer-events-none" aria-hidden="true" style={{ animationDelay: '3s' }}>✨</div>
      <div className="absolute top-[40%] left-[15%] text-4xl animate-float opacity-10 select-none pointer-events-none" aria-hidden="true" style={{ animationDelay: '4s' }}>🌈</div>
      <div className="absolute top-[60%] right-[5%] text-5xl animate-float opacity-15 select-none pointer-events-none" aria-hidden="true" style={{ animationDelay: '2.5s' }}>🏺</div>
      <div className="absolute bottom-[10%] left-[40%] text-4xl animate-float-slow opacity-10 select-none pointer-events-none" aria-hidden="true" style={{ animationDelay: '5s' }}>🎭</div>

      {/* Animated blob shapes — organic, overlapping */}
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] md:w-[500px] md:h-[500px] blob-shape opacity-[0.08]"
        style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }} />
      <div className="absolute bottom-[-10%] left-[-8%] w-[350px] h-[350px] md:w-[450px] md:h-[450px] blob-shape opacity-[0.06]"
        style={{ background: 'linear-gradient(135deg, #38bdf8, #14b8a6)', animationDelay: '4s' }} />
      <div className="absolute top-[30%] right-[20%] w-[200px] h-[200px] blob-shape opacity-[0.05]"
        style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', animationDelay: '2s' }} />

      {/* Paint splatter dots — CSS circles scattered playfully */}
      <div className="absolute top-[12%] left-[25%] w-3 h-3 rounded-full bg-vibrant-purple/30 animate-pop-in" style={{ animationDelay: '0.5s' }} aria-hidden="true" />
      <div className="absolute top-[25%] right-[20%] w-4 h-4 rounded-full bg-vibrant-teal/25 animate-pop-in" style={{ animationDelay: '0.8s' }} aria-hidden="true" />
      <div className="absolute bottom-[35%] left-[18%] w-2.5 h-2.5 rounded-full bg-vibrant-orange/30 animate-pop-in" style={{ animationDelay: '1.1s' }} aria-hidden="true" />
      <div className="absolute top-[50%] right-[30%] w-3.5 h-3.5 rounded-full bg-vibrant-pink/25 animate-pop-in" style={{ animationDelay: '1.4s' }} aria-hidden="true" />
      <div className="absolute bottom-[15%] right-[15%] w-2 h-2 rounded-full bg-vibrant-lime/30 animate-pop-in" style={{ animationDelay: '1.7s' }} aria-hidden="true" />
      <div className="absolute top-[70%] left-[30%] w-3 h-3 rounded-full bg-vibrant-purple/20 animate-pop-in" style={{ animationDelay: '2s' }} aria-hidden="true" />

      {/* Connecting lines — subtle dashed paths */}
      <div className="absolute top-[20%] left-[10%] w-[200px] h-[1px] rotate-[30deg] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" aria-hidden="true" />
      <div className="absolute bottom-[25%] right-[15%] w-[150px] h-[1px] rotate-[-20deg] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" aria-hidden="true" />

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="relative z-10 section-container py-16 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow badges */}
          <div className="flex items-center justify-center gap-3 mb-8 animate-pop-in flex-wrap">
            <span className="badge-vibrant-teal text-base px-5 py-2 shadow-lg shadow-vibrant-teal/20">
              Live on Zoom
            </span>
            <span className="badge-vibrant-orange text-base px-5 py-2 shadow-lg shadow-vibrant-orange/20">
              Ages 7–14
            </span>
          </div>

          {/* Main headline — kinetic gradient text */}
          <h1 className="font-heading font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
            <span className="text-white block mb-2">Get Creative.</span>
            <span className="block bg-gradient-to-r from-vibrant-purple via-vibrant-pink to-vibrant-teal bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
              Get Messy!
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-6 md:mt-8 text-lg md:text-xl text-white/60 font-body leading-relaxed max-w-xl mx-auto">
            Virtual pottery classes where kids sculpt, paint, and create
            incredible art — with a <strong className="text-white/80">complete clay kit</strong> delivered
            to your door.
          </p>

          {/* Value props — floating pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/[0.06] shadow-lg">
              <span className="text-xl" aria-hidden="true">💰</span>
              <span className="font-heading font-bold text-white text-sm">$155 per child</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/[0.06] shadow-lg">
              <span className="text-xl" aria-hidden="true">👨‍👩‍👧‍👦</span>
              <span className="font-heading font-bold text-white text-sm">15% sibling discount</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/[0.06] shadow-lg">
              <span className="text-xl" aria-hidden="true">📦</span>
              <span className="font-heading font-bold text-white text-sm">Full kit included</span>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href="#available-classes"
              className="btn-vibrant inline-block text-xl px-14 py-5 animate-pulse-glow"
            >
              Let&apos;s Get Messy! 🎨
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex items-center justify-center gap-2 text-white/30 text-sm font-body">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
            <span>Spots open for Spring 2026 — classes fill fast!</span>
          </div>
        </div>
      </div>

      {/* Bottom fade into page bg */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1a0e3a] to-transparent pointer-events-none" />
    </section>
  );
}
