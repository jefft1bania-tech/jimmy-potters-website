import { getAllProducts } from '@/lib/products';
import ShopPageClient from '@/components/shop/ShopPageClient';

export const metadata = {
  title: 'Shop Handmade Pottery | Jimmy Potters',
  description:
    'Browse one-of-a-kind handmade pottery. Hanging planters, drip-glaze vases, and footed planters. Each piece is unique — when it\'s gone, it\'s gone.',
};

export default function ShopPage() {
  const products = getAllProducts().filter((p) => p.status !== 'pending-review');

  return <ShopPageClient products={products} />;
}
