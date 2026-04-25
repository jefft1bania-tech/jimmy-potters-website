# Jimmy Potters Website

Next.js 14 + TypeScript + Tailwind + Supabase + Stripe storefront. Deployed to Vercel.

## Naming convention (Jeff shorthand)

| Phrase | Means | URL |
|---|---|---|
| **JP Vercel** | The Vercel dashboard for this project (deployments, analytics, env vars, settings) | https://vercel.com/jeffbanias-projects/website |
| **JP live** | The live customer-facing site | https://www.jimmypotters.com |

When Jeff says "open JP Vercel" → open the Vercel dashboard. When he says "open JP live" or "the normal Jimmy Potters website" → open the live storefront. Do not open both unless he says "Jimmy Potters website" (ambiguous — ask, or open both).

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
