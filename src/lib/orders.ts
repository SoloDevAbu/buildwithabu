// Everything that touches money state. Takes the database as an argument, so tests can run it
// against real SQL with the real migration.
import { POLICY, SITE } from "@/lib/site"

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const isValidEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const now = () => new Date().toISOString()

/** True when this email already bought the kit and still holds it. */
export const hasPaidOrder = async (db: D1Database, email: string) => {
  const row = await db
    .prepare("SELECT 1 AS found FROM orders WHERE email = ? AND status = 'paid' LIMIT 1")
    .bind(normalizeEmail(email))
    .first()
  return row !== null
}

export const recordConsent = async (db: D1Database, email: string, browserHash: string) => {
  const id = crypto.randomUUID()
  await db
    .prepare(
      "INSERT INTO consents (id, email, terms_version, refund_version, license_version, withdrawal_waiver, created_at, browser_hash) VALUES (?, ?, ?, ?, ?, 1, ?, ?)",
    )
    .bind(id, normalizeEmail(email), POLICY.terms, POLICY.refund, POLICY.license, now(), browserHash)
    .run()
  return id
}

/** What the server expects a sale to look like. Never read from the browser. */
export type SaleConfig = { productId: string; brandId: string }

export const PRICE_MINOR = SITE.price * 100

/** The fields we rely on, as returned by Dodo's API. Webhook bodies are not trusted for these. */
export type PaymentFacts = {
  payment_id: string
  status?: string | null
  brand_id: string
  total_amount: number
  currency: string
  settlement_amount: number
  settlement_currency: string
  discount_id?: string | null
  refund_status?: string | null
  product_cart?: { product_id: string; quantity: number }[] | null
  metadata: Record<string, string>
  customer: { customer_id: string; email: string }
}

export type Verdict = "paid" | "pending" | "failed" | "foreign" | "review"

const STILL_OPEN = new Set(["processing", "requires_customer_action", "requires_merchant_action", "requires_payment_method", "requires_confirmation", "requires_capture"])

/** `foreign` is someone else's sale on this Dodo account. `review` is ours, but something is off. */
export const judgePayment = (p: PaymentFacts, sale: SaleConfig): { verdict: Verdict; reason?: string } => {
  const cart = p.product_cart ?? []
  if (p.brand_id !== sale.brandId || !cart.some((item) => item.product_id === sale.productId)) return { verdict: "foreign" }
  if (p.status !== "succeeded") return { verdict: STILL_OPEN.has(p.status ?? "") ? "pending" : "failed" }
  if (cart.length !== 1 || cart[0].quantity !== 1) return { verdict: "review", reason: "cart is not one kit" }
  if (p.discount_id) return { verdict: "review", reason: "discounted" }
  if (p.refund_status) return { verdict: "review", reason: "already refunded" }
  if (p.total_amount <= 0) return { verdict: "review", reason: "nothing was charged" }
  // Dodo charges in the buyer's currency, so compare in USD whenever one side of the payment is USD.
  const usd = p.settlement_currency === SITE.currency ? p.settlement_amount : p.currency === SITE.currency ? p.total_amount : null
  if (usd !== null && usd < PRICE_MINOR) return { verdict: "review", reason: `underpaid: ${usd}` }
  return { verdict: "paid" }
}

const consentMatches = async (db: D1Database, id: string | undefined, email: string) =>
  !!id && (await db.prepare("SELECT 1 AS found FROM consents WHERE id = ? AND email = ?").bind(id, normalizeEmail(email)).first()) !== null

/** Idempotent per payment. A second paid order on one email is flagged, never refunded by code. */
const recordPayment = async (db: D1Database, p: PaymentFacts, status: "paid" | "review") => {
  const email = normalizeEmail(p.customer.email)
  const earlier = await db
    .prepare("SELECT 1 AS found FROM orders WHERE email = ? AND status = 'paid' AND payment_id != ? LIMIT 1")
    .bind(email, p.payment_id)
    .first()
  const at = now()
  await db
    .prepare(
      `INSERT INTO orders (payment_id, customer_id, email, status, total_amount, currency, consent_id, is_duplicate, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(payment_id) DO NOTHING`,
    )
    .bind(p.payment_id, p.customer.customer_id, email, status, p.total_amount, p.currency, p.metadata.consent_id ?? null, earlier ? 1 : 0, at, at)
    .run()
}

