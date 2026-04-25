# Jimmy Potters Website

Next.js 14 + TypeScript + Tailwind + Supabase + Stripe storefront. Deployed to Vercel.

## Naming convention (Jeff shorthand)

| Phrase | Means | URL |
|---|---|---|
| **JP Vercel** (dashboard) | Vercel dashboard for this project — deployments, analytics, env vars | https://vercel.com/jeffbanias-projects/website |
| **JP Vercel site** / **JP storefront** | The live Next.js e-commerce app (this codebase) — currently only on Vercel domains | https://website-three-omega-62.vercel.app |
| **JP Squarespace** | Jeff's OLD studio/after-school classes site on Squarespace — completely separate, not in this repo | https://www.jimmypotters.com |

**Critical DNS fact (verified 2026-04-25):** `www.jimmypotters.com` and the apex `jimmypotters.com` both serve the **Squarespace** Studio & Workshop site (after-school classes, summer camp). This Next.js storefront is **only** reachable via the `*.vercel.app` URLs — the apex/www DNS has never been pointed at Vercel. Login, /admin, /account, /shop all live at `website-three-omega-62.vercel.app`, NOT at `www.jimmypotters.com`. To go live on the real domain, the DNS records would need to be moved to Vercel (and Squarespace's Studio & Workshop site decommissioned or moved to a subdomain).

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
