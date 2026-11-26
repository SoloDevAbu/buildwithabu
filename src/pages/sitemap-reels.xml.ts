import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"
import { listReels } from "@/lib/reels"
import { SITE } from "@/lib/site"

export const prerender = false

// /reels is noindex until the first reel exists, so it only joins the sitemap after that.
const esc = (text: string) => text.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`)

export const GET: APIRoute = async () => {
  const reels = await listReels(env, 500)
  const latest = reels.reduce((max, r) => (r.published_at > max ? r.published_at : max), "")
  const urls =
    reels.length === 0
      ? []
      : [
          { loc: `${SITE.url}/reels`, lastmod: latest },
          ...reels.map((reel) => ({ loc: `${SITE.url}/reels/${encodeURIComponent(reel.slug)}`, lastmod: reel.published_at })),
        ]
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ loc, lastmod }) => `<url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${esc(lastmod)}</lastmod>` : ""}</url>`).join("\n")}
</urlset>`,
    { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } },
  )
}
