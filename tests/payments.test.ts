import { describe, expect, it, vi } from "vitest"
import { Webhook } from "standardwebhooks"
import { startCheckout } from "@/lib/checkout"
import { canDownload, hashToken } from "@/lib/delivery"
import { productProblem, verifyWebhook } from "@/lib/dodo"
import { applyDodoEvent, confirmPayment, getOrder, hasPaidOrder, judgePayment, recordConsent, type PaymentFacts } from "@/lib/orders"
import { testDb } from "./d1"

const SECRET = `whsec_${btoa("a-test-only-secret-of-enough-length")}`

const sale = { productId: "pdt_kit", brandId: "brnd_abu" }

const paid = (payment_id: string) => ({ type: "payment.succeeded", data: { payment_id, brand_id: sale.brandId } })

/** A clean $16 sale as Dodo's API reports it. */
const payment = (over: Partial<PaymentFacts> = {}): PaymentFacts => ({
  payment_id: "pay_1",
  status: "succeeded",
  brand_id: sale.brandId,
  total_amount: 1600,
  currency: "USD",
  settlement_amount: 1600,
  settlement_currency: "USD",
  discount_id: null,
  refund_status: null,
  product_cart: [{ product_id: sale.productId, quantity: 1 }],
  metadata: { consent_id: "unset" },
  customer: { customer_id: "cus_1", email: "Buyer@Example.com" },
  ...over,
})

/** A database with a consent on file, and deps that answer like Dodo's API. */
const PASS = "a".repeat(64)

const shop = async (email = "buyer@example.com") => {
  const { db, sqlite } = testDb()
  const consent_id = await recordConsent(db, email, await hashToken(PASS))
  const fetchPayment = vi.fn(async (payment_id: string) => payment({ payment_id, metadata: { consent_id }, customer: { customer_id: "cus_1", email } }))
  return { db, sqlite, consent_id, deps: { sale, fetchPayment } }
}

const signedHeaders = (id: string, body: string, when = new Date()) =>
  new Headers({
    "webhook-id": id,
    "webhook-timestamp": String(Math.floor(when.getTime() / 1000)),
    "webhook-signature": new Webhook(SECRET).sign(id, when, body),
  })

describe("webhook signature", () => {
  const body = JSON.stringify(paid("pay_1"))

  it("accepts a genuine signature", () => {
    expect(verifyWebhook(SECRET, body, signedHeaders("msg_1", body))).toMatchObject({ type: "payment.succeeded" })
  })

  it("rejects a tampered body", () => {
    const headers = signedHeaders("msg_1", body)
    expect(() => verifyWebhook(SECRET, body.replace("pay_1", "pay_2"), headers)).toThrow()
  })

  it("rejects a stale timestamp", () => {
    const old = new Date(Date.now() - 10 * 60_000)
    expect(() => verifyWebhook(SECRET, body, signedHeaders("msg_1", body, old))).toThrow()
  })

  it("rejects missing headers", () => {
    expect(() => verifyWebhook(SECRET, body, new Headers())).toThrow()
  })
})

describe("orders from webhooks", () => {
  it("creates one order however many times Dodo retries", async () => {
    const { db, sqlite, deps } = await shop()
    await applyDodoEvent(db, "msg_1", paid("pay_1"), deps)
    expect(await applyDodoEvent(db, "msg_1", paid("pay_1"), deps)).toBe("duplicate-delivery")
    await applyDodoEvent(db, "msg_2", paid("pay_1"), deps)
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM orders").get()).toEqual({ n: 1 })
    expect(await hasPaidOrder(db, "buyer@example.com")).toBe(true)
  })

  it("flags a real second payment on the same email", async () => {
    const { db, deps } = await shop()
    await applyDodoEvent(db, "msg_1", paid("pay_1"), deps)
    await applyDodoEvent(db, "msg_2", paid("pay_2"), deps)
    expect((await getOrder(db, "pay_1"))?.is_duplicate).toBe(0)
    expect((await getOrder(db, "pay_2"))?.is_duplicate).toBe(1)
  })

  it("closes the order on refund and on a lost dispute, and reopens on a won one", async () => {
    const { db, deps } = await shop()
    await applyDodoEvent(db, "m1", paid("pay_1"), deps)
    await applyDodoEvent(db, "m2", { type: "dispute.opened", data: { payment_id: "pay_1" } }, deps)
    expect((await getOrder(db, "pay_1"))?.status).toBe("disputed")
    await applyDodoEvent(db, "m3", { type: "dispute.won", data: { payment_id: "pay_1" } }, deps)
    expect((await getOrder(db, "pay_1"))?.status).toBe("paid")
    await applyDodoEvent(db, "m4", { type: "refund.succeeded", data: { payment_id: "pay_1" } }, deps)
    expect((await getOrder(db, "pay_1"))?.status).toBe("refunded")
    expect(await hasPaidOrder(db, "buyer@example.com")).toBe(false)
  })
})

