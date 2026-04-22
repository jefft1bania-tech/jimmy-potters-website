import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/cart/CartProvider';
import { WholesaleCartProvider } from '@/components/wholesale/WholesaleCartProvider';
import Navbar from '@/components/layout/Navbar';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Footer from '@/components/layout/Footer';
import NewsletterBanner from '@/components/layout/NewsletterBanner';
import ChatWidget from '@/components/chat/ChatWidget';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { LanguageProvider } from '@/components/LanguageProvider';
import Analytics from '@/components/analytics/Analytics';
import TestRunBanner from '@/components/site/TestRunBanner';

export const metadata: Metadata = {
  title: {
    default: 'Jimmy Potters | Handmade Pottery from Fort Lauderdale',
    template: '%s | Jimmy Potters',
  },
  description:
    'One-of-a-kind handmade pottery from Fort Lauderdale, Florida. Shop planters, vases, and more — each piece wheel-thrown, glazed, and kiln-fired by hand.',
  keywords: ['handmade pottery', 'Fort Lauderdale', 'planters', 'vases', 'pottery classes', 'kiln-fired', 'wheel-thrown', 'Jimmy Potters'],
  authors: [{ name: 'Jimmy Potters' }],
  creator: 'Jimmy Potters',
  metadataBase: new URL('https://website-gamma-hazel-53.vercel.app'),
  openGraph: {
    title: 'Jimmy Potters | Handmade Pottery',
    description:
      'One-of-a-kind handmade pottery from Fort Lauderdale, Florida. Planters, vases, and more.',
    url: 'https://website-gamma-hazel-53.vercel.app',
    siteName: 'Jimmy Potters',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jimmy Potters | Handmade Pottery',
    description: 'One-of-a-kind handmade pottery from Fort Lauderdale, Florida.',
  },
  robots: {
    index: true,
    follow: true,
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
              <WholesaleCartProvider>
                <a href="#main-content" className="skip-link">Skip to main content</a>
                <TestRunBanner />
                <AnnouncementBar />
                <Navbar />
                <main id="main-content" className="flex-1 pt-16" role="main">{children}</main>
                <NewsletterBanner />
                <Footer />
                <ChatWidget />
                <WhatsAppButton />
                <Analytics />
              </WholesaleCartProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
