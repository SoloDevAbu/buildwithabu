import DodoPayments from "dodopayments"
import { Webhook } from "standardwebhooks"

type DodoEnv = {
  DODO_PAYMENTS_API_KEY: string
  DODO_ENVIRONMENT: string
  DODO_PRODUCT_ID: string
}

export const createCheckoutUrl = async (env: DodoEnv, origin: string, email: string, consentId: string) => {
  const client = new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    environment: env.DODO_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
  })
  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: env.DODO_PRODUCT_ID, quantity: 1 }],
    customer: { email },
    return_url: `${origin}/success`,
    cancel_url: `${origin}/pricing`,
    metadata: { consent_id: consentId },
  })
  return session.checkout_url
}

/** Throws on a bad signature or a timestamp outside the five minute window. */
export const verifyWebhook = (secret: string, rawBody: string, headers: Headers) =>
  new Webhook(secret).verify(rawBody, {
    "webhook-id": headers.get("webhook-id") ?? "",
    "webhook-signature": headers.get("webhook-signature") ?? "",
    "webhook-timestamp": headers.get("webhook-timestamp") ?? "",
  })
