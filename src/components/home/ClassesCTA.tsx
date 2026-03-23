import Link from 'next/link';
import Image from 'next/image';

export default function ClassesCTA() {
  return (
    <section className="section-container py-16">
      <div className="card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-[4/3] md:aspect-auto">
            <Image
              src="/images/classes/kids-pottery-hero.jpg"
              alt="Kids pottery class"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Content */}
          <div className="p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-white to-brand-teal/5">
            <span className="badge-teal w-fit mb-4">Ages 7-14</span>
            <h2 className="font-heading font-extrabold text-3xl text-brand-text">
              Virtual Pottery for Kids 🎨
            </h2>
            <p className="mt-4 text-gray-600 font-body leading-relaxed">
              4-week Zoom classes. Clay kit delivered to your door. Watch your
              child create amazing pottery from the comfort of home.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1 text-sm text-brand-orange font-heading font-bold">
                💰 $155 per child
              </span>
              <span className="inline-flex items-center gap-1 text-sm text-brand-teal font-heading font-bold">
                👨‍👩‍👧‍👦 15% sibling discount
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
              <Image
                src="/images/brand/zoom-logo.png"
                alt="Zoom"
                width={24}
                height={24}
                className="opacity-60"
              />
              <span>Live on Zoom</span>
            </div>

            <Link href="/classes" className="btn-primary mt-6 w-fit text-base">
              See Class Schedule →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
