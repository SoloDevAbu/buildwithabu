# Launch checklist

Run these in order. Commands are from the repo root.

Test mode is already set up on `https://buildwithabu.abubakkar2502.workers.dev`, with the D1 database, the `reels-public` bucket and a Dodo test brand, product and placeholder zip. This list covers what's left to go live.

## How selling works

- **The zip lives in Dodo**, as a Digital Files entitlement on the product. Dodo keeps it in the buyer's Customer Portal and revokes it on refund. Dodo's receipt only links to the portal.
- **Buyers get the kit in two places.** The success page has a download for the browser that paid, for one hour after payment. `/api/checkout` sets the `kit_pass` cookie and keeps only its hash, so a shared link does nothing elsewhere. After that, Dodo's receipt links to the portal, and the success page explains the steps.
- **The price lives in Dodo.** The browser sends only an email and consent. The Worker picks the product and refuses checkout if that product isn't a fixed $16 with the download attached.
- **An order is only created from Dodo's API.** A signed webhook or a return to `/success` just prompts the Worker to fetch the payment and check its brand, product, quantity, amount, discount, refund state and consent.
- **Your Dodo account has other brands, and a webhook receives all of their events.** Those payments are ignored because their brand and product don't match.
- Orders that are ours but look wrong get the status `review` and no download from the site. Find them with:

  ```bash
  pnpm exec wrangler d1 execute buildwithabu --remote --command "SELECT payment_id, email, total_amount FROM orders WHERE status = 'review'"
  ```

  Dodo may still have emailed the file, because it delivers on every paid order for the product. Check the order, then refund it in Dodo if needed.

## 1. Domain and Cloudflare

1. Buy `buildwithabu.xyz` and add it as a zone.
2. Add it as a custom domain on the `buildwithabu` Worker.
3. Connect `reels-public` to `media.buildwithabu.xyz` under R2 > Settings > Custom Domains. Add a Cache Rule so `.mp4` files are cached.
4. Under Security > Bots, turn **off** "Block AI bots", or the GEO work does nothing.
5. Enable Web Analytics for the site in cookieless mode.
6. Enable Email Routing and forward `hello@buildwithabu.xyz` to your Gmail.
7. Redirect `www` to the bare domain.

## 2. Dodo verification

The live site must show pricing, terms, privacy, refund policy and a contact route, and all of these must match your Product Information form. The site already has them.

Ask Dodo these two things:

- What exact wording do they want for their reseller status? Terms clause 2.1 says "in a form agreed with Dodo Payments". Current wording is in `src/components/Footer.astro`.
- How do they handle EU/UK withdrawal requests, and does the "no refunds except duplicates" policy need any change?

## 3. Kit, before selling

- Replace the MIT `LICENSE` and the "free" wording in the README with the personal commercial licence.
- Package with `git archive`, so `inspiration/`, `out/` and `projects/` stay out.
- Remove references to the creators in the docs and source comments (`adilet`, `flx`), and review bundled example reels and third-party logos.
- Include third-party licence notices, which `/legal/license` says the kit lists.
- Email hi@remotion.dev to confirm selling a Remotion-based kit is fine.
- Keep the zip under 100 MB. The current kit is about 72 MB. Dodo's docs give 100 MB per file, though their API reference says 500 MiB.

## 4. Switch Dodo to live

Test and live are separate in Dodo, so everything is created again.

1. In live mode, create the same three things:
   - A brand, **Build with Abu**
   - A Digital Files entitlement
   - A one-time product at **$16 USD**, tax exclusive, with pay-what-you-want and parity pricing off, in that brand, with the entitlement attached
2. Upload the real kit:

   ```bash
   pnpm kit:release path/to/reel-studio-kit.zip --live --entitlement ent_YOUR_LIVE_ID
   ```

   This needs a live key in `DODO_PAYMENTS_API_KEY` for that one command.

3. In `wrangler.jsonc`, set `DODO_ENVIRONMENT` to `live_mode`, plus the live `DODO_PRODUCT_ID`, `DODO_BRAND_ID` and `DODO_ENTITLEMENT_ID`.
4. Create a live webhook at `https://buildwithabu.xyz/api/webhooks/dodo` for `payment.succeeded`, `refund.succeeded` and all `dispute.*` events.
5. Create a live API key with these permissions: `products:read`, `checkout_sessions:write`, `payments:read` and `entitlements:read`. Then replace both secrets with live values:

   ```bash
   pnpm exec wrangler secret put DODO_PAYMENTS_API_KEY
   ```

   ```bash
   pnpm exec wrangler secret put DODO_PAYMENTS_WEBHOOK_KEY
   ```

6. Clear test purchases, or test emails will count as owners:

   ```bash
   pnpm exec wrangler d1 execute buildwithabu --remote --command "DELETE FROM downloads; DELETE FROM orders; DELETE FROM consents; DELETE FROM webhook_events;"
   ```

7. Deploy, make one real purchase with your own card, refund it in Dodo, and clear that order the same way.

If any id or the price is wrong, checkout shows "unavailable" and `wrangler tail` logs `Refusing checkout: <reason>`. No one can be charged the wrong amount.

## 5. Content

```bash
pnpm reel:add path/to/final.mp4 --title "..." --description "..." --transcript script.txt --sort 1
```

- Add at least five reels so the homepage has no empty slots.
- After adding them, open a reel in the browser and confirm that seeking works through `media.buildwithabu.xyz`.
- `/reels` stays `noindex` until the first reel exists.
- Replace the kit later with `pnpm kit:release`. It uploads the new zip before removing the old one.

## 6. After launch

- Submit `sitemap-index.xml` and `video-sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- Check the homepage and a reel page in Google's Rich Results Test.
- Have a lawyer read the legal pages if you can. They're well-drafted templates, not legal advice.
- Dodo's terms allow termination if refund or chargeback rates pass 0.5% of monthly orders, so watch disputes.
- Dodo revokes the download on refund, but its docs don't list disputes. The site closes its own download on a dispute. Revoke the grant in Dodo too if you want to close the portal link.
- The portal shows your Dodo business name, currently OutrankBid, and the success page says so. If you rename the business, update that line in `src/islands/SuccessPanel.tsx`.
- Bump the dates in `POLICY` in `src/lib/site.ts` whenever a legal page changes.
