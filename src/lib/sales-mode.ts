/**
 * Sales mode feature flag.
 *
 * When `NEXT_PUBLIC_SALES_ENABLED` is the string `'true'`, the site behaves normally
 * (Add-to-Cart works, /checkout renders the Stripe form, checkout API routes accept requests).
 *
 * When it is anything else (or missing) — including the literal string `'false'` — the site
 * is in preview mode: visitors can browse freely, but they cannot add to cart OR complete
 * checkout. Wholesale application, auth, newsletter, and admin are NOT gated.
 *
 * Default: disabled (safer).
 *
 * Because this is prefixed with NEXT_PUBLIC_ it is inlined into the client bundle at build
 * time AND is readable server-side via `process.env.NEXT_PUBLIC_SALES_ENABLED`.
 *
 * To flip sales back ON:
 *   vercel env rm NEXT_PUBLIC_SALES_ENABLED production
 *   vercel env add NEXT_PUBLIC_SALES_ENABLED production  # enter: true
 *   vercel --prod --yes
 */
export const salesEnabled: boolean =
  process.env.NEXT_PUBLIC_SALES_ENABLED === 'true';
