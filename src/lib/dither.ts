// The kit's signature depth, ported from its DitherShadow component: a soft shadow falling
// bottom-left, printed as a halftone. One SVG path per box size, nothing but dots.
export type DitherOpts = {
  w: number
  h: number
  radius?: number
  dx?: number
  dy?: number
  blur?: number
  pitch?: number
  maxDot?: number
  strength?: number
}

// Abramowitz-Stegun 7.1.26: plenty accurate for dot sizes.
const erf = (x: number) => {
  const s = Math.sign(x)
  const a = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * a)
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-a * a)
  return s * y
}

const band = (x: number, a: number, b: number, sigma: number) => {
  const k = 1 / (Math.SQRT2 * sigma)
  return 0.5 * (erf((x - a) * k) - erf((x - b) * k))
}

const insideRounded = (x: number, y: number, w: number, h: number, r: number) => {
  if (x < 0 || y < 0 || x > w || y > h) return false
  const cx = x < r ? r : x > w - r ? w - r : x
  const cy = y < r ? r : y > h - r ? h - r : y
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}

export const ditherPath = (o: DitherOpts) => {
  const { w, h, dx = -11, dy = 14, blur = 9, pitch = 4.5, maxDot = 2.5, strength = 1 } = o
  const radius = Math.min(o.radius ?? 18, w / 2, h / 2)
  const pad = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) + blur * 3 + maxDot)
  const parts: string[] = []
  for (let gy = -pad; gy <= h + pad; gy += pitch) {
    const ay = band(gy, dy, dy + h, blur)
    if (ay < 0.02) continue
    const shift = (Math.round((gy + pad) / pitch) % 2) * (pitch / 2)
    for (let gx = -pad + shift; gx <= w + pad; gx += pitch) {
      // Skip the dots behind the box. Everything inside is hidden by the card anyway.
      if (
        insideRounded(gx, gy, w, h, Math.max(0, radius - 1)) &&
        gx > 1.5 &&
        gy > 1.5 &&
        gx < w - 1.5 &&
        gy < h - 1.5
      )
        continue
      const a = Math.min(1, band(gx, dx, dx + w, blur) * ay * strength)
      const r = maxDot * Math.sqrt(a)
      if (r < 0.4) continue
      const x = gx + pad
      const y = gy + pad
      parts.push(
        `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0`,
      )
    }
  }
  return { d: parts.join(""), pad }
}

const SMALL = { dx: -6, dy: 8, blur: 5, pitch: 3.6, maxDot: 2 }
const SVG_NS = "http://www.w3.org/2000/svg"

const paint = (el: HTMLElement) => {
  const w = el.offsetWidth
  const h = el.offsetHeight
  if (!w || !h) return
  const size = `${w}x${h}`
  if (el.dataset.ditherDrawn === size) return
  el.dataset.ditherDrawn = size
  const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
  const { d, pad } = ditherPath({ w, h, radius, ...(el.dataset.dither === "sm" ? SMALL : {}) })
  let svg = el.querySelector<SVGSVGElement>(":scope > svg.dither")
  if (!svg) {
    svg = document.createElementNS(SVG_NS, "svg")
    svg.setAttribute("class", "dither")
    svg.setAttribute("aria-hidden", "true")
    svg.appendChild(document.createElementNS(SVG_NS, "path"))
    el.appendChild(svg)
  }
  svg.setAttribute("width", String(w + pad * 2))
  svg.setAttribute("height", String(h + pad * 2))
  svg.style.left = svg.style.top = `${-pad - 2}px`
  svg.firstElementChild?.setAttribute("d", d)
}

let sizes: ResizeObserver | undefined
let views: IntersectionObserver | undefined

/** Draws on first sight, then follows the element's size. Safe to call twice. */
export const attachDither = (el: HTMLElement) => {
  sizes ??= new ResizeObserver((entries) => entries.forEach((e) => paint(e.target as HTMLElement)))
  views ??= new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        views?.unobserve(e.target)
        paint(e.target as HTMLElement)
        sizes?.observe(e.target)
      }),
    { rootMargin: "300px" },
  )
  views.observe(el)
}
