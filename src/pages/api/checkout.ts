import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"
import { startCheckout, type CheckoutBody } from "@/lib/checkout"
import { PASS_COOKIE, PASS_MAX_AGE, hashToken, isPass, newPass } from "@/lib/delivery"
import { createCheckoutUrl } from "@/lib/dodo"

export const prerender = false

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...(status === 429 && { "retry-after": "60" }) },
  })

export const POST: APIRoute = async ({ request, clientAddress, cookies }) => {
  const limit = await env.CHECKOUT_LIMIT?.limit({ key: clientAddress })
  if (limit && !limit.success) return json(429, { error: "Too many tries. Please wait a minute." })

  let input: CheckoutBody
  try {
    input = (await request.json()) as CheckoutBody
  } catch {
    return json(400, { error: "Please try again." })
  }

  const origin = new URL(request.url).origin
  // A browser keeps its pass, so a second checkout tab can't lock the first one out.
  const current = cookies.get(PASS_COOKIE)?.value
  const pass = isPass(current) ? current : newPass()
  try {
    const result = await startCheckout(env.DB, input, (email, consentId) => createCheckoutUrl(env, origin, email, consentId), await hashToken(pass))
    if (result.status === 200) cookies.set(PASS_COOKIE, pass, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: PASS_MAX_AGE })
    return json(result.status, result.body)
  } catch (error) {
    console.error("checkout failed", error)
    return json(502, { error: "Checkout is unavailable right now. Please try again." })
  }
}
