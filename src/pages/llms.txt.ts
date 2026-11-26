import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { COMPARISONS } from "@/data/compare"
import { REFUND_WINDOW_DAYS, SITE } from "@/lib/site"

export const GET: APIRoute = async () => {
  const guides = await getCollection("guides")
  const body = `# ${SITE.product}

> ${SITE.description}

- Price: ${SITE.priceLabel} USD, one time, taxes included. No subscription and no per-video fee.
- Sold by ${SITE.seller} (${SITE.brand}), ${SITE.sellerCountry}, through Dodo Payments as Merchant of Record.
- Needs an AI coding agent (Claude Code recommended, or Codex, Cursor or Antigravity), Node.js 18+, ffmpeg and Python 3.10 to 3.14.
- Output: 1080 × 1920 video at 30 fps, under 60 seconds, plus caption, hashtags and sources.
- Refunds: none, except duplicate payments reported within ${REFUND_WINDOW_DAYS} days.
- Licence: unlimited reels including client work. No sharing or reselling the kit.

## Product
- [How it works](${SITE.url}/how-it-works): the seven stages
- [Pricing](${SITE.url}/pricing): price and requirements
- [Pricing in Markdown](${SITE.url}/pricing.md): the same facts as plain text
- [Agent skill](${SITE.url}/SKILL.md): lets your coding agent check this machine can run the kit
- [FAQ](${SITE.url}/faq)
- [Reels](${SITE.url}/reels): example output

## Guides
${guides.map((g) => `- [${g.data.title}](${SITE.url}/guides/${g.id}): ${g.data.description}`).join("\n")}

## Comparisons
${COMPARISONS.map((c) => `- [${c.heading}](${SITE.url}/compare/${c.slug})`).join("\n")}

## Policies
- [Terms](${SITE.url}/legal/terms)
- [Refund policy](${SITE.url}/legal/refunds)
- [Licence](${SITE.url}/legal/license)
- [Privacy](${SITE.url}/legal/privacy)
`
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } })
}
