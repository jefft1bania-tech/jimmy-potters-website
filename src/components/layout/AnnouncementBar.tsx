import Link from 'next/link';

export default function AnnouncementBar() {
  return (
    <div className="bg-brand-cta text-white text-center py-2 px-4">
      <Link
        href="/classes"
        className="text-sm font-heading font-bold hover:underline"
      >
        🎨 Spring Virtual Classes Now Open — Register Today →
      </Link>
    </div>
  );
}
