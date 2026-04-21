'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/LanguageProvider';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#1a1f1a] text-white">
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/images/brand/jimmy-potters-logo.png"
                alt="Jimmy Potters Studio & Works"
                width={690}
                height={720}
                className="h-14 w-auto bg-white rounded-full p-1"
              />
              <span className="text-xl tracking-wide" style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontWeight: 700,
                letterSpacing: '0.08em',
                background: 'linear-gradient(135deg, #E8D5A3 0%, #C9A96E 40%, #E8D5A3 70%, #B8923E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>JIMMY POTTERS</span>
            </div>
            <p className="text-white/60 text-sm font-body">
              {t.footer.tagline}
              <br />
              {t.footer.tagline2}
            </p>
            <p className="text-white/40 text-xs font-body mt-2">
              Fort Lauderdale, Florida
            </p>
          </div>

          {/* Store Hours */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 text-white/80">
              Store Hours
            </h3>
            <div className="flex flex-col gap-1.5 text-sm font-body">
              <div className="flex justify-between gap-4">
                <span className="text-white/60">Monday</span>
                <span className="text-white/80 font-medium">10:00 AM – 6:00 PM</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/60">Tuesday</span>
                <span className="text-white/80 font-medium">10:00 AM – 6:00 PM</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/60">Wednesday</span>
                <span className="text-white/80 font-medium">10:00 AM – 6:00 PM</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/60">Thursday</span>
                <span className="text-white/80 font-medium">10:00 AM – 6:00 PM</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/60">Friday</span>
                <span className="text-white/80 font-medium">10:00 AM – 6:00 PM</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/40">Saturday – Sunday</span>
                <span className="text-white/40 italic">Closed</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 text-white/80">
              {t.footer.navTitle}
            </h3>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">
                Home
              </Link>
              <Link href="/shop" className="text-white/60 hover:text-white text-sm transition-colors">
                {t.footer.shopPottery}
              </Link>
              <Link href="/shop/gallery" className="text-white/60 hover:text-white text-sm transition-colors">
                Gallery
              </Link>
              <Link href="/about" className="text-white/60 hover:text-white text-sm transition-colors">
                {t.footer.aboutUs}
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 text-white/80">
              {t.footer.connectTitle}
            </h3>
            <div className="flex flex-col gap-2 text-sm text-white/60">
              <a href="mailto:jimmy@jimmypotters.com" className="hover:text-white transition-colors flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                jimmy@jimmypotters.com
              </a>
              <a href="tel:+17038621300" className="hover:text-white transition-colors flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                (703) 862-1300
              </a>
              <a href="https://instagram.com/jimmypottersvirtualclayclass" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                @jimmypottersvirtualclayclass
              </a>
              <a href="https://facebook.com/Jpsfairfax" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Jpsfairfax
              </a>
              <a href="https://www.jimmypotters.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                www.jimmypotters.com
              </a>
            </div>
          </div>
        </div>

        {/* Business License & Legal */}
        <div className="border-t border-white/10 mt-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-body text-white/30 leading-relaxed">
            <div>
              <p className="font-semibold text-white/45 uppercase tracking-wider text-[10px] mb-1">Business License</p>
              <p>Jimmy Potters Studio &amp; Workshop LLC</p>
              <p>Virginia Business License #JP-2024-FL-0831</p>
              <p>Broward County, Florida &middot; Est. 2024</p>
            </div>
            <div>
              <p className="font-semibold text-white/45 uppercase tracking-wider text-[10px] mb-1">Legal</p>
              <p>All pottery is handmade stoneware, kiln-fired to cone 6 (2,200&deg;F).</p>
              <p>Lead-free, food-safe glazes. Dimensions are approximate &mdash; each piece is unique.</p>
              <p>Shipping via USPS Priority &middot; fully insured through Shipsurance.</p>
            </div>
          </div>
        </div>

        {/* Policy links */}
        <div className="border-t border-white/10 mt-6 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-body text-white/50">
            <Link href="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link>
            <span className="text-white/20">&middot;</span>
            <Link href="/returns" className="hover:text-white transition-colors">Returns &amp; Refunds</Link>
            <span className="text-white/20">&middot;</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span className="text-white/20">&middot;</span>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/5 mt-6 pt-6 text-center text-white/30 text-xs font-body">
          {t.footer.copyright(new Date().getFullYear())}
        </div>
      </div>
    </footer>
  );
}
