import { useEffect, useMemo, useRef, useState } from "react"
import { Sheet } from "./Sheet"

// Spoken at the kit's target pace of about four words a second.
const LINE =
  "Type one line. The kit opens real *sources*, writes two scripts, and waits for your yes. Then every word on *screen* lands on the voice."

const build = () => {
  let t = 0
  return LINE.split(" ").map((raw) => {
    const emphasis = raw.includes("*")
    const word = raw.replace(/\*/g, "")
    const length = 0.14 + word.length * 0.022
    const entry = { word, emphasis, start: t, end: t + length }
    t += length + (/[.,]$/.test(word) ? 0.12 : 0.02)
    return entry
  })
}

export default function CaptionSync() {
  const words = useMemo(() => build(), [])
  const total = words[words.length - 1].end + 0.6
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [seen, setSeen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const clock = useRef(0)

  useEffect(() => {
    const el = box.current
    if (!el || seen) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      setSeen(true)
      setPlaying(!matchMedia("(prefers-reduced-motion: reduce)").matches)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [seen])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      clock.current = (clock.current + (now - last) / 1000) % total
      last = now
      setTime(clock.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, total])

  const seek = (t: number) => {
    clock.current = t
    setTime(t)
  }

  const current = words.findIndex((w) => time >= w.start && time < w.end + 0.03)
  const bars = 96
  return (
    <div ref={box}>
      <Sheet className="cap">
        <div className="win-head">
          <i /> public/reels/my-reel/captions.words.json
        </div>
        <p className="cap-words">
          {words.map((w, i) => (
            <button
              key={i}
              type="button"
              className={`${w.emphasis ? "em" : ""}`}
              data-on={i === current || undefined}
              data-past={time >= w.end || undefined}
              onClick={() => seek(w.start)}
              aria-label={`Seek to "${w.word}" at ${w.start.toFixed(2)} seconds`}
            >
              {w.word}
            </button>
          ))}
        </p>
        <div className="cap-wave" aria-hidden="true">
          {Array.from({ length: bars }, (_, i) => {
            const at = (i / bars) * total
            const speaking = words.some((w) => at >= w.start && at < w.end)
            const h = speaking ? 24 + (Math.sin(i * 1.7) * 0.5 + 0.5) * 70 : 6
            return <i key={i} style={{ height: `${h}%` }} data-past={at <= time || undefined} />
          })}
          <b style={{ left: `${(time / total) * 100}%` }} />
        </div>
        <div className="cap-foot">
          <button type="button" className="btn btn--sm btn--paper" onClick={() => setPlaying((p) => !p)}>
            {playing ? "Pause" : "Play"}
          </button>
          <p className="mono">
            {current >= 0 ? (
              <>
                {`{ "word": "${words[current].word}", "start": ${words[current].start.toFixed(2)}, "end": ${words[current].end.toFixed(2)} }`}
              </>
            ) : (
              "// click any word to jump to it"
            )}
          </p>
        </div>
      </Sheet>
      <style>{`
        .cap-words { display: flex; flex-wrap: wrap; align-items: baseline; gap: .1em .3em; min-height: 3.4em; padding: clamp(20px, 3vw, 34px); font-weight: 500; font-size: clamp(1.45rem, 3.6vw, 2.75rem); line-height: 1.14; letter-spacing: -.035em; }
        .cap-words button { cursor: pointer; color: #6f7178; border-radius: 6px; }
        .cap-words button[data-past] { color: var(--ink); }
        .cap-words button.em[data-past] { color: #cf4114; }
        .cap-words button[data-on] { color: var(--ink); background: var(--yellow); box-shadow: 0 0 0 3px var(--yellow); }
        .cap-words button.em[data-on] { color: #cf4114; }
        .cap-wave { position: relative; display: flex; align-items: center; gap: 2px; height: 74px; margin: 0 clamp(20px, 3vw, 34px); }
        .cap-wave i { flex: 1; min-width: 1px; border-radius: 1px; background: #cfd0c7; }
        .cap-wave i[data-past] { background: var(--ink); }
        .cap-wave b { position: absolute; top: -6px; bottom: -6px; width: 2px; background: var(--coral); }
        .cap-foot { display: flex; align-items: center; gap: 14px; padding: 16px clamp(20px, 3vw, 34px) 20px; min-height: 76px; }
        .cap-foot p { color: var(--muted); overflow-wrap: anywhere; }
      `}</style>
    </div>
  )
}
