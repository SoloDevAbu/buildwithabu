// @ts-check
import cloudflare from "@astrojs/cloudflare"
import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

const NOINDEX = ["/success", "/download", "/api"]

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
      customPages: ["https://buildwithabu.xyz/reels"],
    }),
  ],
})
