import Link from 'next/link';
import { PublicClassSession } from '@/types/class-session';
import { formatPrice } from '@/lib/products';
import { getSpotsRemaining, formatClassDates } from '@/lib/classes';
import Badge from '@/components/shared/Badge';

interface ClassCardProps {
  classSession: PublicClassSession;
}

export default function ClassCard({ classSession }: ClassCardProps) {
  const spots = getSpotsRemaining(classSession);
  const isFull = classSession.status === 'full' || spots <= 0;

  return (
    <div className="card p-6 card-hover">
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="teal">{classSession.ageRange}</Badge>
        {!isFull && spots <= 5 && (
          <Badge variant="orange">Only {spots} spots left!</Badge>
        )}
        {isFull && <Badge variant="sold">Class Full</Badge>}
        <Badge variant="purple">15% Sibling Discount!</Badge>
      </div>

      <h3 className="font-heading font-bold text-xl text-brand-text">
        {classSession.name}
      </h3>

      <div className="mt-3 space-y-1 text-sm font-body text-gray-600">
        <p>📅 {classSession.schedule.dayOfWeek}s, {classSession.schedule.time}</p>
        <p>📆 {formatClassDates(classSession.schedule.dates)}</p>
        <p>🔢 {classSession.schedule.sessionCount} sessions</p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-2xl font-heading font-extrabold text-brand-orange">
          {formatPrice(classSession.price)}
        </span>
        <span className="text-sm text-gray-500 font-body">per child</span>
      </div>

      {!isFull && (
        <div className="mt-2">
          <Badge variant="green">{spots} spots open</Badge>
        </div>
      )}

      <div className="mt-6">
        {isFull ? (
          <button className="w-full py-3 px-6 rounded-xl border-2 border-brand-cta text-brand-cta font-heading font-bold transition-all hover:bg-brand-cta/5">
            Join Waitlist
          </button>
        ) : (
          <Link
            href={`/classes/${classSession.slug}`}
            className="block w-full py-3 px-6 rounded-xl bg-brand-cta hover:bg-brand-cta-hover text-white text-center font-heading font-bold transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            Register →
          </Link>
        )}
      </div>
    </div>
  );
}
