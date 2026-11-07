import { useEffect, useState } from "react"
import { SITE } from "@/lib/site"

type Status = { state: "pending" | "ready" | "blocked" | "failed"; downloadUrl?: string; duplicate?: boolean }

const SETUP = `Set up this project. Run \`node tools/doctor.mjs --fix\`. If it reports anything
it could not install (ffmpeg, Python, Node, system libraries), install that with
the exact command it prints, open a new shell if PATH changed, and run it again.
Repeat until it prints "Everything is set up". Then tell me what you installed.`

const Title = ({ lead, em }: { lead: string; em: string }) => (
  <h1 className="h2">
    {lead} <span className="em">{em}</span>
  </h1>
)

export default function SuccessPanel() {
  const [status, setStatus] = useState<Status>({ state: "pending" })
  const [slow, setSlow] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const query = new URLSearchParams(location.search)
    const paymentId = query.get("payment_id")
    // Dodo sends failed and cancelled payments back to this page too.
    const declined = ["failed", "cancelled"].includes(query.get("status") ?? "")
    let tries = 0
    let timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      if (!paymentId || declined) {
        setStatus({ state: "failed" })
        return
      }
      tries += 1
      if (tries > 10) setSlow(true)
      try {
        const res = await fetch(`/api/order-status?payment_id=${encodeURIComponent(paymentId)}`)
        const next = (await res.json()) as Status
        if (next.state !== "pending") {
          setStatus(next)
          return
        }
      } catch {
        // A blip while the webhook lands is fine. Keep polling.
      }
      if (tries < 40) timer = setTimeout(poll, 3000)
    }
    poll()
    return () => clearTimeout(timer)
  }, [])

  if (status.state === "failed")
    return (
      <>
        <Title lead="No payment" em="found." />
        <p className="lede">
          We could not find a completed payment on this link. If you were charged, email {SITE.email} and we will sort it out. Otherwise, you can <a className="link" href="/pricing">try again</a>.
        </p>
      </>
    )
  if (status.state === "blocked")
    return (
      <>
        <Title lead="This download is" em="closed." />
        <p className="lede">This order was refunded or disputed. Questions? Email {SITE.email}.</p>
      </>
    )
  if (status.state === "pending")
    return (
      <>
        <Title lead="One" em="moment." />
        <p className="lede" role="status">
          Confirming your payment with Dodo…
          {slow && ` This is taking longer than usual. If you were charged, your delivery email is on its way, or write to ${SITE.email}.`}
        </p>
      </>
    )

  return (
    <div style={{ display: "grid", gap: 26, justifyItems: "start" }}>
      <span className="stamp slam" style={{ ["--stamp" as string]: "2.4rem", ["--stamp-color" as string]: "#0c8a63" }}>
        Paid
      </span>
      <Title lead="Your kit is" em="ready." />
      {status.duplicate && (
        <p role="alert" style={{ padding: "12px 14px", border: "2px solid var(--ink)", borderRadius: 10, background: "var(--yellow)", color: "var(--ink)" }}>
          This looks like a second payment for the same email. Reply to your receipt or email {SITE.email} within 7 days and the duplicate gets refunded.
        </p>
      )}
      <a className="btn" href={status.downloadUrl}>
        Download Reel Studio Kit
      </a>
      <div style={{ width: "100%", maxWidth: 720 }}>
        <p className="kicker" style={{ marginBottom: 8 }}>
          // then unzip it, open your agent in the folder, and paste this
        </p>
        <pre className="prose" style={{ maxWidth: "none", margin: 0 }}>
          <code style={{ display: "block", padding: 16, border: "2px solid var(--ink)", borderRadius: 12, background: "#16181d", color: "#efefe7", whiteSpace: "pre-wrap", fontFamily: "var(--mono)", fontSize: ".84rem" }}>
            {SETUP}
          </code>
        </pre>
        <button
          type="button"
          className="btn btn--sm btn--ghost"
          style={{ marginTop: 12 }}
          onClick={async () => {
            await navigator.clipboard.writeText(SETUP)
            setCopied(true)
          }}
        >
          {copied ? "Copied" : "Copy setup prompt"}
        </button>
      </div>
    </div>
  )
}
