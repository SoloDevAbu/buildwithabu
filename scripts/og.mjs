// Renders the social card to public/og/. Runs in Node because resvg is a native module and
// prerendering happens inside workerd. Re-run after changing the copy: pnpm og
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { Resvg } from "@resvg/resvg-js"
import satori from "satori"

const font = (file) => readFileSync(`node_modules/${file}`)
const fonts = [
  { name: "Inter", data: font("@fontsource/inter/files/inter-latin-500-normal.woff"), weight: 500, style: "normal" },
  { name: "Serif", data: font("@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff"), weight: 400, style: "italic" },
  { name: "Mono", data: font("@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff"), weight: 400, style: "normal" },
]

const el = (type, style, ...children) => ({ type, props: { style: { display: "flex", ...style }, children } })

const abu = `data:image/png;base64,${readFileSync("scripts/assets/abu-present.png").toString("base64")}`

const card = el(
  "div",
  { width: 1200, height: 630, padding: 64, flexDirection: "column", justifyContent: "space-between", backgroundColor: "#e8e9e1", color: "#121316", fontFamily: "Inter" },
  el("div", { fontFamily: "Mono", fontSize: 28, color: "#565962" }, "// abu reel kit"),
  el(
    "div",
    { flexDirection: "column", fontSize: 104, letterSpacing: -4.5, lineHeight: 1.02 },
    el("div", {}, "One line in."),
    el("div", { fontFamily: "Serif", fontStyle: "italic", fontSize: 118, color: "#cf4114" }, "Finished reel"),
    el("div", {}, "out."),
  ),
  el("div", { fontFamily: "Mono", fontSize: 28 }, "$16 once · buildwithabu.xyz"),
  { type: "img", props: { src: abu, width: 420, height: 350, style: { position: "absolute", right: 34, bottom: 0 } } },
)

const svg = await satori(card, { width: 1200, height: 630, fonts })
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng()
mkdirSync("public/og", { recursive: true })
writeFileSync("public/og/default.png", png)
console.log(`public/og/default.png ${(png.length / 1024).toFixed(0)} KB`)

// Search engines want a raster logo for the Organization, at least 112px square.
const logo = new Resvg(readFileSync("public/favicon.svg"), { fitTo: { mode: "width", value: 512 } }).render().asPng()
writeFileSync("public/logo.png", logo)
console.log(`public/logo.png ${(logo.length / 1024).toFixed(0)} KB`)