describe("checkout rules", () => {
  const ok = { email: "new@example.com", acceptTerms: true, acceptWaiver: true }

  it("refuses without both consents and never reaches Dodo", async () => {
    const { db, sqlite } = testDb()
    const create = vi.fn()
    for (const input of [{ ...ok, acceptTerms: false }, { ...ok, acceptWaiver: false }, { email: ok.email }]) {
      expect((await startCheckout(db, input, create, "hash")).status).toBe(400)
    }
    expect(create).not.toHaveBeenCalled()
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM consents").get()).toEqual({ n: 0 })
  })

  it("stores consent before creating the session", async () => {
    const { db, sqlite } = testDb()
    const create = vi.fn(async () => "https://checkout.example/abc")
    const result = await startCheckout(db, ok, create, "hash")
    expect(result.body.url).toBe("https://checkout.example/abc")
    const consent = sqlite.prepare("SELECT id, withdrawal_waiver FROM consents").get() as { id: string; withdrawal_waiver: number }
    expect(consent.withdrawal_waiver).toBe(1)
    expect(create).toHaveBeenCalledWith("new@example.com", consent.id)
  })

  it("blocks an email that already owns the kit", async () => {
    const { db, deps } = await shop("new@example.com")
    await applyDodoEvent(db, "m1", paid("pay_1"), deps)
    const create = vi.fn()
    const result = await startCheckout(db, { ...ok, email: " NEW@example.com " }, create, "hash")
    expect(result).toMatchObject({ status: 409, body: { alreadyOwned: true } })
    expect(create).not.toHaveBeenCalled()
  })

  it("lets someone buy again after a refund", async () => {
    const { db, deps } = await shop("new@example.com")
    await applyDodoEvent(db, "m1", paid("pay_1"), deps)
    await applyDodoEvent(db, "m2", { type: "refund.succeeded", data: { payment_id: "pay_1" } }, deps)
    expect((await startCheckout(db, ok, async () => "https://checkout.example/x", "hash")).status).toBe(200)
  })

  it("rejects bad emails and filled honeypots", async () => {
    const { db } = testDb()
    expect((await startCheckout(db, { ...ok, email: "nope" }, vi.fn(), "hash")).status).toBe(400)
    expect((await startCheckout(db, { ...ok, website: "spam" }, vi.fn(), "hash")).status).toBe(400)
  })
})

describe("tampering", () => {
  it("accepts a clean tax-inclusive sale and foreign currencies", () => {
    expect(judgePayment(payment(), sale).verdict).toBe("paid")
    expect(judgePayment(payment({ total_amount: 1600, settlement_amount: 1356 }), sale).verdict).toBe("paid")
    expect(judgePayment(payment({ total_amount: 136000, currency: "INR", settlement_amount: 1590 }), sale).verdict).toBe("paid")
    expect(judgePayment(payment({ total_amount: 150000, currency: "INR" }), sale).verdict).toBe("paid")
    expect(judgePayment(payment({ total_amount: 150000, currency: "INR", settlement_amount: 140000, settlement_currency: "INR" }), sale).verdict).toBe("paid")
  })

  it.each([
    ["$0 charged", { total_amount: 0, settlement_amount: 0 }],
    ["$1 charged", { total_amount: 100, settlement_amount: 100 }],
    ["a converted sale well under the price", { total_amount: 100000, currency: "INR", settlement_amount: 1200 }],
    ["a discount", { discount_id: "dsc_1" }],
    ["two kits", { product_cart: [{ product_id: sale.productId, quantity: 2 }] }],
    ["an extra item", { product_cart: [{ product_id: sale.productId, quantity: 1 }, { product_id: "pdt_x", quantity: 1 }] }],
    ["a refunded payment", { refund_status: "succeeded" }],
  ])("holds back %s", (_, over) => {
    expect(judgePayment(payment(over), sale).verdict).toBe("review")
  })

  it("never treats another brand's or product's sale as a kit sale", () => {
    expect(judgePayment(payment({ brand_id: "brnd_other" }), sale).verdict).toBe("foreign")
    expect(judgePayment(payment({ product_cart: [{ product_id: "pdt_other", quantity: 1 }] }), sale).verdict).toBe("foreign")
    expect(judgePayment(payment({ product_cart: null }), sale).verdict).toBe("foreign")
  })

  it("does not grant unfinished or failed payments", () => {
    expect(judgePayment(payment({ status: "processing" }), sale).verdict).toBe("pending")
    expect(judgePayment(payment({ status: "failed" }), sale).verdict).toBe("failed")
    expect(judgePayment(payment({ status: "cancelled" }), sale).verdict).toBe("failed")
    expect(judgePayment(payment({ status: null }), sale).verdict).toBe("failed")
  })

  it("writes no order for another brand, and skips the API call when the event says so", async () => {
    const { db, sqlite, deps } = await shop()
    await applyDodoEvent(db, "m1", { type: "payment.succeeded", data: { payment_id: "pay_9", brand_id: "brnd_other" } }, deps)
    expect(deps.fetchPayment).not.toHaveBeenCalled()
    deps.fetchPayment.mockResolvedValueOnce(payment({ payment_id: "pay_9", brand_id: "brnd_other" }))
    await applyDodoEvent(db, "m2", { type: "payment.succeeded", data: { payment_id: "pay_9" } }, deps)
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM orders").get()).toEqual({ n: 0 })
  })

  it("trusts the API over the webhook body", async () => {
    const { db, deps, consent_id } = await shop()
    deps.fetchPayment.mockResolvedValueOnce(payment({ total_amount: 0, settlement_amount: 0, metadata: { consent_id } }))
    await applyDodoEvent(db, "m1", paid("pay_1"), deps)
    expect((await getOrder(db, "pay_1"))?.status).toBe("review")
    expect(await hasPaidOrder(db, "buyer@example.com")).toBe(false)
  })

  it("holds back a sale that skipped our consent step", async () => {
    const { db, consent_id } = await shop()
    expect(await confirmPayment(db, payment({ metadata: {} }), sale)).toBe("review")
    expect(await confirmPayment(db, payment({ payment_id: "pay_2", metadata: { consent_id: "made-up" } }), sale)).toBe("review")
    const other = { customer_id: "cus_2", email: "someone-else@example.com" }
    expect(await confirmPayment(db, payment({ payment_id: "pay_3", customer: other, metadata: { consent_id } }), sale)).toBe("review")
    expect(await confirmPayment(db, payment({ payment_id: "pay_4", metadata: { consent_id } }), sale)).toBe("paid")
  })

  it("does not reopen a chargeback on a late dispute event", async () => {
    const { db, deps } = await shop()
    await applyDodoEvent(db, "m1", paid("pay_1"), deps)
    await applyDodoEvent(db, "m2", { type: "dispute.lost", data: { payment_id: "pay_1" } }, deps)
    await applyDodoEvent(db, "m3", { type: "dispute.won", data: { payment_id: "pay_1" } }, deps)
    expect((await getOrder(db, "pay_1"))?.status).toBe("chargeback")
  })

  it("passes only the email and consent to Dodo, whatever else the browser sends", async () => {
    const { db } = testDb()
    const createSession = vi.fn<(email: string, consent: string) => Promise<string>>(async () => "https://checkout")
    const body = { email: "a@b.co", acceptTerms: true, acceptWaiver: true, amount: 0, price: 0, product_id: "pdt_free", quantity: 99, discount_code: "FREE" }
    await startCheckout(db, body, createSession, "hash")
    expect(createSession.mock.calls[0]).toEqual(["a@b.co", expect.any(String)])
  })
})

