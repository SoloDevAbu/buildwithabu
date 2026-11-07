import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"
import { getOrder, signDownload } from "@/lib/orders"

export const prerender = false

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { "content-type": "application/json", "cache-control": "no-store" } })

// The redirect from Dodo proves nothing. Only an order written by the signed webhook unlocks this.
export const GET: APIRoute = async ({ url }) => {
  const paymentId = url.searchParams.get("payment_id")
  if (!paymentId) return json({ state: "failed" })
  const order = await getOrder(env.DB, paymentId)
  if (!order) return json({ state: "pending" })
  if (order.status !== "paid") return json({ state: "blocked" })
  const token = await signDownload(paymentId, env.DOWNLOAD_SIGNING_SECRET)
  return json({ state: "ready", downloadUrl: `/download/${token}`, duplicate: order.is_duplicate === 1 })
}
