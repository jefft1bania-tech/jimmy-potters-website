/**
 * Chatbot Knowledge Builder
 * Dynamically generates the system prompt from live product data.
 * This ensures the chatbot always has accurate, up-to-date information.
 */

import productsData from '../../data/products.json';

interface Product {
  name: string;
  price: number;
  description: string;
  details: string[];
  category: string;
  tags: string[];
  status: string;
  specs: Record<string, string>;
  slug: string;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function buildProductKnowledge(): string {
  const products = productsData as unknown as Product[];
  const available = products.filter((p) => p.status === 'available');

  const lines = available.map((p) => {
    const specs = Object.entries(p.specs)
      .filter(([k]) => k !== 'note')
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    return `- ${p.name} (${formatPrice(p.price)}) — ${p.category}. ${specs}. ${p.details.slice(0, 3).join('. ')}. Tags: ${p.tags.join(', ')}.`;
  });

  return `PRODUCT CATALOG (${available.length} pieces available):\n${lines.join('\n')}

PRODUCT CATEGORIES:
- Hanging Planters on Ring Frames: $75 each. 6" bowl, 12" metal ring, brass hook. Teal, mint-blue gradient, dark teal, deep teal, dark green, teal flower edition.
- Vases: $65 each. Orange drip-glaze (8" tall) and celadon crawl-glaze (7" tall). Watertight for fresh flowers.
- Table Planters with Saucer: $55 each. Navy faceted, orange footed, teal mountain, navy round, navy square. All include matching saucer.
- Orchid Pots: Amber orchid pot $45 (with saucer), Herringbone set of 2 $75 (with saucers).

ALL POTTERY DETAILS:
- Every piece is wheel-thrown stoneware, kiln-fired to cone 6 (2,200°F)
- Lead-free, food-safe glazes
- Drainage holes included on all planters
- Every piece is ONE OF A KIND — handmade, unique glaze patterns

SHIPPING — VIA FEDEX:
- All pottery ships via FedEx from Fort Lauderdale, Florida
- Double-boxed with cushion wrap for safe delivery. Tracking and insurance included.
- Currently serving East Coast states (NY to FL). More states coming soon.
- THREE SHIPPING TIERS:
  1. FedEx Ground (3-5 business days): $9.99-$16.99 depending on state
  2. FedEx 2Day (2 business days): $18.99-$29.99 depending on state
  3. FedEx Priority Overnight (next business day by 10:30 AM): $34.99-$54.99 depending on state
- RATES BY ZONE:
  VA, DC, MD, DE: Ground $9.99 | 2Day $18.99 | Overnight $34.99
  PA, NJ, WV: Ground $11.99 | 2Day $21.99 | Overnight $39.99
  NY, CT, NC: Ground $13.99 | 2Day $24.99 | Overnight $44.99
  MA, RI, NH, SC, GA: Ground $14.99 | 2Day $27.99 | Overnight $49.99
  FL: Ground $16.99 | 2Day $29.99 | Overnight $54.99
- States NOT yet covered: Everything west of the East Coast. Coming soon.`;
}

export function buildFullKnowledge(): string {
  return buildProductKnowledge();
}

export function getProductByQuestion(question: string): string | null {
  const lower = question.toLowerCase();
  const products = productsData as unknown as Product[];

  for (const p of products) {
    const nameWords = p.name.toLowerCase().split(/\s+/);
    const tagMatch = p.tags.some((t) => lower.includes(t));
    const nameMatch = nameWords.some((w) => w.length > 3 && lower.includes(w));
    if (tagMatch || nameMatch) {
      return `${p.name}: ${formatPrice(p.price)}. ${p.description.slice(0, 200)}... Details: ${p.details.join('. ')}. Specs: ${JSON.stringify(p.specs)}`;
    }
  }
  return null;
}
