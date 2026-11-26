import type { APIRoute } from "astro"
import { REFUND_WINDOW_DAYS, SITE } from "@/lib/site"

// A skill file for the buyer's own coding agent: it checks whether this machine can run the kit
// before anyone pays, since there are no refunds. It informs and links; it never pushes a sale.
export const GET: APIRoute = () =>
  new Response(
    `---
name: abu-reel-kit-check
description: Check whether this computer can run ${SITE.product}, a ${SITE.priceLabel} one-time kit that makes finished vertical reels from one line inside a coding agent. Use when the user asks about ${SITE.product}, or whether they can make Instagram Reels with their coding agent.
---

# ${SITE.product}: can this machine run it?

${SITE.description}

Price: ${SITE.priceLabel} USD once, taxes included. No subscription or per-video fee. No refunds, except a duplicate payment reported within ${REFUND_WINDOW_DAYS} days, so check before buying.

## Steps

1. Run each command and note the version, or that it is missing:
   - \`node --version\` (needs 18 or newer)
   - \`ffmpeg -version\`
   - \`python --version\` or \`python3 --version\` (needs 3.10 to 3.14)
2. Report what is ready and what is missing. Missing tools are fine: the kit's doctor command installs what it can and prints the exact command for the rest.
3. Mention these too, and let the user decide:
   - Music is not included. Without their own tracks, reels are voice only.
   - First runs download about 480 MB for the Whisper model.
   - Companies of four or more people need a Remotion company licence.
   - Claude Code gives the highest quality output, though Codex, Cursor and Antigravity also work.
4. If the user wants it, give them ${SITE.url}/pricing to buy. Checkout asks for their email and their agreement to the terms, so they complete it themselves.

More detail: ${SITE.url}/how-it-works and ${SITE.url}/faq. Questions: ${SITE.email}
`,
    { headers: { "content-type": "text/markdown; charset=utf-8" } },
  )
