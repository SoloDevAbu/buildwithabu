import { useState } from "react"
import { Sheet } from "./Sheet"

const TREE = [
  { path: "AGENTS.md, CLAUDE.md", depth: 0, says: "Everything your agent needs to know about the folder. Claude Code, Codex, Cursor and others read it, so you don't explain anything." },
  { path: ".agents/skills/reels/", depth: 0, says: "The full workflow: an orchestrator plus one skill per stage, with reference notes on quality, hooks, metaphors and voice." },
  { path: "src/brand.ts", depth: 0, says: "One file for colours, font, corner radius, shadow and handle. Every component follows it." },
  { path: "src/presets.ts", depth: 0, says: "Ready looks you can switch to in one line." },
  { path: "src/motion/", depth: 0, says: "The motion system: presets, beats, headlines, HUD, FX and punch effects." },
  { path: "src/components/", depth: 0, says: "Cards, stickers, stamps, marker marks, stats and physical objects like shredders and tear-off calendars." },
  { path: "src/avatars/", depth: 0, says: "A ready sprite character, a flat mascot and the player. Mouths follow the voice loudness." },
  { path: "projects/<id>/", depth: 0, says: "One folder per reel: brief, sources, both scripts, your approval, a decision log, review rounds and the final video. Stop any time and pick it up later." },
  { path: "tools/", depth: 0, says: "One script per command, including the doctor that sets everything up." },
  { path: "sprites/PROMPT.md", depth: 0, says: "A prompt for making your own 20-pose character in any image generator." },
  { path: "music/", depth: 0, says: "Empty. Your royalty-free tracks go here, named by mood." },
]

export default function BoxExplorer() {
  const [open, setOpen] = useState(0)
  return (
    <Sheet className="box">
      <div className="win-head">
        <i /> abu-reel-kit/
      </div>
      <div className="box-grid">
        <ul className="box-tree" role="listbox" aria-label="Folders in the kit">
          {TREE.map((item, i) => (
            <li key={item.path} role="presentation">
              <button type="button" role="option" aria-selected={open === i} onClick={() => setOpen(i)} onMouseEnter={() => setOpen(i)}>
                {item.path}
              </button>
            </li>
          ))}
        </ul>
        <div className="box-panel" aria-live="polite">
          <p className="kicker">// {TREE[open].path}</p>
          <p className="box-says">{TREE[open].says}</p>
        </div>
      </div>
      <style>{`
        .box-grid { display: grid; grid-template-columns: minmax(0, 340px) minmax(0, 1fr); }
        .box-tree { padding: 10px; border-right: 2px solid var(--ink); }
        .box-tree button { display: block; width: 100%; min-height: 36px; padding: 6px 10px; border-radius: 7px; text-align: left; font-family: var(--mono); font-size: .84rem; cursor: pointer; }
        .box-tree button[aria-selected=true] { background: var(--yellow); }
        .box-panel { display: grid; align-content: center; gap: 12px; padding: clamp(20px, 4vw, 44px); min-height: 200px; }
        .box-says { font-weight: 500; font-size: clamp(1.25rem, 2.4vw, 1.9rem); line-height: 1.16; letter-spacing: -.028em; text-wrap: pretty; }
        @media (max-width: 720px) { .box-grid { grid-template-columns: 1fr; } .box-tree { border-right: 0; border-bottom: 2px solid var(--ink); } .box-panel { order: -1; border-bottom: 2px solid var(--ink); } .box-tree { order: 1; border-bottom: 0; } }
      `}</style>
    </Sheet>
  )
}
