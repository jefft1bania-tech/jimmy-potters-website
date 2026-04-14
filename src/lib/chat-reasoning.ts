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
    'A paint set of your choice — choose from pastel, floral, earth, or classic tones (6+ paint tubes)',
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
  },
  coverage: 'Currently serving East Coast states (NY to FL). More states coming soon.',
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
  if (q.match(/where|location|studio|store|visit|address|find you/)) topics.push('location');
  // Social
  if (q.match(/instagram|facebook|social|follow|insta|ig/)) topics.push('social');
  // Discounts
  if (q.match(/discount|promo|coupon|code|save|deal|offer|sale|percent.*off/)) topics.push('discounts');
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
  const stateMap: Record<string, string> = {
    'virginia': 'VA, DC, MD, DE', 'va': 'VA, DC, MD, DE', 'dc': 'VA, DC, MD, DE',
    'maryland': 'VA, DC, MD, DE', 'md': 'VA, DC, MD, DE', 'delaware': 'VA, DC, MD, DE', 'de': 'VA, DC, MD, DE',
    'pennsylvania': 'PA, NJ, WV', 'pa': 'PA, NJ, WV', 'new jersey': 'PA, NJ, WV', 'nj': 'PA, NJ, WV',
    'west virginia': 'PA, NJ, WV', 'wv': 'PA, NJ, WV',
    'new york': 'NY, CT, NC', 'ny': 'NY, CT, NC', 'connecticut': 'NY, CT, NC', 'ct': 'NY, CT, NC',
    'north carolina': 'NY, CT, NC', 'nc': 'NY, CT, NC',
    'massachusetts': 'MA, RI, NH, SC, GA', 'ma': 'MA, RI, NH, SC, GA', 'rhode island': 'MA, RI, NH, SC, GA',
    'new hampshire': 'MA, RI, NH, SC, GA', 'nh': 'MA, RI, NH, SC, GA', 'south carolina': 'MA, RI, NH, SC, GA',
    'sc': 'MA, RI, NH, SC, GA', 'georgia': 'MA, RI, NH, SC, GA', 'ga': 'MA, RI, NH, SC, GA',
    'florida': 'FL', 'fl': 'FL',
  };

  for (const [state, zone] of Object.entries(stateMap)) {
    if (q.includes(state)) {
      const rates = SHIPPING.zones[zone as keyof typeof SHIPPING.zones];
      return `Shipping to ${zone}:\n- FedEx Ground (3-5 days): ${rates.ground}\n- FedEx 2Day: ${rates.twoDay}\n- FedEx Priority Overnight: ${rates.overnight}\n\nAll orders include tracking, insurance, and double-box cushion wrapping. The Home Pottery Kit ships FREE!`;
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
    let response = `The ${KIT.name} is ${KIT.price} with free shipping! 🏺\n\nIt includes:\n`;
    response += KIT.contents.map((c, i) => `${i + 1}. ${c}`).join('\n');
    response += `\n\n${KIT.clay} Takes about ${KIT.duration}. ${KIT.video}\n\nOrder at ${KIT.url}`;
    return response;
  }

  // KIT + CONTENTS
  if (topics.includes('kit') && topics.includes('contents')) {
    let response = `The ${KIT.name} (${KIT.price}) includes:\n\n`;
    response += KIT.contents.map((c, i) => `${i + 1}. ${c}`).join('\n');
    response += `\n\nPaint palette options: ${KIT.paintOptions}`;
    response += `\n\n${KIT.clay}\n\n💡 Pro tips from Jimmy:\n- Paint: ${KIT.paintTip}\n- Brushes: ${KIT.brushTip}\n- Varnish: ${KIT.varnishTip}\n- Tools: ${KIT.toolsTip}\n- Clay storage: ${KIT.clayTip}`;
    return response;
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
    return `The kit comes with a paint set of your choice! 🎨 Pick from:\n\n- Pastel Tones\n- Floral Tones\n- Earth Tones\n- Classic Tones\n\nEach set includes 6+ paint tubes. ${KIT.paintTip}\n\nPlus you get waterproof varnish (glossy or matte) to seal your finished piece. ${KIT.varnishTip} 🏺`;
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
    let response = `The ${KIT.name} is ${KIT.price} with free shipping! 🏺\n\nWhat's inside:\n`;
    response += KIT.contents.map((c, i) => `${i + 1}. ${c}`).join('\n');
    response += `\n\nPaint palette options: ${KIT.paintOptions}\n${KIT.clay}\nTakes about ${KIT.duration}. Perfect for ${KIT.audience.toLowerCase()}.\n\nOrder at ${KIT.url}`;
    return response;
  }

  // SHIPPING (with state match)
  if (topics.includes('shipping') && stateShipping) {
    return stateShipping + ' 📦';
  }

  // SHIPPING (general)
  if (topics.includes('shipping')) {
    let response = `All orders ship via FedEx from ${SHIPPING.origin} with free shipping! 📦\n\n`;
    response += `Shipping options for pottery:\n`;
    response += SHIPPING.tiers.map(t => `- ${t.name} (${t.time}): ${t.range}`).join('\n');
    response += `\n\n${SHIPPING.packaging}\n${SHIPPING.coverage}`;
    response += `\n\nThe Home Pottery Kit always ships FREE!`;
    return response;
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

  // SPECIFIC PRODUCT (only if the match is strong — skip if general topics cover it)
  if (productMatch && !topics.includes('process') && !topics.includes('mess') && !topics.includes('whattoexpect')) {
    const p = productMatch;
    const specs = Object.entries(p.specs).filter(([k]) => k !== 'note').map(([k, v]) => `${k}: ${v}`).join(', ');
    return `${p.name} — ${formatPrice(p.price)} 🏺\n\n${p.description.slice(0, 300)}\n\nSpecs: ${specs}\n\n${p.details.slice(0, 4).join('. ')}.\n\nEvery piece is one of a kind — handmade, wheel-thrown stoneware with lead-free glazes. Free shipping! Browse all pottery at www.jimmypotters.com/shop`;
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

  // SAFETY
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

  // LOCATION
  if (topics.includes('location')) {
    return `Jimmy Potters has two areas:\n\n🏺 Studio & Shop: ${BUSINESS.locations.studio} (pottery creation, kits, online shop)\n🏫 Classes: ${BUSINESS.locations.classes} (after-school programs at local schools)\n\nWe ship pottery and kits nationwide! Browse and shop online at ${BUSINESS.website}`;
  }

  // SOCIAL
  if (topics.includes('social')) {
    return `Follow us! 📱\n\nInstagram: ${BUSINESS.instagram}\nFacebook: ${BUSINESS.facebook}\n\nWe post new pieces, class updates, and behind-the-scenes studio content!`;
  }

  // DISCOUNTS / NEWSLETTER
  if (topics.includes('discounts') || topics.includes('newsletter')) {
    return `Two great ways to save! 💰\n\n📧 Newsletter: ${PROMOTIONS.newsletter} — sign up at the top of any page\n👨‍👩‍👧‍👦 Sibling: ${PROMOTIONS.sibling}`;
  }

  // GIFT
  if (topics.includes('gift')) {
    return `Our pottery and kits make beautiful gifts! 🎁\n\n📦 Home Pottery Kit (${KIT.price}): Comes in a branded gift-ready box — no wrapping needed!\n🏺 Handmade Pottery ($45-$75): Ships carefully packaged and gift-ready\n\nFree shipping on all orders. Perfect for birthdays, anniversaries, Valentine's Day, holidays, or housewarming!`;
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
  if (topics.includes('payment')) {
    return `All payments are processed securely through Stripe. 💳 We accept all major credit and debit cards. Shipping address is collected at checkout. Promo codes accepted: SIBLING15 for virtual classes, plus newsletter subscriber discounts. Guest checkout available — no account required! You can also create an account to track your orders.`;
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

  // COLOR / GLAZE
  if (topics.includes('color')) {
    return `Our pottery features unique handmade glazes — no two pieces are exactly alike! 🎨\n\nCurrent colors include:\n- Teal & Deep Teal (hanging planters)\n- Mint-Blue Gradient\n- Dark Green (Studio Edition)\n- Navy Blue (table planters)\n- Orange Drip-Glaze (vases)\n- Celadon Crawl-Glaze\n- Amber (orchid pots)\n- Herringbone Pattern\n\nEvery glaze pattern is one of a kind. Browse the Shop or Gallery to see exact colors!`;
  }

  // ALLERGY / SENSITIVITY
  if (topics.includes('allergy')) {
    return `Safety first! All our glazes are lead-free, non-toxic, and food-safe. The Home Pottery Kit uses standard air-dry clay which is non-toxic and safe for children ages 6+. The included paints are also non-toxic. If your child has specific clay sensitivities, we recommend testing a small piece on the hand first. Contact us at ${BUSINESS.email} for specific ingredient questions. 🏺`;
  }

  // OUTDOOR USE
  if (topics.includes('outdoor')) {
    return `Our kiln-fired pottery is durable for outdoor use! 🌿 However, for best longevity:\n\n- Bring pieces inside during freezing temperatures (clay can crack if water freezes inside)\n- Glazed surfaces handle rain and sun well\n- Drainage holes prevent water buildup\n- The silicone plug on hanging planters can be used for indoor display without dripping\n\nFor the Home Pottery Kit: air-dry clay is best for indoor display, as it's not waterproof like kiln-fired pieces.`;
  }

  // INDOOR USE
  if (topics.includes('indoor')) {
    return `All our pottery is perfect for indoor use! 🏠 Planters work beautifully on windowsills, shelves, and tables. Table planters come with matching saucers to protect surfaces. Hanging planters include a silicone plug for drip-free indoor display. The Home Pottery Kit creates pieces designed specifically for indoor display and decoration.`;
  }

  // CARE / MAINTENANCE
  if (topics.includes('care')) {
    return `Pottery care is easy! 🏺\n\n🪴 Kiln-Fired Pottery (shop pieces):\n- Wipe with a damp cloth to clean\n- Safe for gentle hand washing\n- Avoid extreme temperature changes\n- Drainage holes keep plants healthy\n\n📦 Air-Dry Kit Pieces:\n- Dust gently with a soft cloth\n- Keep away from water once painted\n- Display indoors for best results\n- Handle with care — they're decorative pieces, not cookware`;
  }

  // HANDMADE / UNIQUE
  if (topics.includes('handmade')) {
    return `Every single piece is 100% handmade by Jimmy in our Fort Lauderdale studio! 🏺\n\nThe process: raw clay → shaped on the pottery wheel → dried → kiln-fired to 2,200°F → hand-glazed with original formulas → fired again. Each glaze pattern is completely unique — the way heat and chemistry interact creates unrepeatable colors and textures. When a piece sells, it will NEVER be remade. That's what makes each one a true collector's item.`;
  }

  // COMPARISON
  if (topics.includes('comparison')) {
    return `What makes Jimmy Potters unique:\n\n✅ Every piece is genuinely one-of-a-kind (not mass-produced)\n✅ Wheel-thrown by hand, not molded\n✅ Original glaze formulas you won't find anywhere else\n✅ Kiln-fired to 2,200°F for lasting durability\n✅ Free shipping on every order\n✅ Home Pottery Kit at $100 (competitors charge $60-150)\n✅ After-school programs bring pottery directly to your child's school\n\nWe're not just selling pottery — we're creating experiences and one-of-a-kind art. 🏺`;
  }

  // BULK / WHOLESALE
  if (topics.includes('bulk')) {
    return `For bulk orders, wholesale inquiries, or large group purchases, please contact us directly at ${BUSINESS.email} or ${BUSINESS.phone}. We can discuss volume pricing for kits, special event packages, and corporate orders. We'd love to work with you! 🏺`;
  }

  // EDUCATOR
  if (topics.includes('educator')) {
    return `We love working with educators! 🎨\n\n🏫 After-School Programs: We bring pottery directly to your school (K-5th grade)\n💻 Virtual Clay Camp: Great for homeschool groups (ages 7-14, $155)\n📦 Home Pottery Kits: Perfect for classroom projects ($100 each)\n\nOur programs develop fine motor skills, creativity, patience, and self-expression. Contact ${BUSINESS.email} to discuss bringing pottery to your school or educational setting!`;
  }

  // AVAILABILITY
  if (topics.includes('availability')) {
    return `Since every pottery piece is handmade and one-of-a-kind, once it sells it's gone forever! 🏺 We add new pieces regularly — follow us on Instagram (${BUSINESS.instagram}) or sign up for our newsletter to be the first to know when new work drops.\n\nThe Home Pottery Kit ($100) is always available and ships within 1-2 business days!\n\nAfter-school program spots fill up fast — check the website for current availability. Poplar Tree ES is currently SOLD OUT.`;
  }

  // INTERNATIONAL
  if (topics.includes('international')) {
    return `Currently we ship within the continental United States only (East Coast states: NY to FL). 📦 We're working on expanding our shipping coverage — sign up for our newsletter to be notified when we add more states and international shipping. For special international requests, contact ${BUSINESS.email} and we'll see what we can do!`;
  }

  // SUBSCRIPTION
  if (topics.includes('subscription')) {
    return `We don't currently offer a subscription box, but it's something we're considering! 📦 In the meantime, sign up for our newsletter to get notified about new pottery drops, seasonal kit editions, and special promotions. New pieces are added regularly — each one completely unique! 🏺`;
  }

  // REVIEWS
  if (topics.includes('reviews')) {
    return `Our customers love their Jimmy Potters pieces! Check out our Instagram (${BUSINESS.instagram}) and Facebook (${BUSINESS.facebook}) for customer photos, reviews, and testimonials. Parents especially love our after-school programs — kids come home excited about what they created! The gallery page shows our work in real homes. 🏺`;
  }

  // PRIVATE CLASS
  if (topics.includes('private')) {
    return `Interested in a private pottery experience? Contact us at ${BUSINESS.email} or ${BUSINESS.phone} to discuss private lessons, small group sessions, or custom event bookings. We can tailor the experience to your needs! 🎨`;
  }

  // TRACKING
  if (topics.includes('tracking')) {
    return `Every order includes full FedEx tracking and insurance! 📦 You'll receive a tracking number via email once your order ships. If you have concerns about a package, contact us at ${BUSINESS.email} with your order details and we'll help track it down. All pottery is double-boxed with cushion wrap for safe delivery.`;
  }

  // ECO / SUSTAINABILITY
  if (topics.includes('eco')) {
    return `We care about sustainability! 🌍\n\n- Our clay is a natural, earth-derived material\n- Lead-free, non-toxic glazes safe for the environment\n- Each piece is made to last a lifetime (not disposable)\n- We use protective but minimal packaging\n- The Home Pottery Kit's air-dry clay is water-based and non-toxic\n\nBy buying handmade, you're supporting sustainable small-batch creation over mass manufacturing.`;
  }

  // GIFT CARD
  if (topics.includes('giftcard')) {
    return `We don't currently offer gift cards, but our pottery and kits make wonderful gifts! 🎁 The Home Pottery Kit ($100) comes in a beautiful branded box — no wrapping needed. For a custom gift recommendation, contact us at ${BUSINESS.email} and we'll help you pick the perfect piece!`;
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

  // PET SAFE
  if (topics.includes('petsafe')) {
    return `Our kiln-fired pottery uses lead-free, non-toxic glazes and is safe around pets! 🐾 However, we recommend placing pottery where curious pets can't knock it over — ceramic can break if dropped. The planters have drainage holes, so avoid toxic plants if you have plant-nibbling pets. The Home Pottery Kit clay and paints are also non-toxic.`;
  }

  // WEDDING / REGISTRY
  if (topics.includes('wedding')) {
    return `Pottery makes a beautiful wedding or engagement gift! 💒\n\n🏺 One-of-a-kind handmade pieces are meaningful, unique gifts\n📦 The Date Night Edition Kit ($100) is perfect for engaged couples\n🎁 Everything ships gift-ready with free shipping\n\nFor custom wedding favors or large orders, contact us at ${BUSINESS.email}. We'd love to be part of your celebration!`;
  }

  // CORPORATE / TEAM BUILDING
  if (topics.includes('corporate')) {
    return `Pottery is an amazing team building activity! 🏢\n\n📦 Home Pottery Kits ($100 each): Ship directly to team members for virtual team building\n🏫 On-Site Events: We bring pottery to your location\n🎨 Creative Workshops: Customizable for your team's needs\n\nContact ${BUSINESS.email} or ${BUSINESS.phone} to discuss corporate packages, volume pricing, and custom experiences. It's a memorable alternative to the usual team outing!`;
  }

  // ── Step 5: If no topic matched, give a helpful default ──
  return `Great question! Here's a quick overview of what Jimmy Potters offers:\n\n🏺 Handmade Pottery: $45-$75 (one-of-a-kind pieces)\n📦 Home Pottery Kit: ${KIT.price} (Date Night Edition, free shipping)\n🏫 After-School Programs: $235-$250 (K-5th grade)\n💻 Virtual Clay Camp: $155 (ages 7-14)\n\nFree shipping on all orders! 10% off for newsletter subscribers. What would you like to know more about? Email us at ${BUSINESS.email} for anything I can't answer here.`;
}
