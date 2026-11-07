import { useEffect, useState } from "react"
import { Sheet } from "@/islands/Sheet"
import { SITE } from "@/lib/site"

type Status = {
  state: "pending" | "ready" | "elsewhere" | "blocked" | "failed"
  downloadUrl?: string
  closesAt?: string
  duplicate?: boolean
}

const SETUP = `Set up this project. Run \`node tools/doctor.mjs --fix\`. If it reports anything
it could not install (ffmpeg, Python, Node, system libraries), install that with
the exact command it prints, open a new shell if PATH changed, and run it again.
Repeat until it prints "Everything is set up". Then tell me what you installed.`

const Title = ({ lead, em }: { lead: string; em: string }) => (
  <h1 className="h2">
    {lead} <span className="em">{em}</span>
  </h1>
)

const Recovery = () => (
  <>
    <ol className="after__steps">
      <li>
        Find the email from Dodo Payments called <strong>"Your payment to Build with Abu was successful"</strong>. Check spam too.
      </li>
      <li>
        Click <strong>Access in your customer portal</strong>.
      </li>
      <li>
        Scroll to <strong>License Keys & Downloads</strong>, then click <strong>View</strong> next to Reel Studio Kit download.
      </li>
      <li>
        Click <strong>reel-studio-kit.zip</strong>.
      </li>
    </ol>
    <p className="after__note">The portal may be headed OutrankBid. That's the business name on our Dodo account.</p>
    <p>
      Still stuck? Email{" "}
      <a className="link" href={`mailto:${SITE.email}`}>
        {SITE.email}
      </a>{" "}
      from the address you paid with, and we'll sort it out.
    </p>
  </>
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
    // Dodo adds the buyer's email to this URL. Keep it out of history and anything they copy.
    if (paymentId) history.replaceState(null, "", `/success?payment_id=${encodeURIComponent(paymentId)}`)
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

  // Swap to the email steps when the hour ends, rather than leaving a button that no longer works.
  useEffect(() => {
    if (!status.closesAt) return
    const timer = setTimeout(() => setStatus({ state: "elsewhere" }), Date.parse(status.closesAt) - Date.now())
    return () => clearTimeout(timer)
  }, [status.closesAt])

  if (status.state === "failed")
    return (
      <>
        <Title lead="No payment" em="found." />
        <p className="lede">
          We could not find a completed payment on this link. If you were charged, email {SITE.email} and we will sort it out. Otherwise, you can{" "}
          <a className="link" href="/pricing">
            try again
          </a>
          .
        </p>
      </>
    )
  if (status.state === "elsewhere")
    return (
      <div className="after after--single">
        <Title lead="Your kit is in your" em="email." />
        <p className="lede">This site's download only works in the browser that paid, for one hour after payment. Your receipt from Dodo still has it.</p>
        <Sheet className="after__help">
          <Recovery />
        </Sheet>
      </div>
    )
  if (status.state === "blocked")
    return (
      <>
        <Title lead="This download is" em="closed." />
        <p className="lede">This order was refunded, disputed or is waiting on a manual check. Questions? Email {SITE.email}.</p>
      </>
    )
  if (status.state === "pending")
    return (
      <>
        <Title lead="One" em="moment." />
        <p className="lede" role="status">
          Confirming your payment with Dodo…
          {slow && ` This is taking longer than usual. If you were charged, your receipt from Dodo has the download, or write to ${SITE.email}.`}
        </p>
      </>
    )

  const closesAt = status.closesAt
    ? new Date(status.closesAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "the hour is up"

  return (
    <div className="after">
      <div className="after__main">
        <span
          className="stamp slam"
          style={{
            ["--stamp" as string]: "2.4rem",
            ["--stamp-color" as string]: "#0c8a63",
          }}
        >
          Paid
        </span>
        <Title lead="Your kit is" em="ready." />
        {status.duplicate && (
          <p
            role="alert"
            style={{
              padding: "12px 14px",
              border: "2px solid var(--ink)",
              borderRadius: 10,
              background: "var(--yellow)",
              color: "var(--ink)",
            }}
          >
            This looks like a second payment for the same email. Reply to your receipt or email {SITE.email} within 7 days and the duplicate gets refunded.
          </p>
        )}
        <a className="btn" href={status.downloadUrl}>
          Download Reel Studio Kit
        </a>
      </div>
      <Sheet className="after__help">
        <p className="after__warning" role="note">
          <strong>Download it now.</strong> This is the only download on this site. It works in this browser until {closesAt}, and there's no account to come back to.
        </p>
        <h2 className="h3">Missed it? Use your email.</h2>
        <Recovery />
      </Sheet>
      <div className="after__setup">
        <p className="kicker" style={{ marginBottom: 8 }}>
          // then unzip it, open your agent in the folder, and paste this
        </p>
        <pre className="prose" style={{ maxWidth: "none", margin: 0 }}>
          <code
            style={{
              display: "block",
              padding: 16,
              border: "2px solid var(--ink)",
              borderRadius: 12,
              background: "#16181d",
              color: "#efefe7",
              whiteSpace: "pre-wrap",
              fontFamily: "var(--mono)",
              fontSize: ".84rem",
            }}
          >
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
