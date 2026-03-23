import Link from 'next/link';
import { PublicClassSession } from '@/types/class-session';
import { formatPrice } from '@/lib/products';
import { getSpotsRemaining, formatClassDates } from '@/lib/classes';

interface ClassCardProps {
  classSession: PublicClassSession;
}

export default function ClassCard({ classSession }: ClassCardProps) {
  const spots = getSpotsRemaining(classSession);
  const isFull = classSession.status === 'full' || spots <= 0;
  const isLowSpots = !isFull && spots <= 5;

  return (
    <div className="card-vibrant group">
      {/* Gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-vibrant-purple via-vibrant-pink to-vibrant-teal" />

      <div className="p-7">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="badge-vibrant-teal">{classSession.ageRange}</span>
          {isLowSpots && (
            <span className="badge-vibrant-orange animate-count-pulse">
              Only {spots} spots left!
            </span>
          )}
          {isFull && (
            <span className="badge bg-gray-200 text-gray-500">Class Full</span>
          )}
          <span className="badge-vibrant-purple">15% Sibling Discount</span>
        </div>

        {/* Title */}
        <h3 className="font-heading font-extrabold text-xl text-brand-text group-hover:text-vibrant-purple-dark transition-colors">
          {classSession.name}
        </h3>

        {/* Schedule info */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center gap-3 text-sm font-body text-gray-600">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-vibrant-lavender text-base transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]">📅</span>
            <span>{classSession.schedule.dayOfWeek}s, {classSession.schedule.time}</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-body text-gray-600">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-vibrant-sky text-base transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[3deg]">📆</span>
            <span>{formatClassDates(classSession.schedule.dates)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-body text-gray-600">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-vibrant-mint text-base transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-3deg]">🔢</span>
            <span>{classSession.schedule.sessionCount} weeks of creative fun</span>
          </div>
        </div>

        {/* Price + Spots */}
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-black bg-gradient-to-r from-vibrant-purple to-vibrant-orange bg-clip-text text-transparent">
              {formatPrice(classSession.price)}
            </span>
            <span className="text-sm text-gray-400 font-body">per child</span>
          </div>
          {!isFull && (
            <span className="badge-vibrant-lime text-xs">
              {spots} spots open
            </span>
          )}
        </div>

        {/* CTA — energetic copy */}
        <div className="mt-6">
          {isFull ? (
            <button
              className="w-full py-3.5 px-6 rounded-2xl border-2 border-vibrant-purple text-vibrant-purple font-heading font-extrabold transition-all hover:bg-vibrant-purple/5 focus:outline-none focus:ring-2 focus:ring-vibrant-purple/30"
              aria-label={`Join waitlist for ${classSession.name}`}
            >
              Save My Spot!
            </button>
          ) : (
            <Link
              href={`/classes/${classSession.slug}`}
              className="btn-vibrant block w-full text-center"
              aria-label={`Register for ${classSession.name} — ${formatPrice(classSession.price)}`}
            >
              Let&apos;s Get Messy! 🎨
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
