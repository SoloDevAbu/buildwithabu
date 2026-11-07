import rss from "@astrojs/rss"
import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { SITE } from "@/lib/site"

export const GET: APIRoute = async () => {
  const guides = (await getCollection("guides")).sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
  return rss({
    title: `${SITE.brand} guides`,
    description: "Practical guides on making vertical video with AI coding agents.",
    site: SITE.url,
    items: guides.map((guide) => ({
      title: guide.data.title,
      description: guide.data.description,
      pubDate: guide.data.date,
      link: `/guides/${guide.id}`,
    })),
  })
}
