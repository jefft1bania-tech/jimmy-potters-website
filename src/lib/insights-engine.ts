// Claude-powered business insights for /admin/insights.
//
// Prompt caching strategy:
// - The system prompt (persona + output contract) is cached — stable forever,
//   so repeat queries during a thinking session hit the cache.
// - The snapshot is NOT cached — it varies per query. We keep it under 10k
//   tokens so input cost stays reasonable without cache.
//
// SERVER ONLY. Requires ANTHROPIC_API_KEY.

import Anthropic from '@anthropic-ai/sdk';
import type { InsightsSnapshot } from './insights-snapshot';

export const INSIGHTS_MODEL = 'claude-opus-4-7';
export const INSIGHTS_PROMPT_VERSION = '2026-04-20.v1';

const SYSTEM_PROMPT = `You are the business intelligence analyst for Jimmy Potters, a small
handmade-pottery e-commerce business (Fort Lauderdale, FL) that also runs
after-school pottery classes (NoVA / DC metro). The owner is Jeff Bania.

Your job: answer Jeff's question about the business using ONLY the data
in the provided snapshot. If the answer requires data that isn't in the
snapshot, say so plainly — don't speculate. Favor specific numbers pulled
straight from the snapshot over generic advice.

Output in short, scannable Markdown:
- Open with a 1-sentence direct answer.
- Follow with a few bullet points of supporting detail (exact numbers from
  the snapshot, cited as USD using $X.XX format — divide cents by 100).
- End with 1 concrete next step Jeff can take today, if relevant.

Never exceed 200 words. No fluff, no re-introducing context Jeff already
knows (he owns this business).

All cents values in the snapshot are integers. Convert to dollars before
presenting. Percentages in the snapshot are 0-1 floats — present as X.X%.`;

export type InsightResponse = {
  response_markdown: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
};

export async function answerInsightQuery(opts: {
  query: string;
  snapshot: InsightsSnapshot;
}): Promise<InsightResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  const client = new Anthropic({ apiKey });

  const userContent = `Business snapshot (generated ${opts.snapshot.generated_at}):
\`\`\`json
${JSON.stringify(opts.snapshot, null, 2)}
\`\`\`

Question: ${opts.query}`;

  const resp = await client.messages.create({
    model: INSIGHTS_MODEL,
    max_tokens: 1024,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userContent }],
  });

  const textBlock = resp.content.find((c): c is Anthropic.TextBlock => c.type === 'text');
  if (!textBlock) throw new Error('Claude returned no text block');

  return {
    response_markdown: textBlock.text.trim(),
    usage: {
      input_tokens: resp.usage.input_tokens,
      output_tokens: resp.usage.output_tokens,
      cache_read_input_tokens: (resp.usage as { cache_read_input_tokens?: number }).cache_read_input_tokens,
      cache_creation_input_tokens: (resp.usage as { cache_creation_input_tokens?: number }).cache_creation_input_tokens,
    },
  };
}
