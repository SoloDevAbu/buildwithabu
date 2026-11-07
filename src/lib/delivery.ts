// The zip lives in Dodo, and Dodo's receipt reaches it through the customer portal. The download on
// this site is a short window for the browser that paid, so a copied link gives nobody the kit.
import { getDownloadUrl } from "@/lib/dodo"
import { MAX_DOWNLOADS_PER_DAY, downloadsToday, logDownload, type Order } from "@/lib/orders"
import { SITE } from "@/lib/site"

export const PASS_COOKIE = "kit_pass"
/** Outlives a slow checkout. The hour that matters is counted from the order, on the server. */
export const PASS_MAX_AGE = 86_400
const DOWNLOAD_WINDOW_MS = 3_600_000

const toHex = (bytes: ArrayBuffer | Uint8Array) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("")

export const newPass = () => toHex(crypto.getRandomValues(new Uint8Array(32)))

export const isPass = (value: string | undefined): value is string => /^[0-9a-f]{64}$/.test(value ?? "")

export const hashToken = async (token: string) => toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))

export const downloadClosesAt = (order: Pick<Order, "created_at">) => new Date(Date.parse(order.created_at) + DOWNLOAD_WINDOW_MS)

/** True only for the browser that started this checkout, within the hour after payment. */
export const canDownload = async (order: Pick<Order, "created_at" | "browser_hash">, pass: string | undefined, at = Date.now()) => {
  if (!order.browser_hash || !isPass(pass) || at >= downloadClosesAt(order).getTime()) return false
  return (await hashToken(pass)) === order.browser_hash
}

const text = (status: number, body: string) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex", "cache-control": "no-store" } })

type DownloadEnv = Parameters<typeof getDownloadUrl>[0] & { DB: D1Database }

/** Dodo holds the file, so this only hands over a short-lived link to it. */
export const redirectToKit = async (env: DownloadEnv, order: Order) => {
  if (order.status !== "paid") return text(403, `This order has no active download. Questions? ${SITE.email}`)
  if ((await downloadsToday(env.DB, order.payment_id)) >= MAX_DOWNLOADS_PER_DAY)
    return text(429, `Too many downloads today. Try again tomorrow, or write to ${SITE.email}.`)

  const url = await getDownloadUrl(env, order.customer_id, order.payment_id).catch((error) => {
    console.error("download lookup failed", order.payment_id, error)
    return null
  })
  if (!url) return text(503, "Your download is still being prepared. Try again in a minute.")

  await logDownload(env.DB, order.payment_id)
  return new Response(null, { status: 302, headers: { location: url, "cache-control": "no-store", "x-robots-tag": "noindex", "referrer-policy": "no-referrer" } })
}

export const invalidLink = () => text(404, "This download link is not valid.")
