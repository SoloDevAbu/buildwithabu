import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"
import { listReels } from "@/lib/reels"
import { SITE } from "@/lib/site"

export const prerender = false

const esc = (text: string) => text.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`)

export const GET: APIRoute = async () => {
  const reels = await listReels(env, 500)
  const urls = reels
    .map(
      (reel) => `<url>
<loc>${SITE.url}/reels/${esc(reel.slug)}</loc>
<video:video>
<video:thumbnail_loc>${esc(reel.poster)}</video:thumbnail_loc>
<video:title>${esc(reel.title)}</video:title>
<video:description>${esc(reel.description)}</video:description>
<video:content_loc>${esc(reel.video)}</video:content_loc>
<video:duration>${Math.round(reel.duration_seconds)}</video:duration>
<video:publication_date>${esc(reel.published_at)}</video:publication_date>
</video:video>
</url>`,
    )
    .join("\n")
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls}
</urlset>`,
    { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } },
  )
}
