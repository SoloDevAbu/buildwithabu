import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"
import { PASS_COOKIE, canDownload, downloadClosesAt } from "@/lib/delivery"
import { getPayment } from "@/lib/dodo"
import { PAYMENT_ID, confirmPayment, getOrder, type Order } from "@/lib/orders"

export const prerender = false

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } })

const describe = async (order: Order, pass: string | undefined) => {
  if (order.status !== "paid") return { state: "blocked" }
  if (!(await canDownload(order, pass))) return { state: "elsewhere" }
  return {
    state: "ready",
    downloadUrl: `/download/${order.payment_id}`,
    closesAt: downloadClosesAt(order).toISOString(),
    duplicate: order.is_duplicate === 1,
  }
}

// The redirect from Dodo proves nothing, and neither does this URL. Access needs an order built from
// the payment as Dodo reports it, plus the cookie of the browser that paid. Asking Dodo here covers a
// slow or missed webhook.
export const GET: APIRoute = async ({ url, clientAddress, cookies }) => {
  const limit = await env.STATUS_LIMIT?.limit({ key: clientAddress })
  if (limit && !limit.success) return json({ state: "pending" }, 429)

  const paymentId = url.searchParams.get("payment_id") ?? ""
  if (!PAYMENT_ID.test(paymentId)) return json({ state: "failed" })

  const pass = cookies.get(PASS_COOKIE)?.value
  const order = await getOrder(env.DB, paymentId)
  if (order) return json(await describe(order, pass))

  try {
    const payment = await getPayment(env, paymentId)
    const verdict = await confirmPayment(env.DB, payment, { productId: env.DODO_PRODUCT_ID, brandId: env.DODO_BRAND_ID })
    if (verdict === "pending") return json({ state: "pending" })
    if (verdict === "failed" || verdict === "foreign") return json({ state: "failed" })
    const saved = await getOrder(env.DB, paymentId)
    return json(saved ? await describe(saved, pass) : { state: "pending" })
  } catch (error) {
    if ((error as { status?: number }).status === 404) return json({ state: "failed" })
    console.error("order status failed", paymentId, error)
    return json({ state: "pending" })
  }
}
