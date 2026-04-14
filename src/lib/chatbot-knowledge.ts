/**
 * Chatbot Knowledge Builder
 * Dynamically generates the system prompt from live product data.
 * This ensures the chatbot always has accurate, up-to-date information.
 */

import productsData from '../../data/products.json';
import kitFaqData from '../../data/kit-faq.json';

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

interface KitFaq {
  id: number;
  question_en: string;
  answer_en: string;
  category: string;
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

function buildKitKnowledge(): string {
  // Build FAQ section from live data
  const faqs = (kitFaqData as unknown as KitFaq[])
    .map((f) => `Q: ${f.question_en}\nA: ${f.answer_en}`)
    .join('\n\n');

  return `HOME POTTERY KIT — DATE NIGHT EDITION:
- Price: $100.00 (free shipping included)
- Perfect for: Date nights, family time, creative gifts, kids activities (ages 6+), team building
- No experience needed — guided video tutorials included
- WHAT'S INSIDE THE KIT:
  1. 3 custom Jimmy Potters paint tubes (branded colors)
  2. Pre-formed clay shapes (rainbow arch, wavy tray, hearts, geometric tiles & more)
  3. Professional sculpting tools
  4. Textured stamp mat for unique designs
  5. Branded box packaging (gift-ready — no wrapping needed)
  6. Access to exclusive step-by-step video tutorials
- HOW IT WORKS:
  Step 1: Order your kit — ships with free FedEx (3-5 business days)
  Step 2: Watch the guided video tutorial (on any device — phone, tablet, laptop, TV)
  Step 3: Create your masterpiece at home (about 1.5-2 hours to complete)
- AIR-DRY CLAY — No kiln needed! Shape it, let it dry 24-48 hours, paint it, display it
- Date Night Edition includes enough clay and materials for TWO people
- If clay breaks during drying: repair with water + gentle pressure. Fully dry pieces are durable for display.
- Seasonal editions coming: Summer, Holiday, and more — sign up for newsletter to be notified
- Available on the Kit page: www.jimmypotters.com/kit

KIT FAQ (Common Customer Questions):
${faqs}`;
}

function buildBusinessKnowledge(): string {
  return `AFTER-SCHOOL POTTERY PROGRAMS (Northern Virginia / DC Metro):
- Mobile afterschool pottery enrichment workshops for K-5th grade
- Programs run 6-8 weeks per session
- Price: $235-$250 per child (all materials included: clay, tools, paints, brushes, apron)
- CURRENT SCHOOL LOCATIONS:
  * Greenbriar East ES — Monday & Friday
  * Maury ES — Monday
  * SWS (School Without Walls) — Tuesday
  * Seaton ES — Wednesday (grades 1-5) & Thursday (kindergarten only)
  * Inspired Teaching ITDS — Friday
  * Poplar Tree ES — SOLD OUT
- 15% sibling discount on virtual classes (code: SIBLING15)
- 10% off for newsletter subscribers — banner at top of every page

VIRTUAL CLAY CAMP (Online Zoom Classes):
- Price: $155 for 4-week course
- Schedule: Wednesdays 3:45-4:45 PM ET
- Ages: 7-14
- A complete clay kit ships to the student's door before the first class
- Live instruction via Zoom with a professional pottery instructor
- 15% sibling discount with code SIBLING15

SUMMER CAMP (Mobile):
- Mobile summer camp brings the pottery studio directly to schools and community centers
- Hands-on clay activities: mushroom fairy houses, animal figures, decorative keepsake boxes
- Contact for details: jimmy@jimmypotters.com

BUSINESS CONTACT INFORMATION:
- Website: www.jimmypotters.com
- Email: jimmy@jimmypotters.com
- Phone: (703) 862-1300
- Instagram: @jimmypottersvirtualclayclass
- Facebook: Jpsfairfax
- Locations: Fort Lauderdale, FL (studio/pottery) & Washington DC metro area (classes)
- Motto: "Creating Little Artists, one clay day at a time"

GALLERY:
- Full photo gallery at www.jimmypotters.com/gallery
- Every product photo shows the actual handmade piece — what you see is what you get
- Multiple angles and lifestyle shots for most products

NEWSLETTER & PROMOTIONS:
- 10% off first pottery purchase or class registration when you sign up for the newsletter
- Newsletter signup banner at the top of every page
- SIBLING15 promo code: 15% sibling discount on virtual classes

CUSTOM & SPECIAL ORDERS:
- Custom/commission pottery available — contact jimmy@jimmypotters.com or call (703) 862-1300

SAFETY & QUALITY:
- All pottery uses lead-free, food-safe glazes
- Kiln-fired to cone 6 (2,200°F) for lasting durability
- Safe for plants, food display, and normal household use
- Every planter has a drainage hole for healthy root systems
- Hanging planters include removable silicone plug
- Table planters come with matching saucers

REFUNDS & CANCELLATIONS:
- Contact jimmy@jimmypotters.com or (703) 862-1300

MISSED CLASS POLICY:
- If a child misses a class, contact us for catch-up instructions

GIFTING:
- Pottery ships beautifully packaged and gift-ready
- Kit comes in branded box — no wrapping needed
- Free shipping on all orders
- Great for birthdays, anniversaries, Valentine's Day, holidays, housewarming`;
}

export function buildFullKnowledge(): string {
  return buildProductKnowledge() + '\n\n' + buildKitKnowledge() + '\n\n' + buildBusinessKnowledge();
}

export function getProductByQuestion(question: string): string | null {
  const lower = question.toLowerCase();
  const products = productsData as unknown as Product[];

  // Check kit-related questions first
  if (lower.match(/kit|date night|home pottery|clay kit/)) {
    return `Home Pottery Kit — Date Night Edition: $100.00. A complete pottery experience for two — includes 3 custom paint tubes, pre-formed clay shapes (rainbow, tray, hearts, tiles), sculpting tools, textured stamp mat, branded box, and exclusive video tutorial access. Air-dry clay — no kiln needed. Perfect for couples, families, and kids ages 6+. Free shipping. Available at www.jimmypotters.com/kit`;
  }

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
