// Claude-powered extractor for uploaded financial documents (receipts,
// invoices, bills, 1099, W2, bank statements).
//
// Prompt caching on the system block keeps repeated parses cheap —
// the ~1.5k-token instruction stays in cache across a batch of uploads
// within the 5-minute TTL, so only the doc bytes are fresh input.
//
// SERVER ONLY. Requires ANTHROPIC_API_KEY.

import Anthropic from '@anthropic-ai/sdk';

const PARSE_MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are a receipt and invoice extractor for a small e-commerce pottery
business's bookkeeping system. You will be given a single financial
document (receipt, invoice, bill, 1099, W2, or bank statement) as an
image or PDF and must extract its structured data.

Respond with a single JSON object and NOTHING else — no markdown fences,
no commentary, no leading text. The object must have exactly these keys:

  {
    "vendor":       string | null,   // merchant or payer name as printed
    "amount_cents": integer | null,  // grand total in USD cents (incl. tax)
    "tax_cents":    integer | null,  // sales tax portion in USD cents
    "issued_on":    string | null,   // ISO date YYYY-MM-DD
    "line_items":   Array<{ description: string, quantity: number | null, unit_price_cents: number | null, total_cents: number | null }>,
    "raw_text":     string,          // best-effort verbatim OCR of the document body
    "confidence":   number           // 0.0-1.0 overall confidence in the extracted totals
  }

Rules:
- Cents are integers. $12.34 → 1234. Never use floats or strings for amounts.
- If a field is illegible or not present, use null (except line_items which is [] and raw_text which is "").
- issued_on must be YYYY-MM-DD. If only a month/year is present, use the first of that month.
- amount_cents is the TOTAL the customer or payer is out of pocket — for a receipt, that's the grand total after tax.
- tax_cents is the tax portion alone, 0 if shown as 0, null if not shown at all.
- Do not invent values. If you cannot read a number, return null.
- confidence should drop below 0.6 for blurry scans, cropped receipts, or multi-page docs where key fields are not all visible.

Begin parsing now. Output ONLY the JSON object.`;

export type ParsedDocument = {
  vendor: string | null;
  amount_cents: number | null;
  tax_cents: number | null;
  issued_on: string | null;
  line_items: Array<{
    description: string;
    quantity: number | null;
    unit_price_cents: number | null;
    total_cents: number | null;
  }>;
  raw_text: string;
  confidence: number;
};

export type ParseOutcome = {
  parsed: ParsedDocument;
  usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number };
};

// Anthropic's image block accepts jpeg/png/webp/gif only. HEIC/HEIF
// round-trips to storage fine but can't be parsed until converted, so
// /parse returns an error for those mime types.
const PARSABLE_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  // Tolerate ```json fences if the model slips up.
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1] : trimmed;
  return JSON.parse(candidate);
}

function asIntOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[$,]/g, ''));
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  return null;
}

function asStringOrNull(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s : null;
}

function coerceLineItems(v: unknown): ParsedDocument['line_items'] {
  if (!Array.isArray(v)) return [];
  return v
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const r = raw as Record<string, unknown>;
      const description = asStringOrNull(r.description) ?? '';
      if (!description) return null;
      return {
        description,
        quantity: typeof r.quantity === 'number' && Number.isFinite(r.quantity) ? r.quantity : null,
        unit_price_cents: asIntOrNull(r.unit_price_cents),
        total_cents: asIntOrNull(r.total_cents),
      };
    })
    .filter((x): x is ParsedDocument['line_items'][number] => x !== null);
}

function coerceParsed(raw: unknown): ParsedDocument {
  const r = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {});
  const issued = asStringOrNull(r.issued_on);
  const issuedClean = issued && /^\d{4}-\d{2}-\d{2}$/.test(issued) ? issued : null;
  const conf = typeof r.confidence === 'number' && Number.isFinite(r.confidence)
    ? Math.max(0, Math.min(1, r.confidence))
    : 0.5;
  return {
    vendor: asStringOrNull(r.vendor),
    amount_cents: asIntOrNull(r.amount_cents),
    tax_cents: asIntOrNull(r.tax_cents),
    issued_on: issuedClean,
    line_items: coerceLineItems(r.line_items),
    raw_text: asStringOrNull(r.raw_text) ?? '',
    confidence: conf,
  };
}

export async function parseFinancialDocument(opts: {
  bytes: Buffer;
  mimeType: string;
}): Promise<ParseOutcome> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const client = new Anthropic({ apiKey });
  const base64 = opts.bytes.toString('base64');

  let content: Anthropic.MessageParam['content'];
  if (opts.mimeType === 'application/pdf') {
    content = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      },
      { type: 'text', text: 'Parse this document per the system instructions.' },
    ];
  } else if (PARSABLE_IMAGE_MIMES.has(opts.mimeType)) {
    content = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: opts.mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
          data: base64,
        },
      },
      { type: 'text', text: 'Parse this document per the system instructions.' },
    ];
  } else if (opts.mimeType === 'image/heic' || opts.mimeType === 'image/heif') {
    throw new Error('HEIC/HEIF is not supported by the parser. Convert to JPEG or PNG and re-upload.');
  } else {
    throw new Error(`Unsupported mime type for parse: ${opts.mimeType}`);
  }

  const resp = await client.messages.create({
    model: PARSE_MODEL,
    max_tokens: 2048,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content }],
  });

  const textBlock = resp.content.find((c): c is Anthropic.TextBlock => c.type === 'text');
  if (!textBlock) throw new Error('Claude returned no text block');

  let parsedRaw: unknown;
  try {
    parsedRaw = extractJson(textBlock.text);
  } catch {
    throw new Error(`Claude output was not valid JSON: ${textBlock.text.slice(0, 200)}`);
  }

  const parsed = coerceParsed(parsedRaw);

  return {
    parsed,
    usage: {
      input_tokens: resp.usage.input_tokens,
      output_tokens: resp.usage.output_tokens,
      cache_read_input_tokens: (resp.usage as { cache_read_input_tokens?: number }).cache_read_input_tokens,
    },
  };
}
