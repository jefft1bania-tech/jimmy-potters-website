import { NextRequest, NextResponse } from 'next/server';
import { reasonAboutQuestion } from '@/lib/chat-reasoning';
import {
  logInteraction,
  rateInteraction,
  exportLearnings,
  getLearnedContext,
} from '@/lib/chat-learning-store';

export const dynamic = 'force-dynamic';

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

    // Handle learning export (for admin/debugging) — requires API key or localhost
    if (body.action === 'export-learnings') {
      const adminKey = process.env.CHAT_ADMIN_KEY;
      const apiKey = req.headers.get('x-api-key');
      const forwardedFor = req.headers.get('x-forwarded-for') || '';
      const isLocalhost = forwardedFor === '' || forwardedFor === '127.0.0.1' || forwardedFor === '::1';

      if (adminKey && apiKey === adminKey) {
        return NextResponse.json(exportLearnings());
      }
      if (!adminKey && isLocalhost) {
        return NextResponse.json(exportLearnings());
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, sessionId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    const clientSessionId = sessionId || 'anonymous';

    // Build conversational context from the last 5 messages so the reasoning
    // engine can handle follow-ups like "tell me more" or "how much is that one?"
    const recentMessages = messages.slice(-5);
    const lastUserMessage = recentMessages[recentMessages.length - 1]?.content || '';

    let questionWithContext = lastUserMessage;
    if (recentMessages.length > 1) {
      const contextLines = recentMessages.slice(0, -1).map(
        (m: { role: string; content: string }) =>
          `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`
      );
      questionWithContext =
        `[Previous conversation]\n${contextLines.join('\n')}\n[Current question]\n${lastUserMessage}`;
    }

    // Inject learned context from past successful interactions
    const learnedContext = getLearnedContext(lastUserMessage);
    const enrichedQuestion = learnedContext
      ? questionWithContext + learnedContext
      : questionWithContext;

    // Chain-of-thought reasoning engine — analyzes question topics,
    // matches against full knowledge base, generates intelligent response
    let reply = reasonAboutQuestion(enrichedQuestion);

    // Count user messages in conversation — after 3+, offer human handoff
    const userMessageCount = messages.filter((m: { role: string }) => m.role === 'user').length;
    if (userMessageCount >= 3 && userMessageCount % 3 === 0) {
      reply += '\n\n---\n💬 You\'ve got great questions! Want to chat with a real person? We\'d love to help personally:\n\n📧 jimmy@jimmypotters.com\n📱 (703) 862-1300\n💬 WhatsApp: tap the green button below\n\nWe typically respond within a few hours!';
    }

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
