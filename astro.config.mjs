// @ts-check
import cloudflare from "@astrojs/cloudflare"
import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import { readFileSync, readdirSync } from "node:fs"

// /reels is listed by sitemap-reels.xml instead, which leaves it out while it is still noindex.
const NOINDEX = ["/success", "/download", "/api", "/reels"]

// Real last-changed dates, so search engines can trust lastmod: guides from their front matter,
// legal pages from the policy dates. Other pages leave it out rather than guess.
const LASTMOD = Object.fromEntries([
  ...readdirSync("src/content/guides").map((file) => {
    const front = readFileSync(`src/content/guides/${file}`, "utf8")
    const date = front.match(/^updated: (\S+)/m)?.[1] ?? front.match(/^date: (\S+)/m)?.[1]
    return [`/guides/${file.replace(/\.mdx$/, "")}`, date]
  }),
  ...[...readFileSync("src/lib/site.ts", "utf8").matchAll(/^  (terms|refund|license|privacy|cookies): "([\d-]+)"/gm)].map(([, page, date]) => [
    `/legal/${page === "refund" ? "refunds" : page}`,
    date,
  ]),
])

// https://astro.build/config
export default defineConfig({
  site: "https://buildwithabu.xyz",
  trailingSlash: "never",
  build: { format: "file" },
  output: "static",
  adapter: cloudflare({ imageService: "compile" }),
  session: false,
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => !NOINDEX.some((p) => new URL(page).pathname.startsWith(p)),
      serialize: (item) => {
        const date = LASTMOD[new URL(item.url).pathname]
        return date ? { ...item, lastmod: new Date(date).toISOString() } : item
      },
    }),
  ],
})
