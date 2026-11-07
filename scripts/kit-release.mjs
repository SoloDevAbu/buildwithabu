// Swaps the zip that Dodo delivers to buyers. Reads DODO_PAYMENTS_API_KEY from the environment or
// .dev.vars, and the entitlement id from wrangler.jsonc unless you pass one.
//
//   pnpm kit:release path/to/reel-studio-kit.zip [--live] [--entitlement ent_...]
import { existsSync, openAsBlob, readFileSync, statSync } from "node:fs"
import { parseArgs } from "node:util"

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: { live: { type: "boolean", default: false }, entitlement: { type: "string" } },
})

const zip = positionals[0]
if (!zip || !existsSync(zip)) {
  console.error("Usage: pnpm kit:release <kit.zip> [--live] [--entitlement ent_...]")
  process.exit(1)
}

const fromDevVars = () => (existsSync(".dev.vars") ? readFileSync(".dev.vars", "utf8").match(/^DODO_PAYMENTS_API_KEY=(.+)$/m)?.[1].trim() : undefined)
const key = process.env.DODO_PAYMENTS_API_KEY ?? fromDevVars()
const entitlement = args.entitlement ?? readFileSync("wrangler.jsonc", "utf8").match(/"DODO_ENTITLEMENT_ID":\s*"([^"]+)"/)?.[1]
if (!key || !entitlement) {
  console.error("Missing DODO_PAYMENTS_API_KEY or the entitlement id.")
  process.exit(1)
}

const base = args.live ? "https://live.dodopayments.com" : "https://test.dodopayments.com"
const call = async (path, init = {}) => {
  const res = await fetch(`${base}${path}`, { ...init, headers: { authorization: `Bearer ${key}`, ...init.headers } })
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} failed: ${res.status} ${await res.text()}`)
  return res.status === 204 ? null : res.json().catch(() => null)
}

const current = await call(`/entitlements/${entitlement}`)
const oldFiles = current.integration_config?.digital_files?.files ?? []

const form = new FormData()
form.append("filename", "reel-studio-kit.zip")
form.append("file", await openAsBlob(zip, { type: "application/zip" }), "reel-studio-kit.zip")
const { file_id } = await call(`/entitlements/${entitlement}/files`, { method: "POST", body: form })

// Remove old files only after the new one is safely attached.
for (const file of oldFiles) await call(`/entitlements/${entitlement}/files/${file.file_id}`, { method: "DELETE" })

console.log(`${args.live ? "LIVE" : "Test"}: ${(statSync(zip).size / 1e6).toFixed(1)} MB uploaded as ${file_id}, ${oldFiles.length} old file(s) removed.`)
