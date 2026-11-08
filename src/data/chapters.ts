// The homepage is cut like a reel: each section is a chapter, each chapter owns a mood and a HUD slot.
export type Mood = "light" | "ink" | "slate"

export const CHAPTERS = [
  { id: "hook", label: "hook", mood: "light" },
  { id: "proof", label: "proof", mood: "light" },
  { id: "pipeline", label: "pipeline", mood: "light" },
  { id: "gate", label: "the gate", mood: "ink" },
  { id: "captions", label: "captions", mood: "light" },
  { id: "reskin", label: "re-skin", mood: "light" },
  { id: "review", label: "self-review", mood: "slate" },
  { id: "box", label: "the box", mood: "light" },
  { id: "pricing", label: "pricing", mood: "ink" },
  { id: "agents", label: "requirements", mood: "light" },
  { id: "faq", label: "faq", mood: "light" },
] as const satisfies readonly { id: string; label: string; mood: Mood }[]

export const STAGES = [
  {
    n: "01",
    name: "Research",
    says: "It opens real sources. A facts check rejects any claim without an opened source, and any on-screen number that is not in the research.",
    file: "research/sources.md",
    cmd: "pnpm run facts",
  },
  {
    n: "02",
    name: "Two scripts",
    says: "Two different angles, each with the spoken script, chapters, what you will see in each one, the visual direction, sources and voice samples.",
    file: "script/variant-a.md",
    cmd: "pnpm run gate",
  },
  {
    n: "03",
    name: "You approve",
    says: "The only stop. Pick A or B, pick a voice, or ask for changes. Nothing is voiced or built before your yes.",
    file: "gate.md",
    cmd: "pnpm run approve",
  },
  {
    n: "04",
    name: "Voice, music, captions",
    says: "A natural voice at around four words a second, a music bed from your own folder, and captions synced to every word.",
    file: "captions.words.json",
    cmd: "pnpm run sync",
  },
  {
    n: "05",
    name: "Scenes",
    says: "Planned on the real voice timings, one code file per scene, with the card on screen changing state on the spoken word.",
    file: "scenes/01-hook.tsx",
    cmd: "pnpm run plan",
  },
  {
    n: "06",
    name: "Self-review",
    says: "At most three rounds. Frames are checked with Instagram's no-go zones drawn on, plus spot checks, preview clips and motion rhythm, then fixed.",
    file: "review/round-1/",
    cmd: "pnpm run review",
  },
  {
    n: "07",
    name: "Final",
    says: "Your 1080 × 1920 video, plus a caption, hashtags and the source links, all in one folder you own.",
    file: "final/my-reel.mp4",
    cmd: "pnpm run final",
  },
] as const
