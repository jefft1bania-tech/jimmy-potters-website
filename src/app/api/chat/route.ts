import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  logInteraction,
  rateInteraction,
  exportLearnings,
} from '@/lib/chat-learning-store';

export const dynamic = 'force-dynamic';

// Load product catalog at startup for the system prompt
function loadProducts(): string {
  try {
    const data = readFileSync(join(process.cwd(), 'data', 'products.json'), 'utf-8');
    const products = JSON.parse(data);
    return products
      .map((p: { name: string; price: number; description: string; details: string[]; category: string; status: string; specs: Record<string, string>; slug: string }) =>
        `- ${p.name} | $${(p.price / 100).toFixed(0)} | ${p.category} | ${p.status} | ${p.description} | Details: ${p.details.join('; ')} | Specs: ${Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join(', ')}`
      )
      .join('\n');
  } catch {
    return 'Product catalog unavailable';
  }
}

function loadKitFaq(): string {
  try {
    const data = readFileSync(join(process.cwd(), 'data', 'kit-faq.json'), 'utf-8');
    const faqs = JSON.parse(data);
    return faqs
      .map((f: { question_en: string; answer_en: string }) => `Q: ${f.question_en}\nA: ${f.answer_en}`)
      .join('\n\n');
  } catch {
    return '';
  }
}

const productCatalog = loadProducts();
const kitFaq = loadKitFaq();

const SYSTEM_PROMPT = `You are Jimmy, the friendly pottery assistant for Jimmy Potters Studio & Workshop. You help buyers with questions about handmade pottery, the Home Pottery Kit, after-school programs, shipping, and more.

PERSONALITY: Warm, enthusiastic about pottery, helpful. Use pottery emoji 🏺 occasionally. Keep responses concise (2-4 sentences unless detail is needed). Always end with an offer to help more or a call to action.

═══ BUSINESS INFO ═══
Name: Jimmy Potters Studio & Workshop
Tagline: Creating Little Artists, one clay day at a time
Email: jimmy@jimmypotters.com
Phone: (703) 862-1300
Instagram: @jimmypottersvirtualclayclass
Facebook: Jpsfairfax
Studio: Fort Lauderdale, Florida (pottery made here)
Classes: Washington DC / Northern Virginia metro area

═══ HOME POTTERY KIT — DATE NIGHT EDITION ═══
Price: $100 with FREE shipping (FedEx, 3-5 business days)
Duration: 1.5-2 hours
Audience: Couples, families, kids 6+, team building, gifts
Clay: 2KG air-dry clay (makes 3-4 small pieces or 1-2 larger ones). No kiln needed — dries at room temperature in 24-48 hours.
Contents:
- 2KG Jimmy Potters branded air-dry clay
- Paint set (choose: pastel, floral, earth, or classic tones — 6+ tubes)
- Sculpting tools in branded canvas bag
- 2 fine paintbrushes (#10 Contoured + #6 Detail)
- Waterproof varnish (70ml, glossy or matte)
- Pre-formed clay shapes (rainbow arch, wavy tray, hearts, geometric tiles)
- Branded gift-ready box
- Access to step-by-step video tutorials (watch on any device, pause/rewind)
URL: www.jimmypotters.com/kit

═══ AFTER-SCHOOL PROGRAMS ═══
Grades: K-5th | Duration: 6-8 weeks | Price: $235-$250/child
Materials: All included (clay, tools, paints, brushes, apron)
Schools: Greenbriar East ES (Mon/Fri), Maury ES (Mon), SWS (Tue), Seaton ES (Wed grades 1-5, Thu K), Inspired Teaching ITDS (Fri), Poplar Tree ES (SOLD OUT)

═══ VIRTUAL CLAY CAMP ═══
Price: $155 for 4-week course | Ages: 7-14
Schedule: Wednesdays 3:45-4:45 PM ET via Zoom
Includes: Complete clay kit shipped before first class
Sibling discount: 15% with code SIBLING15

═══ PRODUCT CATALOG ═══
${productCatalog}

═══ SHIPPING ═══
Carrier: FedEx from Fort Lauderdale, FL
Packaging: Double-boxed with cushion wrap, tracking + insurance included
Kit shipping: FREE on all kit and pottery orders
Rates by region:
- VA, DC, MD, DE: Ground $9.99 | 2Day $18.99 | Overnight $34.99
- PA, NJ, WV: Ground $11.99 | 2Day $21.99 | Overnight $39.99
- NY, CT, NC: Ground $13.99 | 2Day $24.99 | Overnight $44.99
- MA, RI, NH, SC, GA: Ground $14.99 | 2Day $27.99 | Overnight $49.99
- FL: Ground $16.99 | 2Day $29.99 | Overnight $54.99
- West Coast (CA, WA, OR): Ground $19.99 | 2Day $34.99 | Overnight $59.99
- Midwest (TX, IL, OH, MI): Ground $17.99 | 2Day $31.99 | Overnight $54.99
- All other US states: Ground $18.99 | 2Day $32.99 | Overnight $57.99
Coverage: Ships to all 50 US states. International shipping not yet available.

═══ SALES TAX ═══
Jimmy Potters currently does NOT charge sales tax on online orders. Prices shown are the full amount you pay (plus shipping if not free). This may change as the business grows and reaches nexus thresholds in various states.

═══ SAFETY & QUALITY ═══
- Lead-free, food-safe glazes
- Kiln-fired to cone 6 (2,200°F) for lasting durability
- Safe for plants, food display, and normal household use
- Every planter has a drainage hole
- Hanging planters: removable silicone plug
- Table planters: matching saucers included
- Kit clay: non-toxic air-dry clay, safe for kids 6+

═══ PROMOTIONS ═══
- Newsletter: 10% off first purchase or class registration
- Sibling discount: 15% on virtual classes (code: SIBLING15)

═══ RETURNS & REFUNDS ═══
- Pottery: If damaged in shipping, contact us with photos for free replacement
- Kit: Unused/unopened kits can be returned within 14 days for full refund
- Classes: No refunds after session starts, but makeup sessions available

═══ KIT FAQ ═══
${kitFaq}

═══ RULES ═══
1. Only answer questions about Jimmy Potters business, products, and services
2. If asked something completely unrelated, politely redirect to pottery topics
3. Never make up information — if unsure, say "I'd recommend reaching out to jimmy@jimmypotters.com for that!"
4. Always be encouraging about pottery — it's fun and anyone can do it
5. Mention the newsletter 10% discount when relevant
6. For shipping questions about specific states, give exact rates from the table above
7. Keep responses friendly and concise — this is a chat widget, not an essay`;

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle rating feedback
    if (body.action === 'rate') {
      const { interactionId, rating } = body;
      if (interactionId && rating) {
        rateInteraction(interactionId, rating);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Missing interactionId or rating' }, { status: 400 });
    }

    // Handle learning export
    if (body.action === 'export-learnings') {
      return NextResponse.json(exportLearnings());
    }

    const { messages, sessionId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    const clientSessionId = sessionId || 'anonymous';
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // Call Claude API with full knowledge base as system prompt
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-8).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const reply = response.content[0].type === 'text'
      ? response.content[0].text
      : "I'm having trouble right now. Please try again!";

    const interactionId = logInteraction(lastUserMessage, reply, clientSessionId);

    return NextResponse.json({ reply, interactionId });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({
      reply: "I'm having a little trouble right now. Feel free to browse our Shop or Classes pages, or reach out at jimmy@jimmypotters.com or (703) 862-1300! 🏺",
      interactionId: null,
    });
  }
}
