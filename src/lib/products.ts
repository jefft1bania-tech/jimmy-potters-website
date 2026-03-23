import productsData from '../../data/products.json';
import { Product } from '@/types/product';

const products: Product[] = productsData as Product[];

export function getAllProducts(): Product[] {
  return products;
}

export function getAvailableProducts(): Product[] {
  return products.filter((p) => p.status === 'available');
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getFeaturedProducts(count: number = 4): Product[] {
  return products.filter((p) => p.status === 'available').slice(0, count);
}

export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}
