import { describe, expect, it, vi } from "vitest"
import { Webhook } from "standardwebhooks"
import { startCheckout } from "@/lib/checkout"
import { verifyWebhook } from "@/lib/dodo"
import { applyDodoEvent, getOrder, hasPaidOrder, signDownload, verifyDownload } from "@/lib/orders"
import { testDb } from "./d1"

const SECRET = `whsec_${btoa("a-test-only-secret-of-enough-length")}`

const paid = (payment_id: string, email = "Buyer@Example.com") => ({
  type: "payment.succeeded",
  data: { payment_id, total_amount: 1600, currency: "USD", customer: { email }, metadata: { consent_id: "c1" } },
})

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
    expect(() => verifyWebhook(SECRET, body.replace("1600", "1"), headers)).toThrow()
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
    const { db, sqlite } = testDb()
    await applyDodoEvent(db, "msg_1", paid("pay_1"))
    expect(await applyDodoEvent(db, "msg_1", paid("pay_1"))).toBe("duplicate-delivery")
    await applyDodoEvent(db, "msg_2", paid("pay_1"))
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM orders").get()).toEqual({ n: 1 })
    expect(await hasPaidOrder(db, "buyer@example.com")).toBe(true)
  })

  it("flags a real second payment on the same email", async () => {
    const { db } = testDb()
    await applyDodoEvent(db, "msg_1", paid("pay_1"))
    await applyDodoEvent(db, "msg_2", paid("pay_2", "buyer@example.com"))
    expect((await getOrder(db, "pay_1"))?.is_duplicate).toBe(0)
    expect((await getOrder(db, "pay_2"))?.is_duplicate).toBe(1)
  })

  it("closes the order on refund and on a lost dispute, and reopens on a won one", async () => {
    const { db } = testDb()
    await applyDodoEvent(db, "m1", paid("pay_1"))
    await applyDodoEvent(db, "m2", { type: "dispute.opened", data: { payment_id: "pay_1" } })
    expect((await getOrder(db, "pay_1"))?.status).toBe("disputed")
    await applyDodoEvent(db, "m3", { type: "dispute.won", data: { payment_id: "pay_1" } })
    expect((await getOrder(db, "pay_1"))?.status).toBe("paid")
    await applyDodoEvent(db, "m4", { type: "refund.succeeded", data: { payment_id: "pay_1" } })
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
      expect((await startCheckout(db, input, create)).status).toBe(400)
    }
    expect(create).not.toHaveBeenCalled()
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM consents").get()).toEqual({ n: 0 })
  })

  it("stores consent before creating the session", async () => {
    const { db, sqlite } = testDb()
    const create = vi.fn(async () => "https://checkout.example/abc")
    const result = await startCheckout(db, ok, create)
    expect(result.body.url).toBe("https://checkout.example/abc")
    const consent = sqlite.prepare("SELECT id, withdrawal_waiver FROM consents").get() as { id: string; withdrawal_waiver: number }
    expect(consent.withdrawal_waiver).toBe(1)
    expect(create).toHaveBeenCalledWith("new@example.com", consent.id)
  })

  it("blocks an email that already owns the kit", async () => {
    const { db } = testDb()
    await applyDodoEvent(db, "m1", paid("pay_1", "new@example.com"))
    const create = vi.fn()
    const result = await startCheckout(db, { ...ok, email: " NEW@example.com " }, create)
    expect(result).toMatchObject({ status: 409, body: { alreadyOwned: true } })
    expect(create).not.toHaveBeenCalled()
  })

  it("lets someone buy again after a refund", async () => {
    const { db } = testDb()
    await applyDodoEvent(db, "m1", paid("pay_1", "new@example.com"))
    await applyDodoEvent(db, "m2", { type: "refund.succeeded", data: { payment_id: "pay_1" } })
    expect((await startCheckout(db, ok, async () => "https://checkout.example/x")).status).toBe(200)
  })

  it("rejects bad emails and filled honeypots", async () => {
    const { db } = testDb()
    expect((await startCheckout(db, { ...ok, email: "nope" }, vi.fn())).status).toBe(400)
    expect((await startCheckout(db, { ...ok, website: "spam" }, vi.fn())).status).toBe(400)
  })
})

describe("download links", () => {
  it("round-trips and rejects forgeries", async () => {
    const token = await signDownload("pay_1", "secret")
    expect(await verifyDownload(token, "secret")).toBe("pay_1")
    expect(await verifyDownload(token, "other-secret")).toBeNull()
    expect(await verifyDownload(token.replace("pay_1", "pay_2"), "secret")).toBeNull()
    expect(await verifyDownload("garbage", "secret")).toBeNull()
    expect(await verifyDownload("pay_1.zz", "secret")).toBeNull()
  })
})
