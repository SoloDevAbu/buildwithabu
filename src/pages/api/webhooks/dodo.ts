import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"
import { getPayment, verifyWebhook } from "@/lib/dodo"
import { applyDodoEvent } from "@/lib/orders"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  // Signature covers the exact bytes, so read text and parse only after it verifies.
  const raw = await request.text()
  let event: Parameters<typeof applyDodoEvent>[2]
  try {
    event = verifyWebhook(env.DODO_PAYMENTS_WEBHOOK_KEY, raw, request.headers) as typeof event
  } catch {
    return new Response("invalid signature", { status: 401 })
  }

  const webhookId = request.headers.get("webhook-id") ?? ""
  try {
    await applyDodoEvent(env.DB, webhookId, event, {
      sale: { productId: env.DODO_PRODUCT_ID, brandId: env.DODO_BRAND_ID },
      fetchPayment: (paymentId) => getPayment(env, paymentId),
    })
    return new Response("ok")
  } catch (error) {
    // A 5xx makes Dodo retry, which is what we want when the database or API blinks.
    console.error("webhook failed", webhookId, event.type, error)
    return new Response("retry", { status: 500 })
  }
}
