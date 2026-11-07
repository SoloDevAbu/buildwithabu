import { defineMiddleware } from "astro:middleware"

// Static files get these from public/_headers. On-demand pages come through here.
const HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "content-security-policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://media.buildwithabu.xyz; media-src https://media.buildwithabu.xyz; font-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; form-action 'self'; base-uri 'self'; frame-ancestors 'none'",
}

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next()
  if (context.isPrerendered) return response
  for (const [name, value] of Object.entries(HEADERS)) response.headers.set(name, value)
  return response
})
