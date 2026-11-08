import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"
import { listReels } from "@/lib/reels"
import { SITE } from "@/lib/site"

export const prerender = false

// /reels is noindex until the first reel exists, so it only joins the sitemap after that.
export const GET: APIRoute = async () => {
  const reels = await listReels(env, 500)
  const urls = reels.length === 0 ? [] : [`${SITE.url}/reels`, ...reels.map((reel) => `${SITE.url}/reels/${encodeURIComponent(reel.slug)}`)]
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `<url><loc>${loc}</loc></url>`).join("\n")}
</urlset>`,
    { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } },
  )
}
