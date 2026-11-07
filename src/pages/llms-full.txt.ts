import type { APIRoute } from "astro"
import { STAGES } from "@/data/chapters"
import { FAQ } from "@/data/faq"
import { SITE } from "@/lib/site"

export const GET: APIRoute = () => {
  const body = `# ${SITE.product}: full reference

${SITE.description}

## Stages
${STAGES.map((s) => `${s.n}. ${s.name}: ${s.says}`).join("\n")}

## Questions and answers
${FAQ.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")}
`
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } })
}
