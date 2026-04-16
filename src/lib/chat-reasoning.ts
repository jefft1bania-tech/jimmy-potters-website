/**
 * Chat Reasoning Engine
 * Chain-of-thought local reasoning system that uses the full knowledge base
 * to intelligently answer any buyer question without external API calls.
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
  question_en: string;
  answer_en: string;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

// ═══════════════════════════════════════════════════════════
// KNOWLEDGE BASE — all business information in structured form
// ═══════════════════════════════════════════════════════════

const BUSINESS = {
  name: 'Jimmy Potters Studio & Workshop',
  tagline: 'Creating Little Artists, one clay day at a time',
  email: 'jimmy@jimmypotters.com',
  phone: '(703) 862-1300',
  instagram: '@jimmypottersvirtualclayclass',
  facebook: 'Jpsfairfax',
  website: 'www.jimmypotters.com',
  locations: {
    studio: 'Fort Lauderdale, Florida',
    classes: 'Washington DC / Northern Virginia metro area',
  },
};

const KIT = {
  name: 'Home Pottery Kit — Date Night Edition',
  price: '$100',
  shipping: 'Free shipping via FedEx (3-5 business days)',
  duration: '1.5 to 2 hours to complete',
  audience: 'Couples, families, kids ages 6+, team building, gifts',
  clay: '2KG of branded air-dry clay (enough to make 3-4 small pieces or 1-2 larger ones). No kiln needed — dries at room temperature in 24-48 hours.',
  clayTip: 'Keep any leftover clay wrapped up airtight so it stays fresh for your next project.',
  contents: [
    '2KG of Jimmy Potters branded air-dry clay (makes 3-4 small pieces or 1-2 larger ones)',
    'Paint set of your choice — choose from pastel, floral, earth, or classic (8 tubes)',
    'Pottery carving, shaping, and cutting tools in a branded Jimmy Potters canvas drawstring bag',
    '2 ultra fine bristle paintbrushes — #10 Contoured Brush + #6 Detail Brush',
    'Waterproof varnish (70ml/2.4oz) — glossy or matte finish to seal your piece',
    'Pre-formed clay shapes (rainbow arch, wavy tray, hearts, geometric tiles) for Date Night Edition',
    'Branded gift-ready box — no wrapping needed',
    'Access to exclusive step-by-step video tutorials',
  ],
  paintTip: 'Build up your colours in layers for depth. Make sure each layer is fully dry before adding more.',
  brushTip: 'Use the bigger brush to layer on colour and the smaller one for patterns and finer touches. Also great for smoothing joins — dip in water and blend.',
  varnishTip: 'Gloss gives a shiny feel, matte offers a subtle natural finish. Rinse brush with warm water after use.',
  toolsTip: 'Perfect for adding texture and unique details — don\'t be afraid to experiment!',
  paintOptions: 'Pastel tones, floral tones, earth tones, or classic tones — pick the palette that matches your vibe.',
  video: 'Prerecorded tutorial hosted online — watch on phone, tablet, laptop, or TV. Pause and rewind as needed.',
  repair: 'If clay breaks during drying, repair with water + gentle pressure. Fully dried and painted pieces are durable for display.',
  seasonal: 'More editions coming: Summer, Holiday, and more. Sign up for newsletter to be notified.',
  url: 'www.jimmypotters.com/kit',
};

const PROGRAMS = {
  afterSchool: {
    description: 'Mobile afterschool pottery enrichment workshops',
    grades: 'K-5th grade',
    duration: '6-8 weeks per session',
    price: '$235-$250 per child',
    materials: 'All materials included (clay, tools, paints, brushes, apron)',
    schools: [
      { name: 'Greenbriar East ES', days: 'Monday & Friday' },
      { name: 'Maury ES', days: 'Monday' },
      { name: 'SWS (School Without Walls)', days: 'Tuesday' },
      { name: 'Seaton ES', days: 'Wednesday (grades 1-5) & Thursday (kindergarten)' },
      { name: 'Inspired Teaching ITDS', days: 'Friday' },
      { name: 'Poplar Tree ES', days: 'SOLD OUT' },
    ],
  },
  virtualCamp: {
    description: 'Virtual Clay Camp via Zoom',
    price: '$155 for 4-week course',
    schedule: 'Wednesdays 3:45-4:45 PM ET',
    ages: '7-14',
    includes: 'Complete clay kit shipped to door before first class',
    sibling: '15% sibling discount with code SIBLING15',
  },
  summerCamp: {
    description: 'Mobile summer camp at schools and community centers',
    activities: 'Mushroom fairy houses, animal figures, decorative keepsake boxes',
  },
};

const SHIPPING = {
  carrier: 'FedEx',
  origin: 'Fort Lauderdale, Florida',
  packaging: 'Double-boxed with cushion wrap. Tracking and insurance included.',
  kitShipping: 'Free on all kit and pottery orders',
  tiers: [
    { name: 'FedEx Ground', time: '3-5 business days', range: '$9.99-$16.99' },
    { name: 'FedEx 2Day', time: '2 business days', range: '$18.99-$29.99' },
    { name: 'FedEx Priority Overnight', time: 'Next business day by 10:30 AM', range: '$34.99-$54.99' },
  ],
  zones: {
    'VA, DC, MD, DE': { ground: '$9.99', twoDay: '$18.99', overnight: '$34.99' },
    'PA, NJ, WV': { ground: '$11.99', twoDay: '$21.99', overnight: '$39.99' },
    'NY, CT, NC': { ground: '$13.99', twoDay: '$24.99', overnight: '$44.99' },
    'MA, RI, NH, SC, GA': { ground: '$14.99', twoDay: '$27.99', overnight: '$49.99' },
    'FL': { ground: '$16.99', twoDay: '$29.99', overnight: '$54.99' },
    'CA, WA, OR': { ground: '$19.99', twoDay: '$34.99', overnight: '$59.99' },
    'TX, IL, OH, MI': { ground: '$17.99', twoDay: '$31.99', overnight: '$54.99' },
    'AZ, NV, CO, UT': { ground: '$18.99', twoDay: '$32.99', overnight: '$57.99' },
  },
  coverage: 'Ships to all 50 US states! International shipping not yet available.',
  salesTax: 'Jimmy Potters currently does NOT charge sales tax on online orders. Prices shown are the full amount you pay (plus shipping if not free).',
};

const PROMOTIONS = {
  newsletter: '10% off first purchase or class registration',
  sibling: '15% sibling discount on virtual classes (code: SIBLING15)',
};

const SAFETY = {
  glazes: 'Lead-free, food-safe glazes',
  firing: 'Kiln-fired to cone 6 (2,200°F) for lasting durability',
  use: 'Safe for plants, food display, and normal household use',
  drainage: 'Every planter has a drainage hole. Hanging planters include removable silicone plug. Table planters come with matching saucers.',
  microwave: 'Our kiln-fired pottery is microwave safe for reheating. Avoid rapid temperature changes (e.g. freezer to microwave).',
  dishwasher: 'Hand washing is recommended to preserve glaze color and finish. Dishwasher safe but hand wash extends the life of the glaze.',
  outdoor: 'Our kiln-fired stoneware is durable for outdoor use. In freezing climates, bring pots inside during winter to prevent freeze-thaw cracking.',
  cleaning: 'Wipe with a damp cloth or hand wash with mild soap. For stubborn stains on unglazed surfaces, a baking soda paste works well.',
  allergy: 'All materials are non-toxic. Our glazes are lead-free and cadmium-free. Kit clay is non-toxic air-dry clay safe for ages 6+.',
};

const HANDMADE = {
  uniqueness: 'Every piece is one-of-a-kind. Slight variations in size, color, glaze pattern, and shape are intentional features of handmade pottery — not defects. No two pieces are ever exactly alike.',
  process: 'Each piece is wheel-thrown by hand on a potter\'s wheel, dried slowly, bisque-fired, hand-glazed, and kiln-fired to cone 6 (2,200°F). The whole process takes 2-3 weeks per piece.',
  artist: 'Jimmy Potters is a Fort Lauderdale-based pottery studio. Every piece is handcrafted with care and attention to detail.',
  photoAccuracy: 'Product photos show the actual piece you\'ll receive (each is unique). Colors may vary slightly due to screen settings, but what you see is very close to the real piece.',
  leadTime: 'Most in-stock pieces ship within 1-2 business days. Custom or made-to-order pieces take 3-4 weeks.',
};

const ORDERS = {
  tracking: 'Once your order ships, you\'ll receive a FedEx tracking number via email. You can track your package at fedex.com or in your Jimmy Potters account. Orders typically ship within 1-2 business days.',
  cancel: 'To cancel or modify an order, contact us ASAP at jimmy@jimmypotters.com or (703) 862-1300. If the order hasn\'t shipped yet, we can make changes. Once shipped, we cannot cancel but you can return it.',
  giftWrap: 'All pottery ships beautifully double-boxed with cushion wrap. The Home Pottery Kit comes in a branded gift-ready box — no wrapping needed! For a personal touch, include a gift note at checkout.',
  giftCard: 'We don\'t currently offer digital gift cards, but you can purchase a Home Pottery Kit as a gift — it arrives in a beautiful branded box ready to give. Or email us for a custom gift arrangement!',
  bulk: 'Interested in bulk or wholesale orders? Perfect for corporate gifts, event favors, or retail. Contact us at jimmy@jimmypotters.com with quantities and we\'ll put together a custom quote.',
  international: 'We currently ship to all 50 US states only. International shipping is not yet available, but we\'re working on it! Sign up for our newsletter to be notified when we expand.',
  reviews: 'Check out our Instagram @jimmypottersvirtualclayclass for customer photos and reviews! We also have feedback buttons in our chat for rating responses.',
  sustainability: 'We\'re committed to sustainable practices. Our clay is natural and locally sourced. We use lead-free glazes, minimal packaging waste (recyclable boxes and paper cushioning), and kiln-fire in batches for energy efficiency.',
};

// ═══════════════════════════════════════════════════════════
// REASONING ENGINE — chain-of-thought question analysis
// ═══════════════════════════════════════════════════════════

interface ReasoningResult {
  intent: string;
  topics: string[];
  response: string;
}

function identifyTopics(question: string): string[] {
  const q = question.toLowerCase();
  const topics: string[] = [];

  // Kit / Home Pottery Kit
  if (q.match(/kit|date night|home potter|clay kit|pottery kit/)) topics.push('kit');
  // Quantity / how many
  if (q.match(/how many|how much.*make|how much.*create|quantity|number of|pieces.*make|pots.*get|items.*make/)) topics.push('quantity');
  // Pricing
  if (q.match(/price|cost|how much|expensive|cheap|afford|worth|value|\$/)) topics.push('pricing');
  // Shipping & delivery
  if (q.match(/ship|deliver|fedex|arrive|receive|how long.*get|when.*get|when.*arrive|tracking|package/)) topics.push('shipping');
  // Classes & programs
  if (q.match(/class|program|after.?school|school|enroll|register|sign.?up.*class|session/)) topics.push('classes');
  // Virtual / online
  if (q.match(/virtual|zoom|online|remote|video.*class/)) topics.push('virtual');
  // Summer camp
  if (q.match(/summer|camp/)) topics.push('summer');
  // Products / pottery
  if (q.match(/planter|vase|pot|orchid|ceramic|pottery|bowl|piece|product|collection|shop/)) topics.push('products');
  // Kit contents
  if (q.match(/what.*in|include|come.*with|inside|contain|get.*with/)) topics.push('contents');
  // Age / kids
  if (q.match(/age|old|young|kid|child|son|daughter|grade|kindergarten|elementary/)) topics.push('age');
  // Couples / date
  if (q.match(/couple|romantic|date|anniversary|valentine|two people|partner|spouse|husband|wife|girlfriend|boyfriend/)) topics.push('couples');
  // Experience level
  if (q.match(/experience|beginner|never|first.?time|easy|hard|difficult|skill/)) topics.push('experience');
  // Time / duration
  if (q.match(/how long|time|hour|minute|duration|take.*complete|finish/)) topics.push('duration');
  // Video / tutorial
  if (q.match(/video|tutorial|watch|lesson|instruction|learn|teach/)) topics.push('video');
  // Kiln / drying
  if (q.match(/kiln|oven|fire|bake|dry|air.?dry|cure|harden/)) topics.push('kiln');
  // Safety / materials
  if (q.match(/safe|food|lead|toxic|microwave|dishwasher|quality|material/)) topics.push('safety');
  // Drainage / plants
  if (q.match(/drain|hole|water|plant|succulent|flower/)) topics.push('drainage');
  // Contact
  if (q.match(/contact|email|phone|reach|talk|call|message/)) topics.push('contact');
  // Location
  if (q.match(/location|studio|store|visit|address|find you/) || (q.match(/where/) && !q.match(/where.*order|where.*package|where.*ship/))) topics.push('location');
  // Social
  if (q.match(/instagram|facebook|social|follow|insta|ig/)) topics.push('social');
  // Discounts
  if (q.match(/discount|promo|coupon|code|save|deal|offer|percent.*off/) || (q.match(/sale/) && !q.match(/sales.?tax/))) topics.push('discounts');
  // Newsletter
  if (q.match(/newsletter|email.*list|subscribe|sign.*up/)) topics.push('newsletter');
  // Gift
  if (q.match(/gift|present|wrap|birthday|christmas|holiday|giving/)) topics.push('gift');
  // Custom
  if (q.match(/custom|commission|special.*order|personalize|unique|one.*kind/)) topics.push('custom');
  // Refund
  if (q.match(/refund|return|cancel|money.*back/)) topics.push('refund');
  // Missed class
  if (q.match(/miss|absent|can.?t make|sick|make.*up/)) topics.push('missed');
  // Gallery
  if (q.match(/gallery|photo|picture|image|see|look/)) topics.push('gallery');
  // Greeting
  if (q.match(/^(hello|hi|hey|good morning|good afternoon|good evening|yo|sup|hola)/)) topics.push('greeting');
  // Thanks
  if (q.match(/thank|thanks|awesome|great|perfect|amazing|wonderful|cool/)) topics.push('thanks');
  // Broken / repair
  if (q.match(/break|broke|fragile|repair|crack|damage/)) topics.push('repair');
  // Seasonal editions
  if (q.match(/other.*edition|new.*edition|seasonal|different.*kit|more.*kit|next.*kit/)) topics.push('seasonal');
  // Payment / checkout
  if (q.match(/pay|payment|credit card|debit|stripe|checkout|purchase|buy|order|cart/)) topics.push('payment');
  // Sales tax
  if (q.match(/tax|sales.?tax|charge.*tax|extra.*fee|additional.*cost|total.*cost/)) topics.push('tax');
  // Return policy
  if (q.match(/return|exchange|swap|wrong|broken.*ship|damaged.*ship/)) topics.push('returns');
  // Party / group / event
  if (q.match(/party|parties|group|event|team.?build|corporate|birthday.*party|birthday.*event/)) topics.push('party');
  // Size / dimensions
  if (q.match(/size|dimension|big|small|tall|wide|diameter|weight|heavy|inch|cm/)) topics.push('size');
  // Color / glaze options
  if (q.match(/color|colour|glaze|teal|navy|amber|green|blue|orange|finish|pattern/)) topics.push('color');
  // Allergy / sensitivity
  if (q.match(/allerg|sensitive|skin|rash|clay.*safe|non.?toxic|chemical/)) topics.push('allergy');
  // Outdoor use
  if (q.match(/outdoor|outside|patio|garden|weather|rain|frost|freeze|sun/)) topics.push('outdoor');
  // Indoor use
  if (q.match(/indoor|inside|windowsill|shelf|table|desk/)) topics.push('indoor');
  // Care / maintenance
  if (q.match(/care|clean|wash|maintain|wipe|dust|stain/)) topics.push('care');
  // Handmade / unique
  if (q.match(/handmade|hand.?made|unique|one.?of.?a.?kind|artisan|craft|artist|who.*make|who.*made/)) topics.push('handmade');
  // Comparison / competitor
  if (q.match(/compar|vs|versus|better|differ|similar|like|other.*potter|other.*brand/)) topics.push('comparison');
  // Bulk / wholesale
  if (q.match(/bulk|wholesale|large.*order|multiple|quantity|many|several|dozen/)) topics.push('bulk');
  // Teacher / educator
  if (q.match(/teacher|educator|instruct|curriculum|lesson.*plan|homeschool|home.?school/)) topics.push('educator');
  // Availability / stock
  if (q.match(/available|in.?stock|sold.?out|left|remain|when.*back|restock|more.*coming/)) topics.push('availability');
  // International
  if (q.match(/international|outside.*us|abroad|canada|uk|europe|mexico|overseas|world/)) topics.push('international');
  // Subscription / recurring
  if (q.match(/subscri|monthly|recurring|auto|membership|club|box.*month/)) topics.push('subscription');
  // Review / testimonial
  if (q.match(/review|testimonial|rating|star|feedback|recommend|what.*people.*say/)) topics.push('reviews');
  // Private class / booking
  if (q.match(/private.*class|book|reserve|schedule|appointment|one.?on.?one|1.?on.?1/)) topics.push('private');
  // Insurance / tracking
  if (q.match(/insur|track|lost.*package|missing.*order|where.*order|order.*status/)) topics.push('tracking');
  // Eco / sustainability
  if (q.match(/eco|sustain|environment|green|recycle|bio|earth|organic/)) topics.push('eco');
  // How made / process
  if (q.match(/how.*make|how.*made|process|create|wheel|throw|glaz|technique|method/)) topics.push('process');
  // Gift card / voucher
  if (q.match(/gift.?card|voucher|certificate|gift.*code|e.?gift/)) topics.push('giftcard');
  // Special needs / accessibility
  if (q.match(/special.*need|disab|wheelchair|access|adaptive|accommodation/)) topics.push('accessibility');
  // What to expect
  if (q.match(/what.*expect|first.*time|new.*to|never.*done|prepare|bring|wear/)) topics.push('whattoexpect');
  // Fun / creative
  if (q.match(/fun|creative|enjoy|love|boring|interesting|unique.*activity|thing.*to.*do/)) topics.push('fun');
  // Mess / cleanup
  if (q.match(/mess|messy|dirty|clean.*up|stain|clothes|apron/)) topics.push('mess');
  // Display / decor
  if (q.match(/display|decor|decorat|shelf|mantle|home.*decor|style|aesthetic/)) topics.push('display');
  // Pet safe
  if (q.match(/pet|dog|cat|animal|bird.*safe/)) topics.push('petsafe');
  // Wedding / registry
  if (q.match(/wedding|registry|bridal|engaged|engagement/)) topics.push('wedding');
  // Corporate / team building
  if (q.match(/corporate|team|company|office|work.*event|employee/)) topics.push('corporate');

  return topics;
}

function findMatchingFaq(question: string): string | null {
  const q = question.toLowerCase();
  const faqs = kitFaqData as unknown as KitFaq[];

  // Score each FAQ by keyword overlap
  let bestMatch: { faq: KitFaq; score: number } | null = null;
  for (const faq of faqs) {
    const faqWords = faq.question_en.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const qWords = q.split(/\s+/).filter(w => w.length > 3);
    const overlap = qWords.filter(w => faqWords.some(fw => fw.includes(w) || w.includes(fw))).length;
    if (overlap > 0 && (!bestMatch || overlap > bestMatch.score)) {
      bestMatch = { faq, score: overlap };
    }
  }

  return bestMatch && bestMatch.score >= 2 ? bestMatch.faq.answer_en : null;
}

function findMatchingProduct(question: string): Product | null {
  const q = question.toLowerCase();
  const products = (productsData as unknown as Product[]).filter(p => p.status === 'available');

  for (const p of products) {
    const nameWords = p.name.toLowerCase().split(/\s+/);
    const tagMatch = p.tags.some(t => q.includes(t));
    const nameMatch = nameWords.some(w => w.length > 3 && q.includes(w));
    if (tagMatch || nameMatch) return p;
  }
  return null;
}

function findStateShipping(question: string): string | null {
  const q = question.toLowerCase();
  // Only match full state names (not 2-letter abbreviations which cause false positives)
  const stateMap: Record<string, string> = {
    'virginia': 'VA, DC, MD, DE', 'delaware': 'VA, DC, MD, DE', 'maryland': 'VA, DC, MD, DE',
    'washington dc': 'VA, DC, MD, DE', 'washington d.c.': 'VA, DC, MD, DE',
    'pennsylvania': 'PA, NJ, WV', 'new jersey': 'PA, NJ, WV', 'west virginia': 'PA, NJ, WV',
    'new york': 'NY, CT, NC', 'connecticut': 'NY, CT, NC', 'north carolina': 'NY, CT, NC',
    'massachusetts': 'MA, RI, NH, SC, GA', 'rhode island': 'MA, RI, NH, SC, GA',
    'new hampshire': 'MA, RI, NH, SC, GA', 'south carolina': 'MA, RI, NH, SC, GA',
    'georgia': 'MA, RI, NH, SC, GA',
    'florida': 'FL',
    'california': 'CA, WA, OR', 'washington': 'CA, WA, OR', 'oregon': 'CA, WA, OR',
    'texas': 'TX, IL, OH, MI', 'illinois': 'TX, IL, OH, MI', 'ohio': 'TX, IL, OH, MI', 'michigan': 'TX, IL, OH, MI',
    'arizona': 'AZ, NV, CO, UT', 'nevada': 'AZ, NV, CO, UT', 'colorado': 'AZ, NV, CO, UT', 'utah': 'AZ, NV, CO, UT',
  };

  for (const [state, zone] of Object.entries(stateMap)) {
    if (q.includes(state)) {
      const rates = SHIPPING.zones[zone as keyof typeof SHIPPING.zones];
      return `Shipping to ${zone}:\n- FedEx Ground (3-5 days): ${rates.ground}\n- FedEx 2Day: ${rates.twoDay}\n- FedEx Priority Overnight: ${rates.overnight}\n\nAll orders include tracking, insurance, and double-box cushion wrapping. The Home Pottery Kit ships FREE! We currently do NOT charge sales tax on online orders.`;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════
// MAIN REASONING FUNCTION
// ═══════════════════════════════════════════════════════════

export function reasonAboutQuestion(question: string): string {
  const topics = identifyTopics(question);
  const q = question.toLowerCase();

  // ── Step 1: Check for direct FAQ match ──
  const faqMatch = findMatchingFaq(question);

  // ── Step 2: Check for specific product ──
  const productMatch = findMatchingProduct(question);

  // ── Step 3: Check for state-specific shipping ──
  const stateShipping = findStateShipping(question);

  // ── Step 4: Chain-of-thought reasoning based on identified topics ──

  // GREETING
  if (topics.includes('greeting') && topics.length <= 1) {
    return `Hi there! Welcome to Jimmy Potters! 🏺 I can help you with our handmade pottery collection ($45-$75), Home Pottery Kit ($100), after-school programs, virtual clay camp, pricing, shipping, and more. What would you like to know?`;
  }

  // THANKS
  if (topics.includes('thanks')) {
    return `You're welcome! Happy to help. If you have any other questions, I'm here! Don't forget to check out our newsletter at the top of the page for 10% off your first order. 🏺`;
  }

  // KIT + PRICING (most common question)
  if (topics.includes('kit') && topics.includes('pricing')) {
    return `The Home Pottery Kit is $100 with free shipping! 🏺 It includes 2KG of air-dry clay, a paint set (choose your palette), sculpting tools, brushes, waterproof varnish, and a step-by-step video tutorial. Perfect for two people — takes about 1.5-2 hours. Order at ${KIT.url}`;
  }

  // KIT + CONTENTS
  if (topics.includes('kit') && topics.includes('contents')) {
    return `The Home Pottery Kit ($100) includes:\n\n1. 2KG air-dry clay\n2. Paint set (pastel, floral, earth, or classic tones)\n3. Sculpting tools in canvas bag\n4. 2 fine paintbrushes\n5. Waterproof varnish (glossy or matte)\n6. Pre-formed clay shapes\n7. Gift-ready branded box\n8. Video tutorial access\n\nNo kiln needed — air dries in 24-48 hours! 🏺`;
  }

  // KIT + SHIPPING
  if (topics.includes('kit') && topics.includes('shipping')) {
    return `Great news — the Home Pottery Kit ships FREE via FedEx! Standard delivery is 3-5 business days from our Fort Lauderdale studio. ${SHIPPING.packaging} Your kit arrives in a beautiful branded box, ready to open and create. Order at ${KIT.url} 📦`;
  }

  // KIT + DURATION
  if (topics.includes('kit') && topics.includes('duration')) {
    return `The Home Pottery Kit takes about ${KIT.duration} — the perfect length for a date night or a relaxing afternoon. The video tutorial goes at your pace, so you can pause and rewind as much as you need. ${KIT.clay} 🏺`;
  }

  // KIT + EXPERIENCE
  if (topics.includes('kit') && topics.includes('experience')) {
    if (faqMatch) return faqMatch;
    return `No experience needed at all! The Home Pottery Kit is designed for complete beginners. The pre-formed clay shapes mean you don't need a pottery wheel, and the step-by-step video tutorial walks you through every step. Whether you've never touched clay before or you're a seasoned crafter, you'll create something beautiful. 🎨`;
  }

  // KIT + COUPLES
  if (topics.includes('kit') && topics.includes('couples')) {
    return `The Date Night Edition is specially designed for couples! It includes enough clay and materials for TWO people to create together, plus romantic-themed shapes like hearts and arches. It's a unique alternative to dinner and a movie — you'll both go home with handmade keepsakes. ${KIT.price} with free shipping. Order at ${KIT.url} 💑`;
  }

  // KIT + AGE / KIDS
  if (topics.includes('kit') && topics.includes('age')) {
    return `The Home Pottery Kit is great for kids ages 6 and up! The pre-formed shapes and simple tools make it easy for little hands. While the Date Night Edition is designed for couples, families love it too. We also offer after-school pottery programs for K-5th grade at local schools ($235-$250). 🎨`;
  }

  // KIT + GIFT
  if (topics.includes('kit') && topics.includes('gift')) {
    return `The Home Pottery Kit makes an incredible gift! 🎁 The branded box is beautifully designed and ready to gift — no wrapping needed. It's perfect for birthdays, anniversaries, Valentine's Day, holidays, or just because. ${KIT.price} with free shipping. It's a gift that creates a memory, not just a moment. Order at ${KIT.url}`;
  }

  // KIT + COLOR (paint options)
  if (topics.includes('kit') && topics.includes('color')) {
    return `The kit comes with a paint set of your choice! 🎨 Pick from:\n\n- Pastel Tones\n- Floral Tones\n- Earth Tones\n- Classic Tones\n\nEach set includes 8 paint tubes. ${KIT.paintTip}\n\nPlus you get waterproof varnish (glossy or matte) to seal your finished piece. ${KIT.varnishTip} 🏺`;
  }

  // KIT + KILN
  if (topics.includes('kit') && topics.includes('kiln')) {
    return `No kiln needed! The Home Pottery Kit uses air-dry clay that hardens naturally at room temperature. Just shape it, let it dry for 24-48 hours, then paint with the included paint tubes. Our handmade shop pottery IS kiln-fired to 2,200°F for permanent durability, but the kit is designed to work without any special equipment. 🏺`;
  }

  // KIT + VIDEO
  if (topics.includes('kit') && topics.includes('video')) {
    return `After purchasing the kit, you'll receive a link to our exclusive prerecorded video tutorial. Watch it on any device — phone, tablet, laptop, or TV. It walks you through every step from unwrapping your kit to painting your finished piece. Go at your own pace — pause and rewind as much as you need! 🎥`;
  }

  // KIT + REPAIR
  if (topics.includes('kit') && topics.includes('repair')) {
    return KIT.repair + ' Our video tutorial includes handling and drying tips for the best results. 🏺';
  }

  // KIT + SEASONAL
  if (topics.includes('kit') && topics.includes('seasonal')) {
    return `Yes! We're planning seasonal editions throughout the year — Summer, Holiday, and more. Each edition features unique shapes, colors, and themes. The current Date Night Edition (${KIT.price}) is our first — sign up for our newsletter to be the first to know when new editions drop! 🏺`;
  }

  // KIT (general)
  if (topics.includes('kit')) {
    return `The Home Pottery Kit is $100 with free shipping! 🏺 Includes clay, paints (choose your palette), tools, brushes, varnish, and a video tutorial. Designed for two people, takes 1.5-2 hours. No kiln needed — air-dry clay. Order at ${KIT.url}`;
  }

  // SHIPPING (with state match)
  if (topics.includes('shipping') && stateShipping) {
    return stateShipping + ' 📦';
  }

  // SHIPPING (general)
  if (topics.includes('shipping')) {
    return `Free shipping on all orders! 📦 Ships via FedEx from Fort Lauderdale, FL.\n\n- Ground: 3-5 days ($9.99-$16.99 for pottery)\n- 2Day: $18.99-$29.99\n- Overnight: $34.99-$54.99\n\nThe Home Pottery Kit ships FREE. Double-boxed with tracking and insurance.`;
  }

  // SAFETY + AGE (kids safety question — before general age handler)
  if (topics.includes('safety') && topics.includes('age')) {
    return `Absolutely safe for kids! 🎨\n\n📦 Home Pottery Kit: Uses non-toxic air-dry clay and non-toxic paints. Safe for ages 6+. No chemicals, no kiln, no heat.\n🏫 After-School Programs: All materials are non-toxic and kid-safe. We provide aprons.\n🏺 Shop Pottery: Lead-free, food-safe glazes. Safe around children.\n\nIf your child has specific sensitivities, we recommend testing a small piece of clay on their hand first. Contact ${BUSINESS.email} for ingredient questions.`;
  }

  // ALLERGY + AGE
  if (topics.includes('allergy') && topics.includes('age')) {
    return `All our materials are non-toxic and safe for children! The Home Pottery Kit uses standard air-dry clay and non-toxic paints, safe for ages 6+. For specific allergy concerns, contact ${BUSINESS.email} and we can provide detailed ingredient information. 🎨`;
  }

  // QUANTITY — how many pieces can I make
  if (topics.includes('quantity')) {
    return `With the Home Pottery Kit's 2KG of air-dry clay, you can make 3-4 small pieces or 1-2 larger ones. 🏺 The Date Night Edition also includes pre-formed shapes (rainbow arch, wavy tray, hearts, geometric tiles) so you have plenty to work with! Plus sculpting tools for custom creations. ${KIT.clayTip}\n\nIf you want more pieces, the kit includes enough for TWO people. Order at ${KIT.url} ($100, free shipping)`;
  }

  // PROCESS / HOW MADE (before product match to avoid "pot" in "pottery" false positive)
  if (topics.includes('process')) {
    return `Here's how our pottery is made! 🏺\n\n1. Raw clay is prepared and wedged to remove air bubbles\n2. Shaped on the pottery wheel by hand (wheel-thrown)\n3. Dried slowly to prevent cracking\n4. First firing (bisque) at high temperature\n5. Hand-glazed with our original glaze formulas\n6. Second firing to cone 6 (2,200°F) — this fuses the glaze permanently\n7. Quality checked and photographed\n\nThe entire process takes about 2-3 weeks per piece. Each glaze reacts uniquely to the heat, creating unrepeatable patterns.`;
  }

  // MESS / CLEANUP (before age to handle "messy for kids" correctly)
  if (topics.includes('mess')) {
    return `Let's talk mess! 🎨\n\n📦 Home Pottery Kit: Manageable mess — work on a table covered with newspaper or a plastic sheet. The included stamp mat provides a clean work surface. Clay washes off hands and surfaces with water. Paints are water-based and wash out of most clothes.\n\n🏫 After-School Programs: We provide aprons and handle all cleanup! Kids should wear clothes they don't mind getting a little clay on, just in case.\n\nTip: Wet wipes are your best friend for quick cleanup!`;
  }

  // WHAT TO EXPECT (before age/experience)
  if (topics.includes('whattoexpect')) {
    return `Here's what to expect! 🎨\n\n📦 Home Pottery Kit: Unbox, watch the video tutorial, shape and paint your pieces (1.5-2 hrs). Let air-dry 24-48 hrs. No special equipment or experience needed!\n\n🏫 After-School Program: Your child attends 1-hour sessions at school for 6-8 weeks. All materials provided — they just need to show up! Projects build in complexity over the session.\n\n💻 Virtual Clay Camp: Kit arrives before class. Join on Zoom, follow along with the instructor. Live Q&A and guidance throughout!`;
  }

  // ECO / SUSTAINABILITY (before product match — "eco-friendly pottery" must not match a product)
  if (topics.includes('eco')) {
    return ORDERS.sustainability;
  }

  // PET SAFE (before general safety — "safe for pets" must not match general safety)
  if (topics.includes('petsafe')) {
    return `Yes! Our pottery is completely pet-safe. All glazes are non-toxic, lead-free, and food-safe. Our planters are perfect for pet-friendly homes. Just make sure the plant itself is pet-safe! 🐾`;
  }

  // BULK / WHOLESALE (before drainage — "do you do wholesale" must not match drainage)
  if (topics.includes('bulk')) {
    return ORDERS.bulk;
  }

  // SPECIFIC PRODUCT (only if the match is strong — skip if general topics cover it)
  // Only show a specific product if the question is clearly about THAT product (not a general question that happens to contain a product word)
  if (productMatch && topics.includes('products') && topics.length <= 3 && !topics.includes('process') && !topics.includes('mess') && !topics.includes('whattoexpect') && !topics.includes('classes') && !topics.includes('tax') && !topics.includes('eco') && !topics.includes('bulk')) {
    const p = productMatch;
    const specs = Object.entries(p.specs).filter(([k]) => k !== 'note').map(([k, v]) => `${k}: ${v}`).join(', ');
    return `${p.name} — ${formatPrice(p.price)} 🏺\n\n${p.description.slice(0, 300)}\n\nSpecs: ${specs}\n\n${p.details.slice(0, 4).join('. ')}.\n\nEvery piece is one of a kind — handmade, wheel-thrown stoneware with lead-free glazes. Free shipping! Browse all pottery at www.jimmypotters.com/shop`;
  }

  // CLASSES + PRICING (before general pricing — "how much are pottery classes" must show class price)
  if (topics.includes('classes') && topics.includes('pricing')) {
    let response = `Here's our class pricing! 🏫\n\n🏫 After-School Programs: ${PROGRAMS.afterSchool.price} per child (${PROGRAMS.afterSchool.duration}, ${PROGRAMS.afterSchool.grades})\n💻 Virtual Clay Camp: ${PROGRAMS.virtualCamp.price} (${PROGRAMS.virtualCamp.ages}, 4-week course)\n\nSchools we serve:\n`;
    response += PROGRAMS.afterSchool.schools.map(s => `- ${s.name}: ${s.days}`).join('\n');
    response += `\n\n${PROGRAMS.afterSchool.materials}. ${PROGRAMS.virtualCamp.sibling}`;
    return response;
  }

  // PRICING (general)
  if (topics.includes('pricing')) {
    const products = (productsData as unknown as Product[]).filter(p => p.status === 'available');
    const priceRange = products.length > 0
      ? `$${Math.min(...products.map(p => p.price / 100))}-$${Math.max(...products.map(p => p.price / 100))}`
      : '$45-$75';
    return `Here's our pricing:\n\n🏺 Handmade Pottery: ${priceRange} (hanging planters $75, vases $65, table planters $45-$55)\n📦 Home Pottery Kit: ${KIT.price} (Date Night Edition, free shipping)\n🏫 After-School Programs: ${PROGRAMS.afterSchool.price}\n💻 Virtual Clay Camp: ${PROGRAMS.virtualCamp.price}\n\n10% off for newsletter subscribers! Sign up at the top of any page.`;
  }

  // CLASSES
  if (topics.includes('classes')) {
    let response = `We offer pottery enrichment at ${PROGRAMS.afterSchool.schools.length} schools! 🏫\n\n`;
    response += PROGRAMS.afterSchool.schools.map(s => `- ${s.name}: ${s.days}`).join('\n');
    response += `\n\nPrograms run ${PROGRAMS.afterSchool.duration}, ${PROGRAMS.afterSchool.price} per child. ${PROGRAMS.afterSchool.materials}.`;
    if (topics.includes('age')) {
      response += ` Available for ${PROGRAMS.afterSchool.grades}.`;
    }
    return response;
  }

  // VIRTUAL
  if (topics.includes('virtual')) {
    return `Our Virtual Clay Camp is ${PROGRAMS.virtualCamp.price}! 💻\n\nSchedule: ${PROGRAMS.virtualCamp.schedule}\nAges: ${PROGRAMS.virtualCamp.ages}\n${PROGRAMS.virtualCamp.includes}\n${PROGRAMS.virtualCamp.sibling}\n\nLive instruction via Zoom with a professional pottery instructor. Sign up at ${BUSINESS.website}!`;
  }

  // SUMMER CAMP
  if (topics.includes('summer')) {
    return `Our mobile summer camp brings the pottery studio directly to schools and community centers! 🎨\n\nActivities include: ${PROGRAMS.summerCamp.activities}\n\nContact us for details: ${BUSINESS.email} or ${BUSINESS.phone}`;
  }

  // PRODUCTS (general)
  if (topics.includes('products')) {
    const products = (productsData as unknown as Product[]).filter(p => p.status === 'available');
    return `We have ${products.length} unique handmade pieces available! 🏺\n\n- Hanging Ring Planters: $75 each (6" bowl, 12" metal ring, brass hook)\n- Vases: $65 each (watertight for fresh flowers)\n- Table Planters with Saucer: $55 each\n- Orchid Pots: $45-$75\n\nEvery piece is wheel-thrown stoneware, kiln-fired to 2,200°F with lead-free glazes. Each is ONE OF A KIND. Browse at ${BUSINESS.website}/shop`;
  }

  // AGE
  if (topics.includes('age')) {
    return `Here's what we offer by age:\n\n👶 Ages 6+: Home Pottery Kit (guided, easy pre-formed shapes)\n🏫 K-5th Grade: After-school programs at local schools ($235-$250)\n🧒 Kindergarten: Dedicated class at Seaton ES (Thursdays)\n💻 Ages 7-14: Virtual Clay Camp on Zoom ($155)\n\nAll activities are adapted for each age group! 🎨`;
  }

  // KILN / DRYING
  if (topics.includes('kiln')) {
    return `It depends on the product:\n\n📦 Home Pottery Kit: Uses AIR-DRY clay — no kiln needed! Shape it, dry 24-48 hours at room temperature, then paint.\n🏺 Shop Pottery: These ARE kiln-fired to cone 6 (2,200°F) for permanent durability with lead-free glazes.\n\nThe kit is designed so anyone can create pottery at home without special equipment!`;
  }

  // MICROWAVE / DISHWASHER (before general safety)
  if (q.match(/microwave/)) {
    return `${SAFETY.microwave} ${SAFETY.dishwasher} All our glazes are food-safe and lead-free. 🏺`;
  }
  if (q.match(/dishwasher/)) {
    return `${SAFETY.dishwasher} ${SAFETY.microwave} 🏺`;
  }

  // SAFETY (general)
  if (topics.includes('safety')) {
    return `Safety is important to us! 🏺\n\n- ${SAFETY.glazes}\n- ${SAFETY.firing}\n- ${SAFETY.use}\n- ${SAFETY.drainage}`;
  }

  // DRAINAGE
  if (topics.includes('drainage')) {
    return `${SAFETY.drainage} Perfect for real, living plants! 🌿`;
  }

  // CONTACT
  if (topics.includes('contact')) {
    return `Reach us anytime! 📱\n\nEmail: ${BUSINESS.email}\nPhone: ${BUSINESS.phone}\nInstagram: ${BUSINESS.instagram}\nFacebook: ${BUSINESS.facebook}\nWebsite: ${BUSINESS.website}`;
  }

  // ORDER TRACKING / WHERE IS MY ORDER (must check before LOCATION)
  if (topics.includes('tracking') || q.match(/where.*order|where.*package|order.*status|track.*order/)) {
    return `${ORDERS.tracking} If you have any issues, contact us at ${BUSINESS.email} or ${BUSINESS.phone} and we'll help track it down! 📦`;
  }

  // LOCATION
  if (topics.includes('location')) {
    return `Jimmy Potters has two areas:\n\n🏺 Studio & Shop: ${BUSINESS.locations.studio} (pottery creation, kits, online shop)\n🏫 Classes: ${BUSINESS.locations.classes} (after-school programs at local schools)\n\nWe ship pottery and kits nationwide! Browse and shop online at ${BUSINESS.website}`;
  }

  // SOCIAL
  if (topics.includes('social')) {
    return `Follow us! 📱\n\nInstagram: ${BUSINESS.instagram}\nFacebook: ${BUSINESS.facebook}\n\nWe post new pieces, class updates, and behind-the-scenes studio content!`;
  }

  // GIFT (before discounts — "do you offer gift wrapping?" must not match discount 'offer' pattern)
  if (topics.includes('gift')) {
    return `Our pottery and kits make beautiful gifts! 🎁\n\n📦 Home Pottery Kit (${KIT.price}): Comes in a branded gift-ready box — no wrapping needed!\n🏺 Handmade Pottery ($45-$75): Ships carefully packaged and gift-ready\n\nFree shipping on all orders. Perfect for birthdays, anniversaries, Valentine's Day, holidays, or housewarming!`;
  }

  // DISCOUNTS / NEWSLETTER
  if (topics.includes('discounts') || topics.includes('newsletter')) {
    return `Two great ways to save! 💰\n\n📧 Newsletter: ${PROMOTIONS.newsletter} — sign up at the top of any page\n👨‍👩‍👧‍👦 Sibling: ${PROMOTIONS.sibling}`;
  }

  // CUSTOM
  if (topics.includes('custom')) {
    return `We'd love to discuss custom work! 🏺 Reach out to ${BUSINESS.email} or call ${BUSINESS.phone} to discuss your ideas. Every piece is handmade and unique — we can create something special just for you.`;
  }

  // REFUND
  if (topics.includes('refund')) {
    return `For questions about refunds or cancellations, please reach out directly — ${BUSINESS.email} or ${BUSINESS.phone}. We're happy to help! 🏺`;
  }

  // MISSED CLASS
  if (topics.includes('missed')) {
    return `If your child misses a class, just reach out and we'll provide catch-up instructions so they don't fall behind! Contact ${BUSINESS.email} 🎨`;
  }

  // GALLERY
  if (topics.includes('gallery')) {
    return `Check out our full gallery at ${BUSINESS.website}/gallery! Every product photo shows the actual handmade piece — what you see is what you get. Multiple angles and lifestyle shots for most products. 🏺`;
  }

  // DURATION
  if (topics.includes('duration')) {
    return `Time varies by activity:\n\n📦 Home Pottery Kit: About ${KIT.duration}\n🏫 After-School Class: 1 hour per session\n💻 Virtual Clay Camp: 1 hour per session (4 weeks)\n\nFor the kit, air-dry clay needs 24-48 hours to dry after shaping, then you can paint! 🎨`;
  }

  // VIDEO
  if (topics.includes('video')) {
    return `${KIT.video} The video is included with every Home Pottery Kit purchase (${KIT.price}). It covers everything from opening the kit to painting your finished piece. 🎥`;
  }

  // EXPERIENCE
  if (topics.includes('experience')) {
    return `No experience needed for any of our offerings! The Home Pottery Kit comes with pre-formed shapes and a step-by-step video tutorial. After-school programs are taught by professional instructors who guide every step. Virtual clay camp includes live instruction. Everything is designed for beginners! 🎨`;
  }

  // COUPLES
  if (topics.includes('couples')) {
    return `The Date Night Edition Home Pottery Kit is designed for couples! ${KIT.price} with free shipping. Includes enough materials for TWO people, plus romantic-themed shapes like hearts and arches. Takes about ${KIT.duration}. Way better than dinner and a movie! 💑 Order at ${KIT.url}`;
  }

  // PAYMENT / CHECKOUT
  if (topics.includes('tax')) {
    const stateShippingInfo = findStateShipping(question);
    return `Great question! Jimmy Potters currently does NOT charge sales tax on any online orders. 🎉 The price you see is exactly what you pay — no hidden fees or extra charges at checkout.${stateShippingInfo ? `\n\n${stateShippingInfo}` : ''} If you have the newsletter discount, that 10% comes off the listed price too!`;
  }

  if (topics.includes('payment')) {
    return `All payments are processed securely through Stripe. 💳 We accept all major credit and debit cards. Shipping address is collected at checkout. No sales tax is charged. Promo codes accepted: SIBLING15 for virtual classes, plus newsletter subscriber discounts. Guest checkout available — no account required! You can also create an account to track your orders.`;
  }

  // GIFT CARD
  if (topics.includes('giftcard')) {
    return ORDERS.giftCard;
  }

  // HANDMADE / WHY EACH PIECE IS UNIQUE
  if (topics.includes('handmade') || topics.includes('process')) {
    return `${HANDMADE.uniqueness}\n\n${HANDMADE.process}\n\n${HANDMADE.artist} 🏺`;
  }

  // OUTDOOR USE
  if (topics.includes('outdoor')) {
    return `${SAFETY.outdoor} Our stoneware is fired to 2,200°F so it's very durable. For best results outdoors, use with drainage holes (all our planters have them). 🌿`;
  }

  // CARE / CLEANING
  if (topics.includes('care')) {
    return `${SAFETY.cleaning} ${SAFETY.dishwasher} For planters, wipe the exterior occasionally to keep the glaze looking fresh. 🏺`;
  }

  // ALLERGY / NON-TOXIC
  if (topics.includes('allergy')) {
    return `${SAFETY.allergy} Our kiln-fired stoneware uses only non-toxic, food-safe materials. Perfect for homes with kids and pets!`;
  }

  // WEDDING / REGISTRY
  if (topics.includes('wedding')) {
    return `Handmade pottery makes a beautiful wedding gift or registry item! Each piece is one-of-a-kind — perfect for commemorating a special day. For bulk wedding favors or custom pieces, contact us at ${BUSINESS.email} to discuss options and pricing. 💍`;
  }

  // CORPORATE / TEAM BUILDING
  if (topics.includes('corporate')) {
    return `We offer team building pottery experiences! Options include:\n- Virtual Clay Camp sessions for remote teams ($155/person, kits shipped)\n- Home Pottery Kits in bulk for corporate gifts\n- Custom corporate events (contact us for pricing)\n\nEmail ${BUSINESS.email} to plan your team event! 🏢`;
  }

  // COLOR / GLAZE (before availability — "what colors are available?" must show colors, not availability)
  if (topics.includes('color')) {
    return `Our pottery features unique handmade glazes — no two pieces are exactly alike! 🎨\n\nCurrent colors include:\n- Teal & Deep Teal (hanging planters)\n- Mint-Blue Gradient\n- Dark Green (Studio Edition)\n- Navy Blue (table planters)\n- Orange Drip-Glaze (vases)\n- Celadon Crawl-Glaze\n- Amber (orchid pots)\n- Herringbone Pattern\n\nEvery glaze pattern is one of a kind. Browse the Shop or Gallery to see exact colors!`;
  }

  // AVAILABILITY / STOCK
  if (topics.includes('availability')) {
    return `Each handmade piece is one-of-a-kind. When a piece sells, it's gone forever — we don't make duplicates. Check our Shop page for currently available pieces. New pieces are added regularly, so sign up for our newsletter to be notified! 🏺`;
  }

  // SUBSCRIPTION / MONTHLY BOX
  if (topics.includes('subscription')) {
    return `We don't currently offer a subscription box, but it's something we're exploring! Sign up for our newsletter to be the first to know if we launch one. In the meantime, our Home Pottery Kit makes a great recurring gift idea! 📦`;
  }

  // LEAD TIME / HOW LONG TO MAKE
  if (q.match(/how long.*make|how long.*create|lead time|wait|when.*ready/)) {
    return HANDMADE.leadTime;
  }

  // RETURNS
  if (topics.includes('returns')) {
    return `If your pottery arrives damaged, please contact us immediately at ${BUSINESS.email} or ${BUSINESS.phone} with photos. Every order ships with tracking and insurance, so we'll make it right. For other return questions, reach out and we'll work with you! 🏺`;
  }

  // PARTY / GROUP / EVENT
  if (topics.includes('party')) {
    return `Yes, pottery is amazing for parties and events! 🎉\n\n🎂 Birthday Parties: Our Home Pottery Kit ($100) works great for small groups — order multiple kits!\n🏢 Team Building: Perfect creative group activity\n🏫 School Events: We bring mobile pottery to schools and community centers\n\nFor large group bookings or custom party packages, contact us at ${BUSINESS.email} or ${BUSINESS.phone}. We'd love to help plan something special!`;
  }

  // SIZE / DIMENSIONS
  if (topics.includes('size') && productMatch !== null) {
    const pm = productMatch as Product;
    const specs = Object.entries(pm.specs).filter(([k]) => k !== 'note').map(([k, v]) => `${k}: ${v}`).join('\n- ');
    return `${pm.name} specs:\n- ${specs}\n\nEvery piece is handmade, so dimensions may vary slightly — that's what makes each one unique! 🏺`;
  }
  if (topics.includes('size')) {
    return `Our pottery comes in various sizes:\n\n🪴 Hanging Planters: 6" bowl, 12" metal ring frame\n🏺 Vases: 7-8" tall\n🌿 Table Planters: Various sizes, all come with matching saucers\n🌸 Orchid Pots: Compact sizes with saucers\n\nExact dimensions are listed on each product page. Since every piece is handmade, measurements may vary slightly. 🏺`;
  }

  // INDOOR USE
  if (topics.includes('indoor')) {
    return `All our pottery is perfect for indoor use! 🏠 Planters work beautifully on windowsills, shelves, and tables. Table planters come with matching saucers to protect surfaces. Hanging planters include a silicone plug for drip-free indoor display. The Home Pottery Kit creates pieces designed specifically for indoor display and decoration.`;
  }

  // COMPARISON
  if (topics.includes('comparison')) {
    return `What makes Jimmy Potters unique:\n\n✅ Every piece is genuinely one-of-a-kind (not mass-produced)\n✅ Wheel-thrown by hand, not molded\n✅ Original glaze formulas you won't find anywhere else\n✅ Kiln-fired to 2,200°F for lasting durability\n✅ Free shipping on every order\n✅ Home Pottery Kit at $100 (competitors charge $60-150)\n✅ After-school programs bring pottery directly to your child's school\n\nWe're not just selling pottery — we're creating experiences and one-of-a-kind art. 🏺`;
  }

  // EDUCATOR
  if (topics.includes('educator')) {
    return `We love working with educators! 🎨\n\n🏫 After-School Programs: We bring pottery directly to your school (K-5th grade)\n💻 Virtual Clay Camp: Great for homeschool groups (ages 7-14, $155)\n📦 Home Pottery Kits: Perfect for classroom projects ($100 each)\n\nOur programs develop fine motor skills, creativity, patience, and self-expression. Contact ${BUSINESS.email} to discuss bringing pottery to your school or educational setting!`;
  }

  // PRIVATE CLASS
  if (topics.includes('private')) {
    return `Interested in a private pottery experience? Contact us at ${BUSINESS.email} or ${BUSINESS.phone} to discuss private lessons, small group sessions, or custom event bookings. We can tailor the experience to your needs! 🎨`;
  }

  // ACCESSIBILITY
  if (topics.includes('accessibility')) {
    return `We want everyone to enjoy pottery! 🎨 Our Home Pottery Kit is designed to be accessible — pre-formed shapes mean no wheel required, and the air-dry clay is easy to work with. For after-school programs, our instructors adapt projects for different abilities and ages. If you have specific accommodation needs, contact us at ${BUSINESS.email} and we'll do our best to help!`;
  }

  // FUN / CREATIVE
  if (topics.includes('fun')) {
    return `Pottery is incredibly fun and rewarding! 🎨 There's something magical about creating something with your own hands. Kids love getting messy and seeing their ideas come to life. Adults love the mindful, meditative quality of working with clay. The Home Pottery Kit makes it easy — no experience needed, just creativity and a willingness to get your hands dirty (in a good way)! 🏺`;
  }

  // DISPLAY / DECOR
  if (topics.includes('display')) {
    return `Our pottery makes stunning home decor! 🏠\n\n🪴 Hanging Planters: Beautiful on porches, patios, or near windows\n🏺 Vases: Perfect for mantles, dining tables, or bookshelves\n🌿 Table Planters: Great on desks, windowsills, or coffee tables\n📦 Kit Pieces: Display your handmade creations anywhere!\n\nCheck our Gallery page for inspiration — we show pieces styled in real homes. Every piece adds unique character to any space.`;
  }

  // ── Step 5: If no topic matched, give a helpful & honest response ──
  // Log unmatched questions for learning (available via export-learnings API)
  console.log(`[CHAT-LEARNING] Unmatched question: "${question}" | Topics found: [${topics.join(', ')}]`);

  // Vary the fallback response to avoid repetition
  const fallbacks = [
    `That's a great question! I want to make sure I give you the right answer. For this one, I'd recommend reaching out directly to our team:\n\n📧 ${BUSINESS.email}\n📱 ${BUSINESS.phone}\n\nThey'll be able to help you right away! In the meantime, feel free to ask me about our products, shipping, the Home Pottery Kit, or classes. 🏺`,
    `I appreciate the question! I'm best at answering about our pottery products ($45-$75), the Home Pottery Kit ($100 with free shipping), after-school programs ($235-$250), and shipping details. For anything else, our team at ${BUSINESS.email} can help! What else can I tell you about? 🏺`,
    `Hmm, I want to give you an accurate answer rather than guess! 😊 Our team can help with that — reach out at ${BUSINESS.email} or ${BUSINESS.phone}. But I'm great with questions about our handmade pottery, kits, classes, shipping, or pricing. What would you like to know? 🏺`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
