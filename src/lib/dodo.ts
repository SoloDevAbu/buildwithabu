import DodoPayments from "dodopayments"
import { Webhook } from "standardwebhooks"
import { PRICE_MINOR, type PaymentFacts } from "@/lib/orders"
import { SITE } from "@/lib/site"

type DodoEnv = {
  DODO_PAYMENTS_API_KEY: string
  DODO_ENVIRONMENT: string
  DODO_PRODUCT_ID: string
  DODO_BRAND_ID: string
  DODO_ENTITLEMENT_ID: string
}

const dodo = (env: DodoEnv) =>
  new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    environment: env.DODO_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
  })

type ProductFacts = {
  brand_id: string
  price: { type: string; price?: number; currency?: string; discount?: number; discount_bps?: number; pay_what_you_want?: boolean; purchasing_power_parity?: boolean; tax_inclusive?: boolean | null }
  entitlements: { id: string }[]
}

/** Stops a checkout when the product in Dodo isn't the one we advertise, such as a wrong id at go-live. */
export const productProblem = (product: ProductFacts, env: Pick<DodoEnv, "DODO_BRAND_ID" | "DODO_ENTITLEMENT_ID">) => {
  const { price } = product
  if (product.brand_id !== env.DODO_BRAND_ID) return "wrong brand"
  if (price.type !== "one_time_price" || price.price !== PRICE_MINOR || price.currency !== SITE.currency) return "wrong price"
  if (price.tax_inclusive !== true) return "price is not tax inclusive"
  if (price.pay_what_you_want || price.purchasing_power_parity || price.discount || price.discount_bps) return "price can be lowered"
  if (!product.entitlements.some((e) => e.id === env.DODO_ENTITLEMENT_ID)) return "download not attached"
  return null
}

// The browser sends no price, product or quantity. All of it is decided here.
export const createCheckoutUrl = async (env: DodoEnv, origin: string, email: string, consentId: string) => {
  const client = dodo(env)
  const problem = productProblem((await client.products.retrieve(env.DODO_PRODUCT_ID)) as unknown as ProductFacts, env)
  if (problem) throw new Error(`Refusing checkout: ${problem}`)
  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: env.DODO_PRODUCT_ID, quantity: 1 }],
    customer: { email },
    return_url: `${origin}/success`,
    cancel_url: `${origin}/pricing`,
    metadata: { consent_id: consentId },
    feature_flags: { allow_discount_code: false, allow_customer_editing_email: false, redirect_immediately: true },
  })
  return session.checkout_url
}

export const getPayment = async (env: DodoEnv, paymentId: string) => (await dodo(env).payments.retrieve(paymentId)) as unknown as PaymentFacts

/** A fresh link to the file Dodo holds, which lasts about 15 minutes. Null until the grant is delivered. */
export const getDownloadUrl = async (env: DodoEnv, customerId: string, paymentId: string) => {
  for await (const grant of dodo(env).entitlements.grants.list(env.DODO_ENTITLEMENT_ID, { customer_id: customerId })) {
    if (grant.payment_id === paymentId && grant.status === "Delivered") return grant.digital_product_delivery?.files?.[0]?.download_url ?? null
  }
  return null
}

/** Throws on a bad signature or a timestamp outside the five minute window. */
export const verifyWebhook = (secret: string, rawBody: string, headers: Headers) =>
  new Webhook(secret).verify(rawBody, {
    "webhook-id": headers.get("webhook-id") ?? "",
    "webhook-signature": headers.get("webhook-signature") ?? "",
    "webhook-timestamp": headers.get("webhook-timestamp") ?? "",
  })
