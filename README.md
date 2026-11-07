# Build with Abu

The store for Reel Studio Kit. Astro on Cloudflare Workers, with D1, R2 and Dodo Payments.

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

For a full purchase run against the production build, start `pnpm build` and `wrangler dev`, then use `node tests/e2e-local.mjs`.

## Publish content

```bash
pnpm reel:add path/to/final.mp4 --title "..." --description "..."
pnpm kit:release path/to/kit.zip --version 1.0.0
pnpm og
```

Price, handles and policy dates live in `src/lib/site.ts`. Launch steps are in [docs/launch.md](docs/launch.md).
