import { REFUND_WINDOW_DAYS, SITE } from "@/lib/site"

export type Faq = { q: string; a: string; group: "product" | "buying" }

export const FAQ: Faq[] = [
  {
    group: "product",
    q: "What is Reel Studio Kit?",
    a: "Reel Studio Kit is a project folder you open in an AI coding agent such as Claude Code, Codex or Cursor. You type one line, for example “make a reel: 3 sleep mistakes that ruin your mornings”, and the agent researches the topic, writes two scripts, makes the voice and captions, builds the scenes in Remotion, checks its own frames and renders a 1080 × 1920 video.",
  },
  {
    group: "product",
    q: "What do I need to run it?",
    a: "An AI coding agent you already have access to, plus Node.js 18 or newer, ffmpeg and Python 3.10 to 3.14. The included doctor command installs what it can and prints the exact command for the rest. It has setup paths for Windows, macOS and Linux.",
  },
  {
    group: "product",
    q: "Does it need API keys?",
    a: "The kit itself needs none. The default voice uses free Edge neural voices, captions run locally with Whisper, and rendering runs on your own machine. Your AI coding agent is separate, so any plan or usage cost it has is yours.",
  },
  {
    group: "product",
    q: "Is this a hosted app or a subscription?",
    a: "Neither. You download a folder and it runs on your computer. Your scripts, audio and videos stay in that folder.",
  },
  {
    group: "product",
    q: "Can I use my own voice, brand and character?",
    a: "Yes. Record your own voice and pass the file in, change colours, font and corner radius in one file, and generate your own 20-pose sprite character from the included prompt, or use no avatar at all.",
  },
  {
    group: "product",
    q: "Does it work in Hindi or Hinglish?",
    a: "Yes. Prompts can be Hinglish, there are Indian English and Hindi voices, and caption sync accepts Hindi.",
  },
  {
    group: "product",
    q: "Do I need editing skills?",
    a: "No. You approve a script and give notes on a draft. You will be working in a terminal or agent window, so you should be comfortable pasting a prompt and following its setup steps.",
  },
  {
    group: "product",
    q: "Is music included?",
    a: "No. Drop your own royalty-free tracks into the music folder and the agent picks one per reel. It loops the bed, ducks it under the voice and fades it out. With an empty folder, reels are voice only.",
  },
  {
    group: "buying",
    q: "How much does it cost?",
    a: `${SITE.priceLabel} once, in US dollars. There is no subscription and no per-video fee. Local taxes may be added at checkout depending on where you are.`,
  },
  {
    group: "buying",
    q: "How do I receive it?",
    a: "Right after payment the success page gives you a download, and a delivery email follows. Inside the zip, a setup prompt gets your agent to install everything.",
  },
  {
    group: "buying",
    q: "Can I get a refund?",
    a: `No, except if you were charged twice for the same product. Tell us within ${REFUND_WINDOW_DAYS} days and we will refund the duplicate payment. The kit is delivered instantly as a digital download, so please read the requirements before buying. Rights you have by law are not affected.`,
  },
  {
    group: "buying",
    q: "Who will appear on my card statement?",
    a: "Dodo Payments is the Merchant of Record for this sale, so your statement and receipt show Dodo Payments, usually starting with DODOPAY_. Dodo also handles the applicable sales tax or VAT.",
  },
  {
    group: "buying",
    q: "Can I use it for client work and sell the videos?",
    a: "Yes. The licence covers unlimited reels for you and your clients, and you own your videos. You cannot share, resell or redistribute the kit itself.",
  },
  {
    group: "buying",
    q: "Are updates included?",
    a: "Yes, updates to version 1 are included at no extra cost.",
  },
  {
    group: "buying",
    q: "Is a Remotion licence included?",
    a: "No. Remotion, the video engine, has its own licence. It is free for individuals and small teams, while companies with four or more people need a Remotion company licence. Check remotion.dev/license before commercial use.",
  },
]
