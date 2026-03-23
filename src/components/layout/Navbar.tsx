'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { useAuth } from '@/components/auth/AuthProvider';

const navLinks = [
  { href: '/shop', label: 'Shop' },
  { href: '/classes', label: 'Classes' },
  { href: '/about', label: 'About' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { member, setShowAuthModal } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isClassesRoute = pathname.startsWith('/classes');

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
        scrolled
          ? 'bg-brand-bg-primary/95 backdrop-blur-md shadow-lg'
          : 'bg-brand-bg-primary/70 backdrop-blur-sm'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Jimmy Potters — Home">
            <span className="text-2xl" aria-hidden="true">🏺</span>
            <span className="font-heading font-bold text-lg text-white group-hover:text-white/80 transition-colors">
              Jimmy Potters
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1" role="menubar">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative px-4 py-2 rounded-lg font-body text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                  {/* Active indicator — vibrant for Classes, subtle for Shop */}
                  {isActive && (
                    <span
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full ${
                        isClassesRoute
                          ? 'bg-gradient-to-r from-vibrant-purple to-vibrant-teal'
                          : 'bg-white/40'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Auth + Cart + Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Member icon / Login button */}
            {member ? (
              <Link
                href="/account"
                className="relative text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                aria-label={`Account — ${member.name}`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-vibrant-purple to-vibrant-teal flex items-center justify-center text-[10px] font-heading font-black text-white">
                  {member.name.charAt(0).toUpperCase()}
                </div>
              </Link>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                aria-label="Sign in or create account"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </button>
            )}

            <Link
              href="/cart"
              className="relative text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
              aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} items` : ', empty'}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-orange text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center leading-none min-w-[18px] min-h-[18px]">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
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
          <div id="mobile-menu" className="md:hidden pb-4 border-t border-white/10 mt-2 pt-4" role="menu">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    aria-current={isActive ? 'page' : undefined}
                    className={`font-body font-medium px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'text-white bg-white/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
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
                    My Account
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
                    Sign In / Sign Up
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
