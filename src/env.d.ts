/// <reference types="astro/client" />

// Imported by name, not referenced globally: the Workers globals would overwrite the DOM types
// that the browser code needs.
type D1Database = import("@cloudflare/workers-types").D1Database
type R2Bucket = import("@cloudflare/workers-types").R2Bucket

type RateLimit = { limit(options: { key: string }): Promise<{ success: boolean }> }

interface Env {
  DB: D1Database
  REELS: R2Bucket
  CHECKOUT_LIMIT?: RateLimit
  STATUS_LIMIT?: RateLimit
  DODO_ENVIRONMENT: string
  DODO_PRODUCT_ID: string
  DODO_BRAND_ID: string
  DODO_ENTITLEMENT_ID: string
  DODO_PAYMENTS_API_KEY: string
  DODO_PAYMENTS_WEBHOOK_KEY: string
  PUBLIC_MEDIA_URL: string
}

declare module "cloudflare:workers" {
  export const env: Env
}
