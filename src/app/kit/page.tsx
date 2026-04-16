import KitPageClient from './KitPageClient';

export const metadata = {
  title: 'Home Pottery Kit | Jimmy Potters',
  description: 'Everything you need to create pottery at home — the Date Night Edition kit includes paint, clay shapes, tools, and a video tutorial. $100 with free shipping.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Home Pottery Kit — Date Night Edition',
  description:
    'A complete pottery experience for two. Open the box, follow our step-by-step video tutorial, and create beautiful handmade pieces together. No experience needed. Includes 2KG air-dry clay, paint set (8 tubes), carving tools, paintbrushes, waterproof varnish, pre-formed clay shapes, branded gift box, and access to video tutorials.',
  image: [
    'https://website-gamma-hazel-53.vercel.app/kit-1.jpeg',
    'https://website-gamma-hazel-53.vercel.app/kit-2.jpeg',
    'https://website-gamma-hazel-53.vercel.app/kit-3.jpeg',
    'https://website-gamma-hazel-53.vercel.app/kit-4.jpeg',
    'https://website-gamma-hazel-53.vercel.app/kit-5.jpeg',
    'https://website-gamma-hazel-53.vercel.app/kit-6.jpeg',
    'https://website-gamma-hazel-53.vercel.app/kit-7.jpeg',
  ],
  brand: {
    '@type': 'Brand',
    name: 'Jimmy Potters',
  },
  offers: {
    '@type': 'Offer',
    price: '100.00',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: '0',
        currency: 'USD',
      },
    },
  },
};

export default function KitPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <KitPageClient />
    </>
  );
}
