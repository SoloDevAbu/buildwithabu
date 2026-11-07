import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"
import { PASS_COOKIE, canDownload, invalidLink, redirectToKit } from "@/lib/delivery"
import { PAYMENT_ID, getOrder } from "@/lib/orders"

export const prerender = false

export const GET: APIRoute = async ({ params, cookies }) => {
  const paymentId = params.paymentId ?? ""
  if (!PAYMENT_ID.test(paymentId)) return invalidLink()
  const order = await getOrder(env.DB, paymentId)
  if (!order) return invalidLink()

  // Anyone else holding this link lands on the page that explains where the kit really is.
  if (order.status === "paid" && !(await canDownload(order, cookies.get(PASS_COOKIE)?.value)))
    return new Response(null, { status: 303, headers: { location: `/success?payment_id=${paymentId}`, "cache-control": "no-store" } })

  return redirectToKit(env, order)
}
