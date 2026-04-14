import { NextRequest, NextResponse } from 'next/server';
import { reasonAboutQuestion } from '@/lib/chat-reasoning';
import {
  logInteraction,
  rateInteraction,
  exportLearnings,
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

    // Chain-of-thought reasoning engine — analyzes question topics,
    // matches against full knowledge base, generates intelligent response
    const reply = reasonAboutQuestion(lastUserMessage);
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
