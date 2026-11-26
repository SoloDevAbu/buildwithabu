import { attachDither } from "@/lib/dither"

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches
if (calm) document.documentElement.classList.add("calm")

// Halftone shadows, including on content that arrives late.
const armDither = (root: Document | Element = document) =>
  root.querySelectorAll<HTMLElement>("[data-dither]").forEach(attachDither)
armDither()
new MutationObserver((records) =>
  records.forEach((r) =>
    r.addedNodes.forEach((n) => {
      if (n instanceof HTMLElement) {
        if (n.hasAttribute("data-dither")) attachDither(n)
        armDither(n as Element)
      }
    }),
  ),
).observe(document.body, { childList: true, subtree: true })

// Cards pop in on sight, once.
const pops = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      e.target.classList.add("in")
      pops.unobserve(e.target)
    }),
  { rootMargin: "0px 0px -8% 0px" },
)
document.querySelectorAll("[data-pop]").forEach((el) => pops.observe(el))

// Moods: when a chapter crosses the middle of the screen, the whole page hard-cuts. No fades.
const chapters = [...document.querySelectorAll<HTMLElement>("section[data-chapter]")]
const hud = document.querySelector<HTMLElement>("[data-hud]")
const slots = hud ? [...hud.querySelectorAll<HTMLElement>("[data-slot]")] : []
const hudLabel = hud?.querySelector<HTMLElement>("[data-hud-label]")
const hudTime = hud?.querySelector<HTMLElement>("[data-hud-time]")

const setChapter = (i: number) => {
  const section = chapters[i]
  if (!section) return
  document.documentElement.dataset.mood = section.dataset.mood ?? "light"
  if (!hud) return
  slots.forEach((slot, n) => slot.toggleAttribute("data-on", n <= i))
  if (hudLabel) hudLabel.textContent = section.dataset.label ?? ""
  hud.toggleAttribute("data-done", section.id === "pricing" || section.id === "faq")
}

if (chapters.length) {
  const middle = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) setChapter(chapters.indexOf(e.target as HTMLElement))
      }),
    { rootMargin: "-50% 0px -50% 0px" },
  )
  chapters.forEach((c) => middle.observe(c))
}

// The HUD reads the page like a 0:45 reel, and stays out of the way of the hero and the buy button.
if (hud) {
  const pricing = document.getElementById("pricing")
  let queued = false
  const tick = () => {
    queued = false
    const max = document.documentElement.scrollHeight - innerHeight
    const seconds = Math.round((Math.min(1, scrollY / Math.max(1, max)) || 0) * 45)
    if (hudTime) hudTime.textContent = `00:${String(seconds).padStart(2, "0")}`
    const box = pricing?.getBoundingClientRect()
    const atPricing = !!box && box.top < innerHeight * 0.7 && box.bottom > innerHeight * 0.3
    hud.toggleAttribute("data-show", scrollY > 520 && !atPricing)
  }
  addEventListener(
    "scroll",
    () => {
      if (queued) return
      queued = true
      requestAnimationFrame(tick)
    },
    { passive: true },
  )
  tick()
}

// Pipeline: the sticky artifact follows whichever step is in the middle of the screen.
const steps = [...document.querySelectorAll<HTMLElement>("[data-step]")]
const plates = [...document.querySelectorAll<HTMLElement>("[data-plate]")]
if (steps.length && plates.length) {
  const show = (i: number) => {
    steps.forEach((s, n) => s.toggleAttribute("data-active", n === i))
    plates.forEach((p, n) => p.toggleAttribute("data-active", n === i))
  }
  show(0)
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) show(steps.indexOf(e.target as HTMLElement))
      }),
    { rootMargin: "-46% 0px -46% 0px" },
  )
  steps.forEach((s) => io.observe(s))
}

// Hover a reel card to play its muted teaser across all pages, including deferred server islands.
if (matchMedia("(hover: hover)").matches && !calm) {
  document.addEventListener("pointerover", (event) => {
    const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(".reel[data-teaser]")
    if (!card || card.querySelector("video") || !card.dataset.teaser) return
    const video = document.createElement("video")
    video.src = card.dataset.teaser
    video.muted = true
    video.loop = true
    video.playsInline = true
    card.querySelector("img")?.after(video)
    const cleanup = () => {
      video.pause()
      video.removeAttribute("src")
      video.load()
      video.remove()
    }
    video.play().catch(cleanup)
    card.addEventListener("pointerleave", cleanup, { once: true })
  })
}
