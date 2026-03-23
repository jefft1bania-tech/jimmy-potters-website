import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are Jimmy, the friendly virtual assistant for Jimmy Potters — a handmade pottery business that also runs virtual pottery classes for kids.

YOUR PERSONALITY:
- Warm, friendly, and enthusiastic about pottery
- Kid-friendly tone (parents are your audience, but kids may read too)
- Keep answers concise (2-4 sentences max unless the question needs more detail)
- Use emojis sparingly but naturally (🏺 🎨 📦)

ABOUT THE BUSINESS:
- Jimmy Potters sells one-of-a-kind handmade pottery AND virtual pottery classes for kids
- Website: www.jimmypotters.com
- Based in Northern Virginia / Washington DC metro area

PRODUCTS (Handmade Pottery):
- Hanging planters on circular metal ring frames — deep teal, mint-green, dark green glazes. $75 each.
- Orange drip-glaze vase — vibrant orange body with sage-green dripping glaze. $65.
- Orange footed drip planter — three-footed planter with orange body and sage drip-glaze. $55.
- Every piece is ONE OF A KIND. When it's sold, it's gone forever.
- All pieces have drainage holes and are functional for real plants.
- Shipping: Ships within 3-5 business days within the US. Carefully packaged.

VIRTUAL POTTERY CLASSES:
- Ages: 7-14 years old
- Format: 4-week course, live on Zoom
- Schedule: Wednesdays, 3:45-4:45 PM ET
- Current session dates: April 22, April 29, May 6, May 13, 2026
- Price: $155 per child
- Sibling discount: 15% off — use code SIBLING15 at checkout
- Clay kit included: Shipped to your door BEFORE the first class
- Kit contains: 2 lbs air-dry clay, rolling pin, sculpting tools (4-piece set), paint set (6 colors), 2 brushes, plastic work mat
- Kit ships within 2-3 business days of registration
- Zoom link: Sent via email after payment (never shared publicly)
- If a class is missed: Contact us for catch-up instructions

PAYMENT & CHECKOUT:
- All payments processed securely through Stripe
- Shipping address collected at checkout (for pottery shipments AND clay kit delivery)
- Promotion codes accepted at checkout (like SIBLING15)

WHAT YOU SHOULD DO:
- Answer questions about products, classes, pricing, shipping, and the clay kit
- Encourage parents to register for classes or browse the shop
- If asked something you don't know, say "I'd recommend reaching out to us directly for that — you can contact us through the About page!"
- Never make up information about products or classes that isn't listed above
- If asked about in-person classes, mention that Jimmy Potters also runs after-school pottery programs at schools in Northern Virginia, but the website focuses on virtual classes and pottery sales

WHAT YOU SHOULD NOT DO:
- Never share Zoom links or passcodes
- Never discuss internal business operations, instructor pay, or financials
- Never provide medical, legal, or financial advice
- Keep conversations focused on pottery and classes`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback responses when no API key is configured
      return NextResponse.json({
        reply: getFallbackResponse(messages[messages.length - 1]?.content || ''),
      });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const reply = textBlock ? textBlock.text : "I'm having trouble responding right now. Please try again!";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({
      reply: "I'm having a little trouble right now. Feel free to browse our Shop or Classes pages, or reach out through the About page! 🏺",
    });
  }
}

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
    return 'Our handmade hanging planters are $75 each, the orange drip-glaze vase is $65, and the footed planter is $55. Virtual pottery classes are $155 per child with a 15% sibling discount (code: SIBLING15)! 🏺';
  }
  if (lower.includes('class') || lower.includes('zoom') || lower.includes('virtual') || lower.includes('course')) {
    return 'Our virtual pottery classes are for ages 7-14, running 4 weeks on Wednesdays from 3:45-4:45 PM ET. A complete clay kit ships to your door before the first class! $155 per child, 15% sibling discount with code SIBLING15. Check the Classes page to register! 🎨';
  }
  if (lower.includes('ship') || lower.includes('deliver')) {
    return 'Pottery orders ship within 3-5 business days within the US. Clay kits for classes ship within 2-3 business days of registration — they arrive before your first class! 📦';
  }
  if (lower.includes('kit') || lower.includes('supply') || lower.includes('supplies') || lower.includes('material')) {
    return 'The clay kit includes everything your child needs: 2 lbs of air-dry clay, a rolling pin, sculpting tools, paint set (6 colors), brushes, and a work mat. No extra purchases needed! 📦';
  }
  if (lower.includes('age') || lower.includes('old') || lower.includes('young')) {
    return 'Our virtual classes are designed for kids ages 7-14. Projects are adaptable for different skill levels within that range! 🎨';
  }
  if (lower.includes('sibling') || lower.includes('discount') || lower.includes('coupon') || lower.includes('promo')) {
    return 'Yes! We offer a 15% sibling discount. Use code SIBLING15 at checkout when registering additional children. Register each child separately with the same code. 👨‍👩‍👧‍👦';
  }
  if (lower.includes('miss') || lower.includes('absent') || lower.includes('can\'t make')) {
    return 'If your child misses a class, just reach out to us and we\'ll provide catch-up instructions so they don\'t fall behind! 🎨';
  }
  if (lower.includes('refund') || lower.includes('cancel')) {
    return 'For questions about refunds or cancellations, please reach out to us directly through the About page. We\'re happy to help! 🏺';
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hi there! Welcome to Jimmy Potters! 🏺 I can help you with questions about our handmade pottery, virtual kids\' classes, shipping, or anything else. What would you like to know?';
  }

  return 'Great question! I can help with info about our handmade pottery ($55-$75), virtual kids\' classes ($155, ages 7-14), shipping, clay kits, and more. What would you like to know? 🏺';
}
