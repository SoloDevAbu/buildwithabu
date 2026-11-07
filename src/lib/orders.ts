// Everything that touches money state. Takes the database as an argument, so tests can run it
// against real SQL with the real migration.
import { POLICY } from "@/lib/site"

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

export const recordConsent = async (db: D1Database, email: string) => {
  const id = crypto.randomUUID()
  await db
    .prepare(
      "INSERT INTO consents (id, email, terms_version, refund_version, license_version, withdrawal_waiver, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)",
    )
    .bind(id, normalizeEmail(email), POLICY.terms, POLICY.refund, POLICY.license, now())
    .run()
  return id
}

export type PaymentInput = {
  paymentId: string
  email: string
  totalAmount?: number
  currency?: string
  consentId?: string
}

/** Idempotent per payment. A second paid order on one email is flagged, never refunded by code. */
export const recordPayment = async (db: D1Database, p: PaymentInput) => {
  const email = normalizeEmail(p.email)
  const earlier = await db
    .prepare("SELECT 1 AS found FROM orders WHERE email = ? AND status = 'paid' AND payment_id != ? LIMIT 1")
    .bind(email, p.paymentId)
    .first()
  const at = now()
  await db
    .prepare(
      `INSERT INTO orders (payment_id, email, status, total_amount, currency, consent_id, is_duplicate, created_at, updated_at)
       VALUES (?, ?, 'paid', ?, ?, ?, ?, ?, ?)
       ON CONFLICT(payment_id) DO NOTHING`,
    )
    .bind(p.paymentId, email, p.totalAmount ?? null, p.currency ?? null, p.consentId ?? null, earlier ? 1 : 0, at, at)
    .run()
}

export type OrderStatus = "paid" | "refunded" | "disputed" | "chargeback"

export const setOrderStatus = async (db: D1Database, paymentId: string, status: OrderStatus) => {
  await db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE payment_id = ?").bind(status, now(), paymentId).run()
}

export type Order = { payment_id: string; email: string; status: OrderStatus; is_duplicate: number }

export const getOrder = (db: D1Database, paymentId: string) =>
  db
    .prepare("SELECT payment_id, email, status, is_duplicate FROM orders WHERE payment_id = ?")
    .bind(paymentId)
    .first<Order>()

export const webhookSeen = async (db: D1Database, id: string) =>
  (await db.prepare("SELECT 1 AS found FROM webhook_events WHERE webhook_id = ?").bind(id).first()) !== null

export const markWebhookSeen = async (db: D1Database, id: string, type: string) => {
  await db.prepare("INSERT OR IGNORE INTO webhook_events (webhook_id, type, received_at) VALUES (?, ?, ?)").bind(id, type, now()).run()
}

type DodoEvent = {
  type: string
  data: {
    payment_id?: string
    total_amount?: number
    currency?: string
    customer?: { email?: string }
    metadata?: Record<string, string>
  }
}

/**
 * The event is marked seen only after it is applied. A crash in between gets retried by Dodo, and
 * every handler below is safe to run twice.
 */
export const applyDodoEvent = async (db: D1Database, webhookId: string, event: DodoEvent) => {
  if (await webhookSeen(db, webhookId)) return "duplicate-delivery"
  const { type, data } = event
  const paymentId = data.payment_id
  if (paymentId) {
    if (type === "payment.succeeded") {
      if (!data.customer?.email) throw new Error("payment.succeeded without a customer email")
      await recordPayment(db, {
        paymentId,
        email: data.customer.email,
        totalAmount: data.total_amount,
        currency: data.currency,
        consentId: data.metadata?.consent_id,
      })
    } else if (type === "refund.succeeded") {
      await setOrderStatus(db, paymentId, "refunded")
    } else if (type === "dispute.opened") {
      await setOrderStatus(db, paymentId, "disputed")
    } else if (type === "dispute.won" || type === "dispute.cancelled" || type === "dispute.expired") {
      await setOrderStatus(db, paymentId, "paid")
    } else if (type === "dispute.lost") {
      await setOrderStatus(db, paymentId, "chargeback")
    }
  }
  await markWebhookSeen(db, webhookId, type)
  return "applied"
}

// ── Download links ──────────────────────────────────────────────────────────────────────────
const key = (secret: string) =>
  crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])

const toHex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("")

const fromHex = (hex: string) => {
  if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2) return null
  return Uint8Array.from(hex.match(/../g) ?? [], (b) => parseInt(b, 16))
}

export const signDownload = async (paymentId: string, secret: string) => {
  const mac = await crypto.subtle.sign("HMAC", await key(secret), new TextEncoder().encode(paymentId))
  return `${paymentId}.${toHex(mac)}`
}

/** Returns the payment id when the link is genuine. `crypto.subtle.verify` compares in constant time. */
export const verifyDownload = async (token: string, secret: string) => {
  const dot = token.lastIndexOf(".")
  if (dot < 1) return null
  const paymentId = token.slice(0, dot)
  const mac = fromHex(token.slice(dot + 1))
  if (!mac) return null
  const ok = await crypto.subtle.verify("HMAC", await key(secret), mac, new TextEncoder().encode(paymentId))
  return ok ? paymentId : null
}

export const MAX_DOWNLOADS_PER_DAY = 20

export const downloadsToday = async (db: D1Database, paymentId: string) => {
  const since = new Date(Date.now() - 86_400_000).toISOString()
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM downloads WHERE payment_id = ? AND created_at > ?")
    .bind(paymentId, since)
    .first<{ n: number }>()
  return row?.n ?? 0
}

export const logDownload = async (db: D1Database, paymentId: string, version: string) => {
  await db.prepare("INSERT INTO downloads (payment_id, version, created_at) VALUES (?, ?, ?)").bind(paymentId, version, now()).run()
}

export type KitRelease = { version: string; r2_key: string; sha256: string; size_bytes: number }

export const latestRelease = (db: D1Database) =>
  db.prepare("SELECT version, r2_key, sha256, size_bytes FROM kit_releases ORDER BY released_at DESC LIMIT 1").first<KitRelease>()
