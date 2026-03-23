import Link from 'next/link';
import Image from 'next/image';

export default function ClassesCTA() {
  return (
    <section className="section-container py-16" aria-labelledby="classes-cta-heading">
      <div className="card-vibrant overflow-hidden relative">
        {/* Decorative blob */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-vibrant-purple/5 blob-shape pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative h-72 md:h-auto md:min-h-[360px]">
            <Image
              src="/images/classes/kids-pottery-hero.jpg"
              alt="Happy child sculpting clay in pottery class"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Floating badge */}
            <div className="absolute top-4 left-4 animate-float">
              <span className="badge-vibrant-teal shadow-md">Ages 7-14</span>
            </div>
          </div>

          {/* Content — vibrant theme */}
          <div className="relative p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-white via-vibrant-lavender/20 to-vibrant-sky/20">
            <span className="badge-vibrant-purple w-fit mb-4">
              Live on Zoom
            </span>

            <h2
              id="classes-cta-heading"
              className="font-heading font-black text-3xl text-brand-text leading-tight"
            >
              Virtual Pottery
              <br />
              <span className="bg-gradient-to-r from-vibrant-purple to-vibrant-teal bg-clip-text text-transparent">
                for Creative Kids
              </span>
            </h2>

            <p className="mt-4 text-gray-500 font-body leading-relaxed">
              4-week Zoom classes with a clay kit delivered to your door.
              Watch your child create amazing pottery from home.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-vibrant-peach rounded-xl px-3 py-1.5">
                <span className="text-sm" aria-hidden="true">💰</span>
                <span className="font-heading font-bold text-vibrant-orange-dark text-xs">$155/child</span>
              </div>
              <div className="flex items-center gap-2 bg-vibrant-lavender rounded-xl px-3 py-1.5">
                <span className="text-sm" aria-hidden="true">👨‍👩‍👧‍👦</span>
                <span className="font-heading font-bold text-vibrant-purple-dark text-xs">15% sibling discount</span>
              </div>
            </div>

            <Link href="/classes" className="btn-vibrant mt-6 w-fit text-center text-base">
              Let&apos;s Get Messy! 🎨
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
