// Tells Bing, Yandex and other IndexNow engines that pages changed, so they recrawl within hours.
// Run after a deploy, once the site is live on its domain:
//
//   pnpm indexnow            every URL in the sitemaps
//   pnpm indexnow /pricing   only the paths you name
import { readFileSync } from "node:fs"

const site = readFileSync("src/lib/site.ts", "utf8").match(/url: "([^"]+)"/)[1]
const key = readFileSync("src/lib/site.ts", "utf8").match(/indexNowKey: "([^"]+)"/)[1]
const host = new URL(site).host

const locs = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} answered ${res.status}. Is the site live on ${host}?`)
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
}

let urls = process.argv.slice(2).map((path) => new URL(path, site).href)
if (urls.length === 0) {
  const sitemaps = await locs(`${site}/sitemap.xml`)
  urls = (await Promise.all(sitemaps.map(locs))).flat()
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation: `${site}/${key}.txt`, urlList: urls }),
})
// 200 and 202 both mean accepted. 403 means the key file isn't reachable on the live domain yet.
console.log(`IndexNow answered ${res.status} for ${urls.length} URLs`)
if (res.status >= 300) process.exit(1)
