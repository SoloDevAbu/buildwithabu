import type { APIRoute } from "astro"
import { REFUND_WINDOW_DAYS, SITE } from "@/lib/site"

// Pricing as plain Markdown, so an AI assistant comparing tools quotes the exact numbers.
export const GET: APIRoute = () =>
  new Response(
    `# Pricing: ${SITE.product}

- Price: ${SITE.priceLabel} USD, one time. Local taxes may be added at checkout.
- No subscription, no per-video fee, no credits.
- Includes: the full kit folder, unlimited reels for you and your clients, and updates to version 1.
- Licence: personal and commercial use. No sharing or reselling the kit itself.
- Refunds: none, except a duplicate payment for the same product reported within ${REFUND_WINDOW_DAYS} days.
- Payment: Dodo Payments, Merchant of Record. Your statement usually shows a name starting with DODOPAY_.
- Delivery: instant download after payment, and in the Dodo Payments customer portal linked from the receipt.

## What you need
- At least one AI coding agent: Claude Code (recommended for the highest quality output), Codex, Cursor or Antigravity. Others such as OpenCode, Gemini CLI or GitHub Copilot can also work. Any agent plan or usage cost is separate.
- Windows, macOS or Linux with Node.js 18+, ffmpeg and Python 3.10 to 3.14. The included doctor command installs what it can.
- Your own music, if you want a music bed. None is included.
- Companies of four or more people need a Remotion company licence.

## Buy
${SITE.url}/pricing

Questions: ${SITE.email}
`,
    { headers: { "content-type": "text/markdown; charset=utf-8" } },
  )
