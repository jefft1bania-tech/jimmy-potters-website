import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jimmy Potters | Handmade Pottery',
    short_name: 'Jimmy Potters',
    description: 'One-of-a-kind handmade pottery from Fort Lauderdale, Florida.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0C0A09',
    theme_color: '#92653A',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
