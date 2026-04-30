// Vercel billing email parser. Lives outside the App-Router route file because
// Next.js disallows non-method exports from route.ts modules.

export type ParsedVercelInvoice = {
  amount_usd: number;
  period_start_iso: string | null;
  period_end_iso: string | null;
};

// parseVercelInvoiceBody extracts the invoice total + period from a Vercel
// billing email body. Returns null when neither a labeled total nor any
// dollar amount is present in the body.
export function parseVercelInvoiceBody(body: string): ParsedVercelInvoice | null {
  // Word-boundary anchored to avoid matching "Subtotal".
  const labeledRe = /(?:^|[^a-z])(?:total\s+(?:due|amount)?|amount\s+due|total)\s*[:\s]*\$\s?([0-9]+(?:\.[0-9]{1,2})?)/i;
  const looseRe = /\$\s?([0-9]+(?:\.[0-9]{1,2})?)/g;

  let amount: number | null = null;
  const labeled = body.match(labeledRe);
  if (labeled) {
    amount = parseFloat(labeled[1]);
  } else {
    let max = -1;
    for (const m of body.matchAll(looseRe)) {
      const v = parseFloat(m[1]);
      if (isFinite(v) && v > max) max = v;
    }
    if (max > 0) amount = max;
  }
  if (amount === null || !isFinite(amount) || amount <= 0) return null;

  let periodStart: string | null = null;
  let periodEnd: string | null = null;

  const isoPair = body.match(/(\d{4}-\d{2}-\d{2})\s*(?:to|-|–|—)\s*(\d{4}-\d{2}-\d{2})/);
  if (isoPair) {
    periodStart = isoPair[1];
    periodEnd = isoPair[2];
  } else {
    const longPair = body.match(
      /([A-Z][a-z]{2,8}\s+\d{1,2},\s*\d{4})\s*(?:to|-|–|—)\s*([A-Z][a-z]{2,8}\s+\d{1,2},\s*\d{4})/,
    );
    if (longPair) {
      const a = new Date(longPair[1]);
      const b = new Date(longPair[2]);
      if (!isNaN(a.getTime())) periodStart = a.toISOString().slice(0, 10);
      if (!isNaN(b.getTime())) periodEnd = b.toISOString().slice(0, 10);
    }
  }

  return { amount_usd: amount, period_start_iso: periodStart, period_end_iso: periodEnd };
}
