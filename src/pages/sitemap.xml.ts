import type { APIRoute } from "astro"
import { SITE } from "@/lib/site"

// The address most tools try first. It lists the page, reel and video sitemaps together.
export const GET: APIRoute = () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${["sitemap-0.xml", "sitemap-reels.xml", "video-sitemap.xml"].map((file) => `<sitemap><loc>${SITE.url}/${file}</loc></sitemap>`).join("\n")}
</sitemapindex>`,
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  )
