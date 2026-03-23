import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden" aria-label="Homepage hero">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/classes/kids-pottery-hero.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-bg-primary/95 via-brand-bg-primary/80 to-brand-bg-secondary/40" />
      </div>

      {/* Content */}
      <div className="relative section-container py-20">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-heading font-bold bg-white/10 text-white/80 backdrop-blur-sm mb-6">
            Handmade in Virginia
          </span>

          <h1 className="font-heading font-black text-5xl md:text-7xl text-white leading-[1.05] tracking-tight">
            One-of-a-Kind
            <br />
            <span className="bg-gradient-to-r from-brand-yellow via-brand-orange to-brand-teal bg-clip-text text-transparent">
              Pottery
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-white/60 font-body max-w-lg leading-relaxed">
            Handmade drip-glaze planters and vases for your home — plus virtual
            pottery classes for kids ages 7–14.
          </p>

          {/* Dual CTAs — Shop vs Classes */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/shop"
              className="btn-faire !bg-white !text-brand-text hover:!bg-gray-50 text-center"
            >
              Shop Pottery
            </Link>
            <Link
              href="/classes"
              className="btn-vibrant text-center !py-3.5"
            >
              Kids Classes — $155
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex items-center gap-6 text-white/40 text-sm font-body">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
              Spots open for Spring 2026
            </span>
            <span className="hidden sm:inline">
              Clay kit included
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
