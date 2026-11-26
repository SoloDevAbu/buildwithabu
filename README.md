# Abu Reel Kit

**AI reel maker for coding agents.** Type one line in Claude Code, OpenAI Codex, Cursor, Gemini CLI, Windsurf, or Antigravity, and Abu Reel Kit researches real sources, writes two scripts for your approval, voices the winner locally, syncs word-level Whisper captions, animates Remotion scenes, checks Instagram safe zones, and renders a finished `1080 × 1920` vertical reel on your machine.

- **Website:** [buildwithabu.xyz](https://buildwithabu.xyz)
- **Watch Demo Reels:** [buildwithabu.xyz/reels](https://buildwithabu.xyz/reels)
- **How It Works:** [buildwithabu.xyz/how-it-works](https://buildwithabu.xyz/how-it-works)
- **Pricing:** [$16 USD once](https://buildwithabu.xyz/pricing) (no subscription, no per-video fees, no API keys; commercial and client work included)
- **Guides:** [buildwithabu.xyz/guides](https://buildwithabu.xyz/guides)
- **For AI Agents:** [`llms.txt`](https://buildwithabu.xyz/llms.txt) · [`pricing.md`](https://buildwithabu.xyz/pricing.md) · [`SKILL.md`](https://buildwithabu.xyz/SKILL.md)

---

## About This Repository

This is the official storefront and showcase website for **Abu Reel Kit**, built with **Astro** on **Cloudflare Workers**, **Cloudflare D1**, **Cloudflare R2** (for demo reels, teasers, and posters), and **Dodo Payments** (Merchant of Record) for checkout and digital delivery.

Most marketing and guide pages are statically prerendered. Server-rendered Worker routes handle checkout, webhooks, order status, downloads, the `/reels` watch pages, video sitemaps, and the homepage reel wall.

## Run Locally

```bash
pnpm install
cp .dev.vars.example .dev.vars
pnpm db:local
pnpm dev
```

## Verify

```bash
pnpm test
pnpm typecheck
pnpm lint
```

To test a running build against tampering and security checks, run `node tests/e2e-local.mjs <url>`.

## Publish Content & Deploy

```bash
pnpm reel:add path/to/final.mp4 --title "..." --description "..."
pnpm kit:release path/to/kit.zip
pnpm og
pnpm run deploy
```

Price, handles, and policy dates live in [`src/lib/site.ts`](src/lib/site.ts). Deployment and launch steps are documented in [`docs/launch.md`](docs/launch.md).
