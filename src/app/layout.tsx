import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/cart/CartProvider';
import Navbar from '@/components/layout/Navbar';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Footer from '@/components/layout/Footer';
import NewsletterBanner from '@/components/layout/NewsletterBanner';
import ChatWidget from '@/components/chat/ChatWidget';
import { AuthProvider } from '@/components/auth/AuthProvider';
import AuthModal from '@/components/auth/AuthModal';
import { LanguageProvider } from '@/components/LanguageProvider';

export const metadata: Metadata = {
  title: 'Jimmy Potters | Handmade Pottery',
  description:
    'One-of-a-kind handmade pottery from Fort Lauderdale, Florida. Shop planters, vases, and more — each piece wheel-thrown, glazed, and kiln-fired by hand.',
  openGraph: {
    title: 'Jimmy Potters | Handmade Pottery',
    description:
      'One-of-a-kind handmade pottery from Fort Lauderdale, Florida. Planters, vases, and more.',
    url: 'https://www.jimmypotters.com',
    siteName: 'Jimmy Potters',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <a href="#main-content" className="skip-link">Skip to main content</a>
              <AnnouncementBar />
              <Navbar />
              <main id="main-content" className="flex-1 pt-16" role="main">{children}</main>
              <NewsletterBanner />
              <Footer />
              <ChatWidget />
              <AuthModal />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
