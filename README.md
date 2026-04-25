# Jimmy Potters Storefront (Vercel-hosted)

Next.js 14 + TypeScript + Tailwind + Supabase + Stripe storefront. Deployed to Vercel.

## Scope rule (Jeff, 2026-04-25)

**This codebase IS the only "Jimmy Potters" we work on.** When Jeff says "Jimmy Potters",
"JP", "the JP site", "the storefront", or "the website" he always means **this** Next.js
app, deployed at https://website-three-omega-62.vercel.app.

| Phrase | Means | URL |
|---|---|---|
| **JP / JP storefront / the JP site** | This repo's Vercel deployment | https://website-three-omega-62.vercel.app |
| **JP Vercel** (dashboard) | The Vercel control panel for this project | https://vercel.com/jeffbanias-projects/website |

**Out of scope — do NOT touch or reference:**

- `jimmypotters.com` / `www.jimmypotters.com` — a separate Squarespace site on GoDaddy
  DNS, **not under Jeff's control**. Do not pull content, branding, products, pricing, or
  page structure from it into this codebase. Do not propose DNS changes there. Do not use
  GoDaddy in any plan or recommendation.
- Until Jeff registers a domain HE controls and tells us to attach it, the storefront
  stays on `*.vercel.app` URLs only.

## Vercel project

- Team: `jeffbanias-projects`
- Project: `website`
- Project ID: `prj_4f3KiCEUQR9pXZqLFq9jey1lYKZz`

## Deploy

Push to submodule does NOT auto-deploy. Always run `vercel --prod --yes` from this folder after push.

## Local dev

Node v24 crashes Next.js 14. Use:
```
NODE_OPTIONS="--max-old-space-size=8192 --max-semi-space-size=256" npm run dev
```

See [../CLAUDE.md](../CLAUDE.md) for full project context (preview mode, Stripe test prices, Supabase project ID).
