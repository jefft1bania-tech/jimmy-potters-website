import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-bg-footer text-white">
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏺</span>
              <span className="font-heading font-bold text-xl">Jimmy Potters</span>
            </div>
            <p className="text-white/60 text-sm font-body">
              Handmade pottery & virtual pottery classes for kids.
              <br />
              Each piece is one of a kind.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 text-white/80">
              Navigate
            </h3>
            <div className="flex flex-col gap-2">
              <Link href="/shop" className="text-white/60 hover:text-white text-sm transition-colors">
                Shop Pottery
              </Link>
              <Link href="/classes" className="text-white/60 hover:text-white text-sm transition-colors">
                Virtual Classes
              </Link>
              <Link href="/about" className="text-white/60 hover:text-white text-sm transition-colors">
                About Us
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 text-white/80">
              Connect
            </h3>
            <div className="flex flex-col gap-2 text-sm text-white/60">
              <a
                href="https://www.jimmypotters.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                www.jimmypotters.com
              </a>
              <a
                href="https://instagram.com/jimmypotters"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                @jimmypotters
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/40 text-xs">
          &copy; {new Date().getFullYear()} Jimmy Potters. All rights reserved. Handmade in Virginia.
        </div>
      </div>
    </footer>
  );
}
