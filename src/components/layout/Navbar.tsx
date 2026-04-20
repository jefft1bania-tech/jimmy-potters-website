'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { useWholesaleCart } from '@/components/wholesale/WholesaleCartProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';

export default function Navbar() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { itemCount: wholesaleItemCount } = useWholesaleCart();
  const { member, setShowAuthModal } = useAuth();
  const { lang, t, toggleLang } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: t.nav.shop },
    { href: '/kit', label: t.nav.kit },
    { href: '/about', label: t.nav.about },
  ];

  const isShopRoute = pathname.startsWith('/shop') || pathname.startsWith('/cart') || pathname.startsWith('/kit') || pathname.startsWith('/wholesale-cart');
  const isDarkNav = isShopRoute || pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isDarkNav
          ? scrolled
            ? 'bg-[#C96B3A] shadow-lg'
            : 'bg-[#C96B3A]/95 backdrop-blur-sm'
          : scrolled
            ? 'bg-[#F7F3EE]/95 backdrop-blur-md shadow-sm border-b border-stone-200/50'
            : 'bg-[#F7F3EE]/80 backdrop-blur-sm'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo — authentic Jimmy Potters Studio & Works mark + wordmark */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0" aria-label="Jimmy Potters — Home">
            <Image
              src="/images/brand/jimmy-potters-logo.png"
              alt="Jimmy Potters Studio & Works"
              width={690}
              height={720}
              priority
              className="h-12 md:h-14 w-auto drop-shadow-sm"
            />
            <span
              className="text-xl md:text-2xl transition-all duration-300"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#FFFFFF',
                WebkitTextStroke: '1.5px #000000',
                paintOrder: 'stroke fill',
                textShadow: '0 2px 4px #000, 0 0 10px rgba(0,0,0,0.5), 1px 1px 0 #000',
              }}
            >
              JIMMY POTTERS
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5" role="menubar">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : (pathname === link.href || pathname.startsWith(link.href + '/'));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative px-3 py-1.5 rounded-lg font-body text-sm md:text-base font-semibold transition-all duration-200 ${
                    isDarkNav
                      ? isActive
                        ? 'text-black bg-black/10 border border-black/20'
                        : 'text-black hover:text-black hover:bg-black/10'
                      : isActive
                        ? 'text-black bg-stone-200/50 border border-stone-300'
                        : 'text-black hover:text-black hover:bg-stone-100/50'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full ${
                        isDarkNav ? 'bg-[#C9A96E]/60' : 'bg-stone-800/40'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Language toggle + Auth + Cart + Mobile Menu */}
          <div className="flex items-center gap-1">
            {/* Language buttons — English | Español */}
            <div className={`hidden sm:flex items-center rounded-md overflow-hidden border ${
              isDarkNav ? 'border-black/30' : 'border-stone-400'
            }`}>
              <button
                onClick={() => lang !== 'en' && toggleLang()}
                className={`px-2 py-1 font-body font-semibold text-xs transition-all duration-200 ${
                  lang === 'en'
                    ? isDarkNav
                      ? 'bg-black/15 text-black'
                      : 'bg-stone-200 text-black'
                    : isDarkNav
                      ? 'text-black/70 hover:text-black hover:bg-black/10'
                      : 'text-black hover:text-black hover:bg-stone-50'
                }`}
                aria-label="Switch to English"
              >
                English
              </button>
              <div className={`w-px h-3.5 ${isDarkNav ? 'bg-black/20' : 'bg-stone-400'}`} />
              <button
                onClick={() => lang !== 'es' && toggleLang()}
                className={`px-2 py-1 font-body font-semibold text-xs transition-all duration-200 ${
                  lang === 'es'
                    ? isDarkNav
                      ? 'bg-black/15 text-black'
                      : 'bg-stone-200 text-black'
                    : isDarkNav
                      ? 'text-black/70 hover:text-black hover:bg-black/10'
                      : 'text-black hover:text-black hover:bg-stone-50'
                }`}
                aria-label="Cambiar a Español"
              >
                Español
              </button>
            </div>

            {/* Login / Profile */}
            {member ? (
              <Link
                href="/account"
                className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-colors ${isDarkNav ? 'text-black hover:bg-black/10' : 'text-black hover:text-black hover:bg-stone-100/50'}`}
                aria-label={`Account — ${member.name}`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#B8923E] flex items-center justify-center text-[9px] font-heading font-black text-white">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[9px] font-body font-bold leading-none">{member.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-colors ${isDarkNav ? 'text-black hover:bg-black/10' : 'text-black hover:text-black hover:bg-stone-100/50'}`}
                aria-label={t.nav.signIn}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span className="text-[10px] md:text-xs font-body font-bold leading-none">Login</span>
              </button>
            )}

            {/* Cart — shopping cart icon */}
            <Link
              href="/cart"
              className={`relative flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-colors ${isDarkNav ? 'text-black hover:bg-black/10' : 'text-black hover:text-black hover:bg-stone-100/50'}`}
              aria-label={itemCount > 0 ? t.nav.cartItems(itemCount) : t.nav.cartEmpty}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <span className="text-[10px] md:text-xs font-body font-bold leading-none">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#C9A96E] text-[#1a1a1a] text-[9px] font-bold rounded-full flex items-center justify-center leading-none min-w-[16px] min-h-[16px]">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Wholesale cart — separate icon, separate state */}
            <Link
              href="/wholesale-cart"
              className={`relative flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-colors ${isDarkNav ? 'text-black hover:bg-black/10' : 'text-black hover:text-black hover:bg-stone-100/50'}`}
              aria-label={wholesaleItemCount > 0 ? `Wholesale cart, ${wholesaleItemCount} items` : 'Wholesale cart, empty'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <span className="text-[10px] md:text-xs font-body font-bold leading-none">Wholesale</span>
              {wholesaleItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-sky-400 text-[#1a1a1a] text-[9px] font-bold rounded-full flex items-center justify-center leading-none min-w-[16px] min-h-[16px]">
                  {wholesaleItemCount}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              className={`lg:hidden p-2 rounded-lg transition-colors ${isDarkNav ? 'text-black/70 hover:text-black hover:bg-black/5' : 'text-black hover:text-black hover:bg-stone-100/50'}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div id="mobile-menu" className={`lg:hidden pb-4 border-t mt-2 pt-4 ${isDarkNav ? 'border-white/10' : 'border-stone-200/50'}`} role="menu">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : (pathname === link.href || pathname.startsWith(link.href + '/'));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    aria-current={isActive ? 'page' : undefined}
                    className={`font-body font-medium px-3 py-2.5 rounded-lg transition-colors ${
                      isDarkNav
                        ? isActive ? 'text-black bg-black/10' : 'text-black/70 hover:text-black hover:bg-black/5'
                        : isActive ? 'text-black bg-stone-200/50' : 'text-black hover:text-black hover:bg-stone-100/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {/* Mobile auth link */}
              <div className="border-t border-white/10 mt-2 pt-2">
                {member ? (
                  <Link
                    href="/account"
                    role="menuitem"
                    className="flex items-center gap-3 font-body font-medium px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-vibrant-purple to-vibrant-teal flex items-center justify-center text-[9px] font-heading font-black text-white">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    {t.nav.myAccount}
                  </Link>
                ) : (
                  <button
                    onClick={() => { setShowAuthModal(true); setMobileOpen(false); }}
                    role="menuitem"
                    className="w-full flex items-center gap-3 font-body font-medium px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    {t.nav.signIn}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
