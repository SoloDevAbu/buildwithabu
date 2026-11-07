# Build with Abu

The store for Reel Studio Kit. Astro on Cloudflare Workers, with D1, R2 for reels, and Dodo Payments for checkout and delivery.

Most pages are static. These run on the Worker: checkout, webhook, order status, downloads, the reels pages and the homepage reel wall.

## Run it

```bash
pnpm install
cp .dev.vars.example .dev.vars
pnpm db:local
pnpm dev
```

## Check it

```bash
pnpm test
pnpm typecheck
pnpm lint
```

To attack a running build the way a stranger would, use `node tests/e2e-local.mjs <url>`.

## Publish content

```bash
pnpm reel:add path/to/final.mp4 --title "..." --description "..."
pnpm kit:release path/to/kit.zip
pnpm og
```

Price, handles and policy dates live in `src/lib/site.ts`. Launch steps are in [docs/launch.md](docs/launch.md).
