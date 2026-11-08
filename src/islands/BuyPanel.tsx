import { useState, type FormEvent } from "react"
import { REFUND_WINDOW_DAYS, SITE } from "@/lib/site"

type State = { kind: "idle" } | { kind: "busy" } | { kind: "error"; message: string } | { kind: "owned"; message: string }

export default function BuyPanel() {
  const [email, setEmail] = useState("")
  const [terms, setTerms] = useState(false)
  const [waiver, setWaiver] = useState(false)
  const [state, setState] = useState<State>({ kind: "idle" })
  const [reels, setReels] = useState(30)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const website = new FormData(e.currentTarget).get("website")
    setState({ kind: "busy" })
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, acceptTerms: terms, acceptWaiver: waiver, website }),
      })
      const data = (await res.json()) as { url?: string; error?: string; alreadyOwned?: boolean }
      if (data.url) {
        location.href = data.url
        return
      }
      if (data.alreadyOwned) {
        setState({ kind: "owned", message: data.error ?? "" })
        return
      }
      setState({ kind: "error", message: data.error ?? "Something went wrong. Please try again." })
    } catch {
      setState({ kind: "error", message: `Could not reach checkout. Try again, or email ${SITE.email}.` })
    }
  }

  const perReel = SITE.price / reels
  return (
    <form className="buy" onSubmit={submit}>
      <div className="buy-calc">
        <label htmlFor="reels-count" className="kicker">
          // reels you'd make in the first month: <b>{reels}</b>
        </label>
        <input id="reels-count" type="range" min={1} max={45} value={reels} onChange={(e) => setReels(Number(e.target.value))} />
        <p>
          That's <b>${perReel.toFixed(2)}</b> a reel, then $0 from the kit after that. It runs on your machine.
        </p>
      </div>

      <label className="buy-field">
        <span>Email for your download</span>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      {/* Honeypot for form bots. Hidden from people and from assistive tech. */}
      <input className="buy-trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <label className="buy-check">
        <input type="checkbox" required checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>
          I agree to the <a href="/legal/terms">Terms</a>, <a href="/legal/license">Licence</a> and{" "}
          <a href="/legal/refunds">Refund Policy</a>: no refunds, except a duplicate payment reported within {REFUND_WINDOW_DAYS} days.
        </span>
      </label>
      <label className="buy-check">
        <input type="checkbox" required checked={waiver} onChange={(e) => setWaiver(e.target.checked)} />
        <span>I want immediate access to this digital download and understand I lose any right to withdraw once delivery starts.</span>
      </label>

      <button className="btn" type="submit" disabled={state.kind === "busy"}>
        {state.kind === "busy" ? "Opening secure checkout…" : `Pay ${SITE.priceLabel} once`}
      </button>

      {state.kind === "error" && (
        <p className="buy-msg" role="alert">
          {state.message}
        </p>
      )}
      {state.kind === "owned" && (
        <p className="buy-msg buy-msg--ok" role="status">
          {state.message} <a href={SITE.portalUrl}>Open the portal</a>
        </p>
      )}
      <p className="buy-fine">
        Secure checkout by Dodo Payments, our Merchant of Record. Taxes may apply. Your statement will show Dodo Payments.
      </p>
      <style>{`
        .buy { display: grid; gap: 14px; }
        .buy-calc { display: grid; gap: 6px; padding-bottom: 16px; border-bottom: 2px dashed var(--rule); }
        .buy-calc input { width: 100%; height: 28px; accent-color: var(--coral); }
        .buy-calc p { font-size: .94rem; }
        .buy-field { display: grid; gap: 5px; font-weight: 500; font-size: .92rem; }
        .buy-field input { min-height: 50px; padding: 0 14px; border: 2px solid var(--ink); border-radius: 10px; background: #fff; font-size: 16px; }
        .buy-trap { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
        .buy-check { display: grid; grid-template-columns: 22px 1fr; gap: 10px; font-size: .88rem; line-height: 1.38; cursor: pointer; }
        .buy-check input { width: 20px; height: 20px; margin-top: 1px; accent-color: var(--coral); }
        .buy-check a { text-decoration: underline; text-underline-offset: 2px; }
        .buy .btn { width: 100%; min-height: 58px; font-size: 1.1rem; }
        .buy-msg { padding: 10px 12px; border: 2px solid #d62f2f; border-radius: 9px; background: #fff0f0; font-size: .9rem; }
        .buy-msg--ok { border-color: #0c8a63; background: #e7fbf3; }
        .buy-fine { font-size: .78rem; color: var(--muted); line-height: 1.4; }
      `}</style>
    </form>
  )
}
