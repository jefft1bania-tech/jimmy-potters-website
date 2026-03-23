export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number; // cents
  description: string;
  details: string[];
  images: string[];
  category: string;
  tags: string[];
  status: 'available' | 'sold' | 'reserved';
  stripePriceId: string;
  shippingWeight: string;
  quantity: number;
}
