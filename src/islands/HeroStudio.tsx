import { useEffect, useRef, useState, type FormEvent } from "react"
import "./hero-studio.css"

const SAMPLES = [
  "3 sleep mistakes that ruin your mornings",
  "how a heat pump works",
  "why your app feels slow",
  "the 5 second rule is a myth",
]

const STAGES = [
  { name: "research", log: (s: string) => `opened sources for "${s}"`, ms: 1500 },
  { name: "scripts", log: () => "variant-a.md + variant-b.md written", ms: 1500 },
  { name: "approve", log: () => "you said yes to variant A", ms: 1300 },
  { name: "voice + captions", log: () => "every word synced", ms: 1700 },
  { name: "scenes", log: () => "one file per scene", ms: 1700 },
  { name: "self-review", log: () => "no-go zones clear", ms: 1500 },
  { name: "final", log: (s: string) => `final/${s}.mp4 rendered`, ms: 3000 },
]

const slugify = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "my-reel"

/** Splits the topic for the reel headline: the longest word gets the serif italic emphasis. */
const Headline = ({ topic }: { topic: string }) => {
  const words = topic.trim().split(/\s+/).slice(0, 9)
  const longest = words.reduce((best, w, i) => (w.length > words[best].length ? i : best), 0)
  return (
    <p className="rs-headline">
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className={i === longest ? "em" : undefined} style={{ animationDelay: `${i * 45}ms` }}>
          {w}{" "}
        </span>
      ))}
    </p>
  )
}

const Frame = ({ stage, topic }: { stage: number; topic: string }) => (
  <div className="rs-frame" data-stage={stage}>
    <div className="rs-hud">
      {STAGES.map((s, i) => (
        <i key={s.name} data-on={i <= stage || undefined} />
      ))}
    </div>
    <Headline key={topic} topic={topic} />
    <div className="rs-stage">
      {stage === 0 && (
        <div className="rs-card rs-pop" key="s0">
          <b>sources.md</b>
          <span className="rs-line" />
          <span className="rs-line s" />
          <span className="rs-line" />
          <span className="rs-ok">opened ✓</span>
        </div>
      )}
      {stage === 1 && (
        <div className="rs-pair rs-pop" key="s1">
          <div className="rs-card">
            <b>A</b>
            <span className="rs-line" />
            <span className="rs-line s" />
          </div>
          <div className="rs-card">
            <b>B</b>
            <span className="rs-line s" />
            <span className="rs-line" />
          </div>
        </div>
      )}
      {stage === 2 && (
        <div className="rs-pop" key="s2">
          <span className="stamp slam" style={{ ["--stamp" as string]: "2.2rem" }}>
            Approved
          </span>
        </div>
      )}
      {stage === 3 && (
        <div className="rs-wave rs-pop" key="s3">
          {Array.from({ length: 22 }, (_, i) => (
            <i key={i} style={{ height: `${18 + ((i * 37) % 62)}%`, animationDelay: `${i * 40}ms` }} />
          ))}
        </div>
      )}
      {stage === 4 && (
        <div className="rs-card rs-big rs-pop" key="s4">
          <small>// 01 — the problem</small>
          <b>{Math.max(3, topic.length % 9)}</b>
          <span className="rs-line" />
        </div>
      )}
      {stage === 5 && (
        <div className="rs-pop" key="s5">
          <span className="rs-zone top" />
          <span className="rs-zone right" />
          <span className="rs-zone bottom" />
          <span className="rs-ok rs-center">safe ✓</span>
        </div>
      )}
      {stage === 6 && (
        <div className="rs-card rs-big rs-pop" key="s6">
          <small>// final</small>
          <b>1080×1920</b>
          <span className="rs-bar" />
        </div>
      )}
    </div>
    <img className="rs-abu" src={stage === 6 ? "/img/abu-thumbs-up.webp" : "/img/abu-present.webp"} alt="" width="110" height="92" />
  </div>
)

export default function HeroStudio() {
  const [input, setInput] = useState("")
  const [topic, setTopic] = useState(SAMPLES[0])
  const [stage, setStage] = useState(6)
  const [log, setLog] = useState<number[]>(STAGES.map((_, i) => i))
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const sample = useRef(0)

  const stop = () => clearTimeout(timer.current)

  const run = (next: string, loop: boolean) => {
    stop()
    setTopic(next)
    setLog([0])
    setStage(0)
    let i = 0
    const step = () => {
      timer.current = setTimeout(() => {
        i += 1
        if (i < STAGES.length) {
          setStage(i)
          setLog((l) => [...l, i])
          step()
        } else if (loop) {
          sample.current = (sample.current + 1) % SAMPLES.length
          run(SAMPLES[sample.current], true)
        }
      }, STAGES[i].ms)
    }
    step()
  }

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
    run(SAMPLES[0], true)
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = input.trim() || SAMPLES[0]
    run(value.slice(0, 70), false)
  }

  const slug = slugify(topic)
  return (
    <div className="rs">
      <div className="rs-phone">
        <Frame stage={stage} topic={topic} />
      </div>
      <div className="rs-term sheet sheet--ink">
        <div className="win-head">
          <i /> agent · reel-studio-kit
        </div>
        <form onSubmit={submit} className="rs-prompt">
          <label htmlFor="rs-topic">make a reel:</label>
          <input
            id="rs-topic"
            ref={inputRef}
            value={input}
            maxLength={70}
            onChange={(e) => setInput(e.target.value)}
            placeholder="type your topic"
            autoComplete="off"
            enterKeyHint="go"
          />
          <button type="submit" aria-label="Run the simulation">
            ↵
          </button>
        </form>
        <ol className="rs-log" aria-live="off">
          {log.map((i) => (
            <li key={i} data-done={i < stage || i === 6 || undefined}>
              <span>{STAGES[i].name}</span> {STAGES[i].log(slug)}
            </li>
          ))}
        </ol>
        <p className="rs-note">Simulated preview. The real run happens on your machine.</p>
      </div>
    </div>
  )
}
