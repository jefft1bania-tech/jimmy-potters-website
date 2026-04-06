'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

export default function AnnouncementBar() {
  const { t } = useLanguage();

  return (
    <div className="bg-[#C96B3A] text-white text-center py-1.5 px-4">
      <Link
        href="/shop"
        className="font-body text-[11px] font-medium tracking-wide text-white/90 hover:text-white transition-colors"
      >
        {t.announcement}
      </Link>
    </div>
  );
}
