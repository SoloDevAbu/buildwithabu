// Drives a running `wrangler dev` build through a whole purchase.
// Usage: node tests/e2e-local.mjs http://localhost:8799
import { Webhook } from "standardwebhooks"

const base = process.argv[2] ?? "http://localhost:8799"
const secret = "whsec_bG9jYWwtd2ViaG9vay1zZWNyZXQtb25seS1mb3ItZGV2"
const id = `pay_${Date.now()}`
const email = `buyer+${Date.now()}@example.com`

const post = async (msgId, event, tamper) => {
  const body = JSON.stringify(event)
  const now = new Date()
  const signature = new Webhook(secret).sign(msgId, now, body)
  return fetch(`${base}/api/webhooks/dodo`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": msgId,
      "webhook-timestamp": String(Math.floor(now / 1000)),
      "webhook-signature": signature,
    },
    body: tamper ? body.replace("1600", "1") : body,
  })
}

const event = {
  business_id: "bus",
  type: "payment.succeeded",
  timestamp: new Date().toISOString(),
  data: { payload_type: "Payment", payment_id: id, total_amount: 1600, currency: "USD", customer: { email } },
}
const log = (name, value) => console.log(name.padEnd(34), value)

log("status before webhook", (await (await fetch(`${base}/api/order-status?payment_id=${id}`)).json()).state)
log("tampered webhook", (await post("msg_t", event, true)).status)
log("genuine webhook", (await post(`msg_${id}`, event)).status)
log("retry of same webhook", (await post(`msg_${id}`, event)).status)
const status = await (await fetch(`${base}/api/order-status?payment_id=${id}`)).json()
log("status after webhook", JSON.stringify(status))
const dl = await fetch(base + status.downloadUrl)
log("download", `${dl.status} ${dl.headers.get("content-type")} ${dl.headers.get("content-disposition")} ${(await dl.arrayBuffer()).byteLength} bytes`)
log("forged download", (await fetch(`${base}/download/${id}.deadbeef`)).status)

const buy = (b) =>
  fetch(`${base}/api/checkout`, { method: "POST", headers: { "content-type": "application/json", origin: base }, body: JSON.stringify(b) })
log("checkout without consent", (await buy({ email: "a@example.com" })).status)
const owned = await buy({ email, acceptTerms: true, acceptWaiver: true })
log("checkout for existing owner", `${owned.status} ${JSON.stringify(await owned.json()).slice(0, 70)}`)
const fresh = await buy({ email: `new${Date.now()}@example.com`, acceptTerms: true, acceptWaiver: true })
log("checkout, placeholder Dodo key", `${fresh.status} ${JSON.stringify(await fresh.json())}`)

await post(`msg_r_${id}`, { type: "refund.succeeded", data: { payment_id: id } })
log("download after refund", (await fetch(base + status.downloadUrl)).status)
log("reel 404", (await fetch(`${base}/reels/nope`)).status)
log("page 404", (await fetch(`${base}/nope`)).status)

for (const p of ["/", "/pricing", "/reels", "/legal/terms", "/llms.txt", "/robots.txt", "/video-sitemap.xml", "/sitemap-index.xml", "/rss.xml"]) {
  const r = await fetch(base + p)
  log(p, `${r.status} ${r.headers.get("content-type")} csp:${r.headers.has("content-security-policy")}`)
}
