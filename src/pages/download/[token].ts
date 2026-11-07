import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"
import { MAX_DOWNLOADS_PER_DAY, downloadsToday, getOrder, latestRelease, logDownload, verifyDownload } from "@/lib/orders"
import { SITE } from "@/lib/site"

export const prerender = false

const text = (status: number, body: string) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex", "cache-control": "no-store" } })

export const GET: APIRoute = async ({ params }) => {
  const paymentId = await verifyDownload(params.token ?? "", env.DOWNLOAD_SIGNING_SECRET)
  if (!paymentId) return text(404, "This download link is not valid.")

  const order = await getOrder(env.DB, paymentId)
  if (!order || order.status !== "paid") return text(403, `This order has no active download. Questions? ${SITE.email}`)

  if ((await downloadsToday(env.DB, paymentId)) >= MAX_DOWNLOADS_PER_DAY)
    return text(429, `Too many downloads today. Try again tomorrow, or write to ${SITE.email}.`)

  const release = await latestRelease(env.DB)
  const object = release && (await env.KIT.get(release.r2_key))
  if (!release || !object) {
    console.error("kit release missing", release?.r2_key)
    return text(503, `The download is briefly unavailable. Write to ${SITE.email} and we will send it.`)
  }

  await logDownload(env.DB, paymentId, release.version)
  return new Response(object.body as unknown as BodyInit, {
    headers: {
      "content-type": "application/zip",
      "content-length": String(object.size),
      "content-disposition": `attachment; filename="reel-studio-kit-${release.version}.zip"`,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
    },
  })
}