/** The only way an order gets created: from a payment fetched from Dodo, never from what a caller says. */
export const confirmPayment = async (db: D1Database, payment: PaymentFacts, sale: SaleConfig): Promise<Verdict> => {
  let { verdict, reason } = judgePayment(payment, sale)
  if (verdict === "paid" && !(await consentMatches(db, payment.metadata.consent_id, payment.customer.email))) {
    verdict = "review"
    reason = "no matching consent, so it did not come through our checkout"
  }
  if (verdict === "paid" || verdict === "review") await recordPayment(db, payment, verdict)
  if (verdict === "review") console.error("payment needs review", payment.payment_id, reason)
  return verdict
}

export type OrderStatus = "paid" | "review" | "refunded" | "disputed" | "chargeback"

export const setOrderStatus = async (db: D1Database, paymentId: string, status: OrderStatus) => {
  await db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE payment_id = ?").bind(status, now(), paymentId).run()
}

export type Order = {
  payment_id: string
  customer_id: string
  email: string
  status: OrderStatus
  is_duplicate: number
  created_at: string
  browser_hash: string | null
}

export const getOrder = (db: D1Database, paymentId: string) =>
  db
    .prepare(
      `SELECT o.payment_id, o.customer_id, o.email, o.status, o.is_duplicate, o.created_at, c.browser_hash
       FROM orders o LEFT JOIN consents c ON c.id = o.consent_id WHERE o.payment_id = ?`,
    )
    .bind(paymentId)
    .first<Order>()

export const webhookSeen = async (db: D1Database, id: string) =>
  (await db.prepare("SELECT 1 AS found FROM webhook_events WHERE webhook_id = ?").bind(id).first()) !== null

export const markWebhookSeen = async (db: D1Database, id: string, type: string) => {
  await db.prepare("INSERT OR IGNORE INTO webhook_events (webhook_id, type, received_at) VALUES (?, ?, ?)").bind(id, type, now()).run()
}

type DodoEvent = { type: string; data: { payment_id?: string; brand_id?: string } }
type EventDeps = {
  sale: SaleConfig
  fetchPayment: (paymentId: string) => Promise<PaymentFacts>
}

/**
 * Dodo sends every event on the account here, including other brands' sales. A signed event only
 * says something happened, so the payment itself is fetched before anything is granted.
 * The event is marked seen only after it is applied. A crash in between gets retried by Dodo, and
 * every handler below is safe to run twice.
 */
export const applyDodoEvent = async (db: D1Database, webhookId: string, event: DodoEvent, deps: EventDeps) => {
  if (await webhookSeen(db, webhookId)) return "duplicate-delivery"
  const { type, data } = event
  const paymentId = data.payment_id
  if (paymentId) {
    if (type === "payment.succeeded") {
      if (!data.brand_id || data.brand_id === deps.sale.brandId) {
        await confirmPayment(db, await deps.fetchPayment(paymentId), deps.sale)
      }
    } else if (type === "refund.succeeded") {
      await setOrderStatus(db, paymentId, "refunded")
    } else if (type === "dispute.opened") {
      await setOrderStatus(db, paymentId, "disputed")
    } else if (type === "dispute.won" || type === "dispute.cancelled" || type === "dispute.expired") {
      await db.prepare("UPDATE orders SET status = 'paid', updated_at = ? WHERE payment_id = ? AND status = 'disputed'").bind(now(), paymentId).run()
    } else if (type === "dispute.lost" || type === "dispute.accepted") {
      await setOrderStatus(db, paymentId, "chargeback")
    }
  }
  await markWebhookSeen(db, webhookId, type)
  return "applied"
}

// ── Download limits ─────────────────────────────────────────────────────────────────────────
export const PAYMENT_ID = /^pay_[A-Za-z0-9]{10,64}$/

export const MAX_DOWNLOADS_PER_DAY = 20

export const downloadsToday = async (db: D1Database, paymentId: string) => {
  const since = new Date(Date.now() - 86_400_000).toISOString()
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM downloads WHERE payment_id = ? AND created_at > ?")
    .bind(paymentId, since)
    .first<{ n: number }>()
  return row?.n ?? 0
}

export const logDownload = async (db: D1Database, paymentId: string) => {
  await db.prepare("INSERT INTO downloads (payment_id, created_at) VALUES (?, ?)").bind(paymentId, now()).run()
}