describe("browser lock", () => {
  const paidOrder = async () => {
    const { db, deps, sqlite } = await shop()
    await applyDodoEvent(db, "m1", paid("pay_1"), deps)
    const order = (await getOrder(db, "pay_1"))!
    return { order, sqlite, opened: Date.parse(order.created_at) }
  }

  it("lets the browser that paid download", async () => {
    const { order, opened } = await paidOrder()
    expect(await canDownload(order, PASS, opened + 60_000)).toBe(true)
  })

  it("refuses a shared link in any other browser", async () => {
    const { order, opened } = await paidOrder()
    expect(await canDownload(order, undefined, opened)).toBe(false)
    expect(await canDownload(order, "", opened)).toBe(false)
    expect(await canDownload(order, "b".repeat(64), opened)).toBe(false)
  })

  it("closes one hour after the order", async () => {
    const { order, opened } = await paidOrder()
    expect(await canDownload(order, PASS, opened + 3_599_000)).toBe(true)
    expect(await canDownload(order, PASS, opened + 3_600_000)).toBe(false)
  })

  it("refuses an order with no browser on file", async () => {
    const { order, opened } = await paidOrder()
    expect(await canDownload({ ...order, browser_hash: null }, PASS, opened)).toBe(false)
  })

  it("stores only a hash of the cookie", async () => {
    const { sqlite } = await paidOrder()
    expect(JSON.stringify(sqlite.prepare("SELECT * FROM consents").all())).not.toContain(PASS)
  })
})

describe("product guard", () => {
  const env = { DODO_BRAND_ID: "brnd_abu", DODO_ENTITLEMENT_ID: "ent_kit" }
  const product = (price = {}, over = {}) => ({
    brand_id: "brnd_abu",
    price: { type: "one_time_price", price: 1600, currency: "USD", discount: 0, pay_what_you_want: false, tax_inclusive: true, ...price },
    entitlements: [{ id: "ent_kit" }],
    ...over,
  })

  it("allows the real product", () => expect(productProblem(product(), env)).toBeNull())

  it.each([
    ["a $0 price", product({ price: 0 })],
    ["a different price", product({ price: 900 })],
    ["another currency", product({ currency: "INR" })],
    ["pay what you want", product({ pay_what_you_want: true })],
    ["a percentage off", product({ discount: 50 })],
    ["parity pricing", product({ purchasing_power_parity: true })],
    ["a subscription", product({ type: "recurring_price" })],
    ["tax added on top", product({ tax_inclusive: false })],
    ["tax not set", product({ tax_inclusive: null })],
    ["another brand", product({}, { brand_id: "brnd_other" })],
    ["no download attached", product({}, { entitlements: [] })],
  ])("refuses %s", (_, bad) => expect(productProblem(bad, env)).not.toBeNull())
})
