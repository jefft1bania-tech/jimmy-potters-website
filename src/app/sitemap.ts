import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://website-three-omega-62.vercel.app';
  const lastModified = new Date();

  return [
    { url: baseUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/shop`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/shop/gallery`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/kit`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/cart`, lastModified, changeFrequency: 'always', priority: 0.5 },
    { url: `${baseUrl}/checkout`, lastModified, changeFrequency: 'always', priority: 0.5 },
    { url: `${baseUrl}/account`, lastModified, changeFrequency: 'monthly', priority: 0.4 },
    // Legal / policy pages — required for compliance + search-engine discoverability
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/returns`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/shipping`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
  ];
}
