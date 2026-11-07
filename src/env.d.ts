/// <reference types="astro/client" />

// Imported by name, not referenced globally: the Workers globals would overwrite the DOM types
// that the browser code needs.
type D1Database = import("@cloudflare/workers-types").D1Database
type R2Bucket = import("@cloudflare/workers-types").R2Bucket

interface Env {
  DB: D1Database
  KIT: R2Bucket
  REELS: R2Bucket
  CHECKOUT_LIMIT?: { limit(options: { key: string }): Promise<{ success: boolean }> }
  DODO_ENVIRONMENT: string
  DODO_PRODUCT_ID: string
  DODO_PAYMENTS_API_KEY: string
  DODO_PAYMENTS_WEBHOOK_KEY: string
  DOWNLOAD_SIGNING_SECRET: string
  PUBLIC_MEDIA_URL: string
}

declare module "cloudflare:workers" {
  export const env: Env
}
