import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/cart/CartProvider';
import Navbar from '@/components/layout/Navbar';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Footer from '@/components/layout/Footer';
import ChatWidget from '@/components/chat/ChatWidget';

export const metadata: Metadata = {
  title: 'Jimmy Potters | Handmade Pottery & Virtual Kids Classes',
  description:
    'One-of-a-kind handmade pottery and virtual pottery classes for kids ages 7-14. Clay kit delivered to your door. Shop planters, vases, and more.',
  openGraph: {
    title: 'Jimmy Potters | Handmade Pottery & Virtual Kids Classes',
    description:
      'One-of-a-kind handmade pottery and virtual pottery classes for kids ages 7-14.',
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
        <CartProvider>
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <AnnouncementBar />
          <Navbar />
          <main id="main-content" className="flex-1 pt-16" role="main">{children}</main>
          <Footer />
          <ChatWidget />
        </CartProvider>
      </body>
    </html>
  );
}
