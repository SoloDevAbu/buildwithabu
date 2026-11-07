// Attacks a running build the way a stranger would. No Dodo keys needed.
// Usage: node tests/e2e-local.mjs http://localhost:8799
import { Webhook } from "standardwebhooks"

const base = process.argv[2] ?? "http://localhost:8799"
const log = (name, ...rest) => console.log(name.padEnd(38), ...rest)

const checkout = (body) =>
  fetch(`${base}/api/checkout`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })

const event = JSON.stringify({ type: "payment.succeeded", data: { payment_id: "pay_forgedforgedforged", brand_id: "x" } })
const forged = await fetch(`${base}/api/webhooks/dodo`, {
  method: "POST",
  headers: {
    "webhook-id": "msg_forged",
    "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
    "webhook-signature": new Webhook(`whsec_${btoa("the-attacker-guessed-this-secret")}`).sign("msg_forged", new Date(), event),
  },
  body: event,
})
log("webhook signed with a wrong key", forged.status)
log("webhook with no signature", (await fetch(`${base}/api/webhooks/dodo`, { method: "POST", body: event })).status)

log("checkout without consent", (await checkout({ email: "a@example.com" })).status)
log("checkout with a bad email", (await checkout({ email: "nope", acceptTerms: true, acceptWaiver: true })).status)

for (const id of ["pay_unknownunknownunknown", "not-a-payment", "pay_' OR 1=1 --"]) {
  const status = await fetch(`${base}/api/order-status?payment_id=${encodeURIComponent(id)}`)
  log(`status for ${id}`, status.status, await status.text())
  // With no kit_pass cookie this is a stranger, so expect 303 for a real paid order, 404 otherwise.
  log(`download for ${id}`, (await fetch(`${base}/download/${encodeURIComponent(id)}`, { redirect: "manual" })).status)
}

for (const path of ["/", "/pricing", "/reels", "/legal/terms", "/llms.txt", "/robots.txt", "/video-sitemap.xml", "/sitemap-index.xml", "/rss.xml"]) {
  const res = await fetch(`${base}${path}`)
  log(path, res.status, `csp:${res.headers.has("content-security-policy")}`)
}
log("page 404", (await fetch(`${base}/nothing-here`)).status)
