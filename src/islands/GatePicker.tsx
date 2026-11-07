import { useState } from "react"
import { Sheet } from "./Sheet"

const VARIANTS = {
  a: {
    angle: "Stakes hook, countdown arc",
    hook: "Your bad mornings start the night before.",
    beats: ["Alarm card flips to red", "Phone glow cross-out", "Tear-off calendar runs"],
    voice: "andrew · warm",
  },
  b: {
    angle: "Myth bust, reveal arc",
    hook: "Sleeping longer might not fix it.",
    beats: ["Alarm card gets stamped", "Chart slides in", "Dark flip on the twist"],
    voice: "brian · casual",
  },
} as const

type Key = keyof typeof VARIANTS

export default function GatePicker() {
  const [pick, setPick] = useState<Key | null>(null)
  return (
    <div className="gate">
      <div className="gate-grid">
        {(Object.keys(VARIANTS) as Key[]).map((key) => {
          const v = VARIANTS[key]
          const lost = pick !== null && pick !== key
          return (
            <Sheet key={key} className={`gate-card${lost ? " lost" : ""}`}>
              <div className="win-head">
                <i /> script/variant-{key}.md
              </div>
              <div className="gate-body">
                <p className="kicker">// {v.angle}</p>
                <p className="gate-hook">“{v.hook}”</p>
                <ul>
                  {v.beats.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <p className="kicker">voice: {v.voice}</p>
                <button className="btn btn--sm" type="button" aria-pressed={pick === key} onClick={() => setPick(key)}>
                  Approve {key.toUpperCase()}
                </button>
              </div>
              {pick === key && (
                <span className="stamp slam gate-stamp" style={{ ["--stamp" as string]: "2.4rem" }}>
                  Approved
                </span>
              )}
            </Sheet>
          )
        })}
      </div>
      <p className="gate-log mono" aria-live="polite">
        {pick ? (
          <>
            $ pnpm run approve -- my-reel --variant {pick} <span>→ running to the end, no more stops.</span>
          </>
        ) : (
          <>Waiting for your yes. Nothing is voiced or built yet.</>
        )}
      </p>
      <style>{`
        .gate-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; }
        .gate-card { transition: opacity .15s linear; }
        .gate-card.lost { opacity: .45; }
        .gate-body { display: grid; gap: 12px; justify-items: start; padding: 20px; }
        .gate-hook { font-weight: 500; font-size: clamp(1.25rem, 2.3vw, 1.75rem); line-height: 1.14; letter-spacing: -.03em; }
        .gate-body ul { display: grid; gap: 3px; font-size: .95rem; color: var(--muted); }
        .gate-body li::before { content: "→ "; color: var(--accent); }
        .gate-stamp { position: absolute; right: 22px; bottom: 22px; background: #fff; }
        .gate-log { margin-top: 26px; font-size: .86rem; color: var(--muted); }
        .gate-log span { color: var(--yellow); }
        @media (max-width: 760px) { .gate-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
