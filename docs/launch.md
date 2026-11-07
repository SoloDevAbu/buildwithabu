# Launch checklist

Run these in order. Commands are from the repo root.

## 1. Cloudflare

1. Buy `buildwithabu.xyz` and add it as a zone. Then run `pnpm exec wrangler login`.
2. Create the database and paste its id into `wrangler.jsonc`:

   ```bash
   pnpm exec wrangler d1 create buildwithabu
   ```

3. Create the buckets and apply the migration:

   ```bash
   pnpm exec wrangler r2 bucket create reel-kit-private
   pnpm exec wrangler r2 bucket create reels-public
   pnpm db:remote
   ```

4. Connect `reels-public` to `media.buildwithabu.xyz` under R2 > Settings > Custom Domains. Add a Cache Rule so `.mp4` files are cached. Leave `reel-kit-private` without public access.
5. Under Security > Bots, turn **off** "Block AI bots", or the GEO work does nothing.
6. Enable Web Analytics for the site in cookieless mode.
7. Enable Email Routing and forward `hello@buildwithabu.xyz` to your Gmail.
8. Redirect `www` to the bare domain.

## 2. Secrets

```bash
pnpm exec wrangler secret put DOWNLOAD_SIGNING_SECRET
pnpm exec wrangler secret put DODO_PAYMENTS_API_KEY
pnpm exec wrangler secret put DODO_PAYMENTS_WEBHOOK_KEY
```

Use a long random value for `DOWNLOAD_SIGNING_SECRET`. Changing it later kills existing download links.

## 3. Dodo Payments, test mode

1. Create a one-time **$16 USD** product and paste its id into `DODO_PRODUCT_ID` in `wrangler.jsonc`.
2. Add a Digital Files entitlement to the product, with the kit zip (100 MB limit per file) or an external link.
3. Add the webhook `https://buildwithabu.xyz/api/webhooks/dodo` for `payment.succeeded`, `refund.succeeded` and all `dispute.*` events. Save its key as `DODO_PAYMENTS_WEBHOOK_KEY`.
4. Set the statement descriptor in your business profile.
5. Deploy, make a test purchase, and check all of this:
   - `/success` shows the download.
   - The zip downloads.
   - **The delivery email arrives.** Dodo's docs don't confirm this for API-created checkouts. If it doesn't arrive, add Resend or Cloudflare Email Service.
   - Paying again with the same email is blocked.
   - A test refund closes the download.

## 4. Dodo verification

The live site must show pricing, terms, privacy, refund policy and a contact route, and all of these must match your Product Information form. The site already has them.

Ask Dodo these two things:

- What exact wording do they want for their reseller status? Terms clause 2.1 says "in a form agreed with Dodo Payments". Current wording is in `src/components/Footer.astro`.
- How do they handle EU/UK withdrawal requests, and does the "no refunds except duplicates" policy need any change? Their docs don't say.

Once approved, set `DODO_ENVIRONMENT` to `live_mode`, swap in the live product id and secrets, and redeploy.

## 5. Content

```bash
pnpm kit:release path/to/reel-studio-kit.zip --version 1.0.0
pnpm reel:add path/to/final.mp4 --title "..." --description "..." --transcript script.txt --sort 1
```

- Add at least five reels so the homepage has no empty slots.
- After adding them, open a reel in the browser and confirm that seeking works through `media.buildwithabu.xyz`.
- `/reels` stays `noindex` until the first reel exists.

## 6. Kit, before selling

- Replace the MIT `LICENSE` and the "free" wording in the README with the personal commercial licence.
- Package with `git archive`, so `inspiration/`, `out/` and `projects/` stay out.
- Remove references to the creators in the docs and source comments (`adilet`, `flx`), and review bundled example reels and third-party logos.
- Include third-party licence notices, which `/legal/license` says the kit lists.
- Email hi@remotion.dev to confirm selling a Remotion-based kit is fine.

## 7. After launch

- Submit `sitemap-index.xml` and `video-sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- Check the homepage and a reel page in Google's Rich Results Test.
- Have a lawyer read the legal pages if you can. They're well-drafted templates, not legal advice.
- Dodo's terms allow termination if refund or chargeback rates pass 0.5% of monthly orders, so watch disputes.
- Bump the dates in `POLICY` in `src/lib/site.ts` whenever a legal page changes.
