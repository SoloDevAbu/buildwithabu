// Comparisons are against approaches, not named competitors, so every row stays true over time.
export type Comparison = {
  slug: string
  title: string
  description: string
  heading: string
  answer: string
  other: string
  rows: [string, string, string][]
  pick: { kit: string[]; other: string[] }
}

export const COMPARISONS: Comparison[] = [
  {
    slug: "kit-vs-editing-by-hand",
    title: "Abu Reel Kit vs Editing Reels by Hand",
    description: "When to use an AI agent kit for reels and when a manual editor is still the better choice. An honest comparison.",
    heading: "Abu Reel Kit vs editing by hand",
    answer: "Editing by hand is better for filmed footage and work that depends on feel. Abu Reel Kit is better for explainers built from text, cards and motion, where you want a repeatable style without doing each edit yourself.",
    other: "Manual editor",
    rows: [
      ["Best material", "Explainers, lists, breakdowns, built scenes", "Filmed footage, vlogs, talking heads"],
      ["Your job", "Choose a script, give notes", "Every cut, caption and keyframe"],
      ["Changing the look", "One brand file", "Update each project or template"],
      ["Skill needed", "Comfort with an agent and terminal", "Editing software and motion skills"],
      ["Fine creative control", "Through notes or code", "Direct, on the timeline"],
    ],
    pick: {
      kit: ["You post explainers often", "You want research and sources built in", "You prefer directing over editing"],
      other: ["Your reels are mainly camera footage", "You enjoy editing and want every frame by hand"],
    },
  },
  {
    slug: "kit-vs-hosted-ai-video-tools",
    title: "Abu Reel Kit vs Hosted AI Video Tools",
    description: "A local, one-time kit compared with hosted AI video apps: cost model, ownership, control and ease of use.",
    heading: "Abu Reel Kit vs hosted AI video tools",
    answer: "Hosted AI video tools are easier to start with because they run in a browser. Abu Reel Kit runs on your computer for a one-time price, with a folder you can read and change, but it needs an AI coding agent and some setup.",
    other: "Hosted AI video app",
    rows: [
      ["Where it runs", "Your computer", "The vendor's servers"],
      ["Pricing model", "$16 once", "Usually a subscription or credits"],
      ["Setup", "An agent, Node, ffmpeg, Python", "Usually just a login"],
      ["Control", "Every file can be changed", "Limited to the app's options"],
      ["Your files", "Stay in your folder", "Depends on the service"],
    ],
    pick: {
      kit: ["You already use an AI coding agent", "You want to own the workflow", "You don't want another subscription"],
      other: ["You want no setup at all", "You don't use a terminal or agent"],
    },
  },
  {
    slug: "kit-vs-building-on-remotion",
    title: "Abu Reel Kit vs Building on Remotion Yourself",
    description: "Should you build your own reel system on Remotion or start from a kit? What you'd need to build and when DIY makes sense.",
    heading: "Abu Reel Kit vs building on Remotion yourself",
    answer: "Building on Remotion yourself gives you full freedom, but you must create the motion system, components, voice, captions, checks and agent workflow. Abu Reel Kit starts you with all of those, and you can still change anything.",
    other: "Remotion from scratch",
    rows: [
      ["Video engine", "Remotion", "Remotion"],
      ["Motion and components", "Included", "You build them"],
      ["Voice and captions", "Included tools", "You wire them up"],
      ["Agent workflow and checks", "Included", "You write them"],
      ["Upfront time", "Setup prompt", "Your own development time"],
    ],
    pick: {
      kit: ["You want to make reels now", "You want to learn from a working system"],
      other: ["You need a very different format", "Building the system is the goal"],
    },
  },
]
