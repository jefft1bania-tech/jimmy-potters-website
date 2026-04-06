import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildFullKnowledge, getProductByQuestion } from '@/lib/chatbot-knowledge';
import {
  logInteraction,
  rateInteraction,
  getLearnedContext,
  getInteractionCount,
  getLearnedPatternCount,
  exportLearnings,
} from '@/lib/chat-learning-store';

export const dynamic = 'force-dynamic';

// Build the system prompt dynamically from live data + learned patterns
function buildSystemPrompt(currentQuestion: string): string {
  const knowledgeBase = buildFullKnowledge();
  const learnedContext = getLearnedContext(currentQuestion);
  const productContext = getProductByQuestion(currentQuestion);
  const stats = `[Learning stats: ${getInteractionCount()} interactions logged, ${getLearnedPatternCount()} patterns learned]`;

  return `You are Jimmy, the friendly virtual assistant for Jimmy Potters Studio & Workshop — a handmade pottery business and mobile afterschool pottery enrichment provider based in Fort Lauderdale, Florida.

YOUR PERSONALITY:
- Warm, friendly, and genuinely enthusiastic about pottery and working with kids
- Kid-friendly tone (parents are your primary audience, but kids may read too)
- Keep answers concise (2-4 sentences max unless the question needs more detail)
- Use emojis sparingly but naturally (🏺 🎨 📦)
- Be helpful and proactive — suggest related info the client might find useful
- If a parent seems undecided, gently highlight the benefits (creativity, fine motor skills, focus)

ABOUT THE BUSINESS:
- Jimmy Potters Studio & Workshop — "Creating Little Artists, one clay day at a time"
- Mobile afterschool pottery enrichment workshops for elementary school children
- Also sells handmade, one-of-a-kind pottery pieces online
- Website: www.jimmypotters.com
- Email: jimmy@jimmypotters.com | Phone: (703) 862-1300
- Based in Fort Lauderdale, Florida / Washington DC metro area
- Instagram: @jimmypottersvirtualclayclass | Facebook: Jpsfairfax
- "Teaching pottery to children is like molding not just clay, but also their imagination and creativity, guiding them to shape a future of endless possibilities."

NEWSLETTER PROMOTION:
- Anyone who signs up for the newsletter gets 10% off their first pottery purchase or class registration
- Encourage visitors to sign up — the newsletter banner is at the top of every page

${knowledgeBase}

PAYMENT & CHECKOUT:
- All payments processed securely through Stripe
- Shipping address collected at checkout (for pottery shipments AND clay kit delivery)
- Promotion codes accepted at checkout (SIBLING15 for virtual classes, newsletter 10% discount)
- Pottery ships via FedEx with 3 tier options (Ground, 2Day, Priority Overnight)
- Rates range from $9.99 to $54.99 depending on state and speed
- Currently serving East Coast states: VA, DC, MD, DE, PA, NJ, WV, NY, CT, NC, MA, RI, NH, SC, GA, FL
- Every package double-boxed with cushion wrap, includes tracking and insurance

GALLERY:
- Full photo gallery available at www.jimmypotters.com/gallery
- Every product photo shows the actual handmade piece — what you see is what you get
- Multiple angles and lifestyle shots for most products

${productContext ? `\nSPECIFIC PRODUCT MATCH FOR THIS QUESTION:\n${productContext}\n` : ''}
${learnedContext}

WHAT YOU SHOULD DO:
- Answer questions about products, after-school programs, virtual classes, pricing, shipping, and the clay kit
- Provide specific details when asked (exact dates, prices, dimensions, materials)
- Encourage parents to register for programs or browse the shop
- Mention the 10% newsletter discount when relevant
- If a program is sold out, suggest alternatives
- If asked about a specific school, check if we have a program there
- If asked something you don't know, say "I'd recommend reaching out to us directly — email jimmy@jimmypotters.com or call (703) 862-1300!"
- Never make up information about products or classes

WHAT YOU SHOULD NOT DO:
- Never share Zoom links or passcodes
- Never discuss internal business operations, instructor pay, or financials
- Never provide medical, legal, or financial advice
- Keep conversations focused on pottery and programs
- Never invent products or classes that don't exist

SELF-IMPROVEMENT:
${stats}
- You are continuously learning from client interactions. Use the learned patterns above to provide better, more relevant answers.
- If a client asks something new, provide the best answer you can — it will be logged and may help future clients with similar questions.`;
}

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

    // Handle learning export (for admin/debugging)
    if (body.action === 'export-learnings') {
      return NextResponse.json(exportLearnings());
    }

    const { messages, sessionId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const clientSessionId = sessionId || 'anonymous';

    if (!process.env.ANTHROPIC_API_KEY) {
      const reply = getFallbackResponse(lastUserMessage);
      const interactionId = logInteraction(lastUserMessage, reply, clientSessionId);
      return NextResponse.json({ reply, interactionId });
    }

    const systemPrompt = buildSystemPrompt(lastUserMessage);

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const reply = textBlock ? textBlock.text : "I'm having trouble responding right now. Please try again!";

    // Log the interaction for learning
    const interactionId = logInteraction(lastUserMessage, reply, clientSessionId);

    return NextResponse.json({ reply, interactionId });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({
      reply: "I'm having a little trouble right now. Feel free to browse our Shop or Classes pages, or reach out through the About page! 🏺",
      interactionId: null,
    });
  }
}

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.match(/price|cost|how much/)) {
    return 'Our handmade pottery ranges from $45-$75: hanging ring planters ($75), vases ($65), table planters with saucer ($45-$55), and the herringbone orchid pot set ($75). After-school programs are $235-$250, virtual clay camp is $155. Plus, sign up for our newsletter at the top of the page for 10% off! 🏺';
  }
  if (lower.match(/after|school|in.?person/)) {
    return 'We offer after-school pottery enrichment at multiple schools: Greenbriar East (Mon & Fri), Maury ES (Mon), SWS (Tue), Seaton ES (Wed grades 1-5 & Thu kindergarten), and Inspired Teaching ITDS (Fri). Programs run 6-8 weeks, $235-$250 per child, all materials included. Poplar Tree is SOLD OUT. Check the Programs page! 🎨';
  }
  if (lower.match(/class|zoom|virtual|course|online/)) {
    return 'Our virtual clay camp is $155 for a 4-week course on Zoom (Wednesdays 3:45-4:45 PM ET, ages 7-14). A complete clay kit ships to your door before the first class! We also have after-school programs at local schools ($235-$250). 15% sibling discount with code SIBLING15. 🎨';
  }
  if (lower.match(/ship|deliver|fedex|fed ex/)) {
    return 'All pottery ships via FedEx from Fort Lauderdale, FL! Three tiers: FedEx Ground (3-5 days, $9.99-$16.99), FedEx 2Day ($18.99-$29.99), and FedEx Priority Overnight ($34.99-$54.99). Rates depend on your state — we currently serve East Coast states from NY to FL. Every package is double-boxed with cushion wrap, tracking, and insurance. Check the product page for exact rates to your state! 📦';
  }
  if (lower.match(/kit|supply|supplies|material|include/)) {
    return 'The virtual class clay kit includes: 2 lbs air-dry clay, rolling pin, sculpting tools (4-piece set), paint set (6 colors), 2 brushes, and a plastic work mat. For after-school programs, all materials (clay, tools, paints, brushes, apron) are provided at the school. 📦';
  }
  if (lower.match(/age|old|young|grade/)) {
    return 'Virtual clay camp is for ages 7-14. After-school programs serve K-5th grade (with a dedicated Kindergarten class at Seaton ES on Thursdays). Projects are adapted for each age group! 🎨';
  }
  if (lower.match(/sibling|discount|promo|coupon|newsletter|10.*percent/)) {
    return 'Two great ways to save! 15% sibling discount on virtual classes (code: SIBLING15), and 10% off for newsletter subscribers — sign up at the top of any page! 👨‍👩‍👧‍👦';
  }
  if (lower.match(/miss|absent|can.?t make|sick/)) {
    return "If your child misses a class, just reach out and we'll provide catch-up instructions so they don't fall behind! 🎨";
  }
  if (lower.match(/refund|cancel/)) {
    return "For questions about refunds or cancellations, please reach out directly — jimmy@jimmypotters.com or (703) 862-1300. We're happy to help! 🏺";
  }
  if (lower.match(/planter|vase|pot|ceramic|glaze|hang/)) {
    return 'We have 15 unique handmade pieces: 6 hanging ring planters ($75), 2 vases ($65), and 7 table planters/pots ($45-$75). Every piece is wheel-thrown stoneware, kiln-fired to 2,200°F with lead-free glazes. Each is one of a kind — browse the Shop or Gallery page to see them all! 🏺';
  }
  if (lower.match(/summer|camp/)) {
    return 'Our mobile summer camp brings the pottery studio directly to schools and community centers! Hands-on clay activities including mushroom fairy houses, animal figures, and decorative keepsake boxes. Contact us for details! 🎨';
  }
  if (lower.match(/gallery|photo|picture|image/)) {
    return 'Check out our full gallery at www.jimmypotters.com/gallery — every piece photographed from multiple angles in studio and lifestyle settings. What you see is what you get! 🏺';
  }
  if (lower.match(/contact|email|phone|reach|talk/)) {
    return 'Reach us anytime! Email: jimmy@jimmypotters.com | Phone: (703) 862-1300 | Instagram: @jimmypottersvirtualclayclass | Facebook: Jpsfairfax 📱';
  }
  if (lower.match(/safe|food|lead|toxic|microwave|dishwasher/)) {
    return 'All our pottery uses lead-free, food-safe glazes and is kiln-fired to cone 6 (2,200°F) for lasting durability. Every piece is safe for plants, food display, and normal household use. 🏺';
  }
  if (lower.match(/drain|hole|water|plant/)) {
    return 'Every planter has a drainage hole for healthy root systems. Hanging planters include a removable silicone plug, and table planters come with matching saucers to protect your surfaces. Perfect for real, living plants! 🌿';
  }
  if (lower.match(/custom|commission|special.?order/)) {
    return "We'd love to discuss custom work! Reach out to jimmy@jimmypotters.com or call (703) 862-1300 to discuss your ideas. 🏺";
  }
  if (lower.match(/gift|present|wrap/)) {
    return 'Our pottery makes a beautiful gift! Each piece ships carefully packaged and gift-ready. The Dark Green Studio Ring Planter even comes in custom protective packaging perfect for gifting. Free shipping too! 🎁';
  }
  if (lower.match(/hello|hi |hey|good morning|good afternoon/)) {
    return "Hi there! Welcome to Jimmy Potters! 🏺 I can help you with our handmade pottery collection, after-school programs, virtual clay camp, pricing, shipping, and more. What can I help you with today?";
  }

  return 'Great question! I can help with our handmade pottery ($45-$75), after-school programs at local schools ($235-$250), virtual clay camp ($155, ages 7-14), shipping, and more. Don\'t forget to sign up for our newsletter at the top of the page for 10% off! What would you like to know? 🏺';
}
