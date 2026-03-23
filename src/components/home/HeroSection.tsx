import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <Image
          src="/images/classes/kids-pottery-hero.jpg"
          alt="Kids enjoying pottery class"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-bg-primary/90 via-brand-bg-primary/70 to-brand-bg-secondary/50" />
      </div>

      {/* Content */}
      <div className="relative section-container py-20">
        <div className="max-w-2xl">
          <h1 className="font-heading font-extrabold text-4xl md:text-6xl text-white leading-tight">
            Handmade Pottery.
            <br />
            <span className="text-brand-yellow">Creative Kids.</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-white/80 font-body max-w-lg">
            One-of-a-kind pottery for your home + virtual pottery classes for
            ages 7-14. Clay kit delivered to your door.
          </p>

          {/* Price callout */}
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-heading font-bold">
              💰 $155 per child
            </span>
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-heading font-bold">
              📦 Clay kit delivered to your 🏠
            </span>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/shop" className="btn-primary text-base">
              Shop Pottery
            </Link>
            <Link href="/classes" className="btn-outline text-base">
              Join a Class 🎨
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
