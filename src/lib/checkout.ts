import { hasPaidOrder, isValidEmail, recordConsent } from "@/lib/orders"

export type CheckoutBody = { email?: unknown; acceptTerms?: unknown; acceptWaiver?: unknown; website?: unknown }
export type CheckoutResult = { status: number; body: { url?: string; error?: string; alreadyOwned?: boolean } }

/** The rules, without Dodo or HTTP. `createSession` only runs once all of them pass. */
export const startCheckout = async (
  db: D1Database,
  input: CheckoutBody,
  createSession: (email: string, consentId: string) => Promise<string | null | undefined>,
  browserHash: string,
): Promise<CheckoutResult> => {
  // Filled honeypot: answer politely and do nothing.
  if (typeof input.website === "string" && input.website !== "")
    return { status: 400, body: { error: "Please try again." } }

  const email = typeof input.email === "string" ? input.email.trim() : ""
  if (!isValidEmail(email)) return { status: 400, body: { error: "Please enter a valid email address." } }

  // Checked on the server too: consent cannot be skipped by calling the API directly.
  if (input.acceptTerms !== true || input.acceptWaiver !== true)
    return { status: 400, body: { error: "Please tick both boxes to continue." } }

  if (await hasPaidOrder(db, email))
    return {
      status: 409,
      body: {
        alreadyOwned: true,
        error: `This email already owns the kit, so we stopped a second payment. Your download is in the customer portal. Use the link in your Dodo Payments receipt.`,
      },
    }

  const consentId = await recordConsent(db, email, browserHash)
  const url = await createSession(email, consentId)
  if (!url) return { status: 502, body: { error: "Checkout is unavailable right now. Please try again." } }
  return { status: 200, body: { url } }
}
