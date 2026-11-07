import { useState } from "react"

// Same numbers as the kit's src/layout.ts, as a share of 1080 × 1920.
const ZONE = { top: 220 / 19.2, bottom: 380 / 19.2, right: 120 / 10.8, left: 60 / 10.8 }

const ROUNDS = [
  { key: "draft", label: "Draft", note: "The stat card runs under the like and share buttons, and the sticker sits in the caption area.", tone: "#d62f2f" },
  { key: "fixed", label: "After review", note: "Card pulled back inside the safe box, sticker moved up. Red zones now clear.", tone: "#0c8a63" },
] as const

export default function ReviewBench() {
  const [round, setRound] = useState(0)
  const [zones, setZones] = useState(true)
  const fixed = round === 1
  return (
    <div className="bench">
      <div className="bench-frame">
        <p className="bench-head">
          Your app is <span className="em">slower</span> than you think
        </p>
        <div className="bench-card" data-fixed={fixed || undefined}>
          <small>// load time</small>
          <b>4.2s</b>
        </div>
        <span className="sticker bench-sticker" data-fixed={fixed || undefined}>
          <small>// fix</small>
          <b>Skeleton screens</b>
        </span>
        {zones && (
          <div aria-hidden="true">
            <i className="zone" style={{ inset: `0 0 auto`, height: `${ZONE.top}%` }} />
            <i className="zone" style={{ inset: `auto 0 0`, height: `${ZONE.bottom}%` }} />
            <i className="zone" style={{ top: `${ZONE.top}%`, bottom: `${ZONE.bottom}%`, right: 0, width: `${ZONE.right}%` }} />
            <i className="zone" style={{ top: `${ZONE.top}%`, bottom: `${ZONE.bottom}%`, left: 0, width: `${ZONE.left}%` }} />
          </div>
        )}
      </div>

      <div className="bench-side">
        <div className="bench-tabs" role="group" aria-label="Review round">
          {ROUNDS.map((r, i) => (
            <button key={r.key} type="button" className="btn btn--sm btn--paper" aria-pressed={round === i} onClick={() => setRound(i)}>
              {r.label}
            </button>
          ))}
          <label className="bench-toggle">
            <input type="checkbox" checked={zones} onChange={(e) => setZones(e.target.checked)} />
            Show no-go zones
          </label>
        </div>
        <p className="bench-note" aria-live="polite">
          {ROUNDS[round].note}
        </p>
        <span key={round} className="stamp slam" style={{ ["--stamp" as string]: "2rem", ["--stamp-color" as string]: fixed ? "#7ff0c8" : "#ffd5d5", rotate: "-4deg" }}>
          {fixed ? "Passed" : "Rejected"}
        </span>
      </div>
      <style>{`
        .bench { display: grid; grid-template-columns: minmax(0, 340px) minmax(0, 1fr); gap: clamp(28px, 5vw, 70px); align-items: center; }
        .bench-head .em { color: #b83a10; }
        .bench-frame { position: relative; aspect-ratio: 9 / 16; overflow: hidden; border: 2px solid var(--ink); border-radius: 20px; background: var(--paper); color: var(--ink); --accent: #cf4114; }
        .bench-head { position: absolute; left: 7%; right: 13%; top: 13.5%; font-weight: 500; font-size: clamp(1.25rem, 2.4vw, 1.6rem); line-height: 1.08; letter-spacing: -.03em; }
        .bench-card { position: absolute; left: 9%; top: 37%; width: 104%; padding: 14px; background: #fff; border: 2px solid var(--ink); border-radius: 14px; transition: width .4s var(--spring); }
        .bench-card[data-fixed] { width: 78%; }
        .bench-card small { display: block; font-family: var(--mono); font-size: .7rem; color: #cf4114; }
        .bench-card b { font-size: 3.2rem; line-height: 1; letter-spacing: -.06em; color: #cf4114; }
        .bench-sticker { position: absolute; left: 22%; top: 84%; transition: top .4s var(--spring); white-space: nowrap; }
        .bench-sticker[data-fixed] { top: 66%; }
        .zone { position: absolute; background: rgb(239 68 68 / .24); outline: 1.5px dashed var(--red); outline-offset: -1px; }
        .bench-side { display: grid; gap: 18px; justify-items: start; }
        .bench-tabs { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
        .bench-tabs .btn { color: var(--ink); }
        .bench-tabs .btn[aria-pressed=true] { background: var(--yellow); }
        .bench-toggle { display: inline-flex; gap: 8px; align-items: center; min-height: 40px; font-size: .92rem; cursor: pointer; }
        .bench-toggle input { width: 18px; height: 18px; accent-color: var(--yellow); }
        .bench-note { font-size: clamp(1.15rem, 2vw, 1.5rem); line-height: 1.25; letter-spacing: -.02em; max-width: 34ch; min-height: 4em; }
        @media (max-width: 720px) { .bench { grid-template-columns: 1fr; } .bench-frame { max-width: 320px; width: 100%; justify-self: center; } }
      `}</style>
    </div>
  )
}
