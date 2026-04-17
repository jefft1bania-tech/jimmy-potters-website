export interface ProductSpecs {
  height?: string;
  width?: string;
  depth?: string;
  mouth?: string;
  ringDiameter?: string;
  weight?: string;
  note?: string; // e.g. "Estimated — final specs from maker"
}

export interface ProductSource {
  platform: string;
  brandId?: string;
  productId?: string;
  originalUrl?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  productNumber: number;
  price: number; // cents
  description: string;
  specs: ProductSpecs;
  details: string[];
  images: string[];
  category: string;
  tags: string[];
  status: 'available' | 'sold' | 'reserved' | 'pending-review';
  stripePriceId: string;
  shippingWeight: string;
  quantity: number;
  quickSpec?: string;
  bestUse?: string;
  source?: ProductSource;
}
