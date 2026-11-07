import { useState } from "react"
import "@fontsource-variable/space-grotesk/wght.css"
import "@fontsource-variable/nunito/wght.css"
import { Sheet } from "./Sheet"

type Look = {
  bg: string
  surface: string
  text: string
  stroke: string
  accent: string
  font: "Inter" | "SpaceGrotesk" | "Nunito"
  radius: number
}

// The kit's own presets from src/presets.ts.
const PRESETS: Record<string, Look> = {
  editorialLight: { bg: "#E8E9E1", surface: "#FFFFFF", text: "#111215", stroke: "#121316", accent: "#EE5D31", font: "Inter", radius: 24 },
  darkSlate: { bg: "#0D0F12", surface: "#16181D", text: "#F0F2F5", stroke: "#2A2D35", accent: "#FEE75C", font: "SpaceGrotesk", radius: 20 },
  electricOrange: { bg: "#FF4713", surface: "#FDFDF9", text: "#111215", stroke: "#FFFFFF", accent: "#FF4713", font: "Inter", radius: 24 },
  softPastel: { bg: "#FBF3EC", surface: "#FFFFFF", text: "#2A2433", stroke: "#2A2433", accent: "#E8590C", font: "Nunito", radius: 44 },
}

const ACCENTS = ["#EE5D31", "#FEE75C", "#10B981", "#3B82F6", "#E11D74"]
const FONT_CSS = { Inter: "var(--sans)", SpaceGrotesk: "'Space Grotesk Variable', sans-serif", Nunito: "'Nunito Variable', sans-serif" }

export default function ReskinLab() {
  const [name, setName] = useState("editorialLight")
  const [look, setLook] = useState<Look>(PRESETS.editorialLight)
  const set = (patch: Partial<Look>) => {
    setLook((l) => ({ ...l, ...patch }))
    setName("custom")
  }
  const scale = 0.62
  return (
    <div className="lab">
      <div className="lab-preview" aria-hidden="true" style={{ background: look.bg, fontFamily: FONT_CSS[look.font] }}>
        <p className="lab-head" style={{ color: look.bg === "#FF4713" ? "#fff" : look.text }}>
          Your brand, <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: look.bg === "#FF4713" ? "#FEE75C" : look.accent }}>every frame.</span>
        </p>
        <div className="lab-card" style={{ background: look.surface, color: look.text, borderColor: look.stroke, borderRadius: look.radius * scale }}>
          <small style={{ color: look.accent }}>// 02 — the fix</small>
          <b style={{ color: look.accent }}>1 file</b>
          <span>Re-skins every card, caption and sticker.</span>
          <i style={{ background: look.accent, borderRadius: look.radius * 0.2 }} />
        </div>
      </div>

      <div className="lab-side">
        <Sheet className="lab-controls">
          <fieldset>
            <legend className="kicker">// preset</legend>
            <div className="lab-row">
              {Object.keys(PRESETS).map((p) => (
                <button
                  key={p}
                  type="button"
                  className="lab-chip"
                  aria-pressed={name === p}
                  onClick={() => {
                    setLook(PRESETS[p])
                    setName(p)
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="kicker">// accent</legend>
            <div className="lab-row">
              {ACCENTS.map((c) => (
                <button key={c} type="button" className="lab-swatch" style={{ background: c }} aria-label={`Accent ${c}`} aria-pressed={look.accent === c} onClick={() => set({ accent: c })} />
              ))}
            </div>
          </fieldset>
          <label className="lab-range">
            <span className="kicker">// radius {look.radius}</span>
            <input type="range" min={0} max={44} value={look.radius} onChange={(e) => set({ radius: Number(e.target.value) })} />
          </label>
          <fieldset>
            <legend className="kicker">// font</legend>
            <div className="lab-row">
              {(["Inter", "SpaceGrotesk", "Nunito"] as const).map((f) => (
                <button key={f} type="button" className="lab-chip" aria-pressed={look.font === f} style={{ fontFamily: FONT_CSS[f] }} onClick={() => set({ font: f })}>
                  {f}
                </button>
              ))}
            </div>
          </fieldset>
        </Sheet>
        <pre className="lab-code" aria-label="The matching src/brand.ts values">
          <code>
            <span>// src/brand.ts</span>
            {`
colors: {
  bg:     "${look.bg}",
  accent: "${look.accent}",
},
font:   "${look.font}",
radius: ${look.radius},`}
          </code>
        </pre>
      </div>
      <style>{`
        .lab { display: grid; grid-template-columns: minmax(0, 400px) minmax(0, 1fr); gap: 34px; align-items: start; }
        .lab-preview { aspect-ratio: 9 / 13; display: flex; flex-direction: column; gap: 22px; padding: 30px 24px; border: 2px solid var(--ink); border-radius: 22px; overflow: hidden; }
        .lab-head { font-weight: 500; font-size: clamp(1.9rem, 3.4vw, 2.5rem); line-height: 1.04; letter-spacing: -.035em; }
        .lab-card { display: grid; gap: 8px; padding: 20px; border: 2px solid; margin-top: auto; margin-bottom: 32px; }
        .lab-card small { font-family: var(--mono); font-size: .74rem; }
        .lab-card b { font-size: 4.2rem; line-height: .9; letter-spacing: -.06em; }
        .lab-card span { font-size: .96rem; line-height: 1.3; }
        .lab-card i { height: 8px; margin-top: 6px; }
        .lab-side { display: grid; gap: 28px; }
        .lab-controls { display: grid; gap: 18px; padding: 20px; }
        .lab-row { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 7px; }
        .lab-chip { min-height: 38px; padding: 0 12px; border: 2px solid var(--ink); border-radius: 9px; font-family: var(--mono); font-size: .78rem; cursor: pointer; }
        .lab-chip[aria-pressed=true] { background: var(--ink); color: #fff; }
        .lab-swatch { width: 38px; height: 38px; border: 2px solid var(--ink); border-radius: 50%; cursor: pointer; }
        .lab-swatch[aria-pressed=true] { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--ink); }
        .lab-range { display: grid; gap: 6px; }
        .lab-range input { accent-color: var(--coral); width: 100%; height: 28px; }
        .lab-code { margin: 0; padding: 18px 20px; border: 2px solid var(--ink); border-radius: 14px; background: #16181d; color: #efefe7; font-family: var(--mono); font-size: .84rem; line-height: 1.5; overflow-x: auto; }
        .lab-code span { color: #b1b3a9; }
        @media (max-width: 860px) { .lab { grid-template-columns: 1fr; } .lab-preview { max-width: 400px; width: 100%; justify-self: center; } }
      `}</style>
    </div>
  )
}
