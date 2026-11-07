// Uploads the sellable zip to the private bucket and makes it the current download.
//
//   pnpm kit:release path/to/reel-studio-kit.zip --version 1.0.0 [--local]
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { parseArgs } from "node:util"

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: { version: { type: "string" }, local: { type: "boolean", default: false } },
})

const zip = positionals[0]
if (!zip || !existsSync(zip) || !args.version || !/^[0-9A-Za-z.-]+$/.test(args.version)) {
  console.error("Usage: pnpm kit:release <kit.zip> --version 1.0.0 [--local]")
  process.exit(1)
}

const scope = args.local ? "--local" : "--remote"
const run = (list) => {
  const result = spawnSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", ...list], { stdio: "inherit" })
  if (result.status !== 0) throw new Error(`wrangler ${list[0]} failed`)
}

const key = `releases/reel-studio-kit-${args.version}.zip`
const sha256 = createHash("sha256").update(readFileSync(zip)).digest("hex")
const size = statSync(zip).size

run(["r2", "object", "put", `reel-kit-private/${key}`, "--file", zip, "--content-type", "application/zip", scope])

const work = mkdtempSync(path.join(tmpdir(), "kit-"))
try {
  const sqlFile = path.join(work, "release.sql")
  writeFileSync(
    sqlFile,
    `INSERT OR REPLACE INTO kit_releases (version, r2_key, sha256, size_bytes, released_at) VALUES ('${args.version}', '${key}', '${sha256}', ${size}, '${new Date().toISOString()}');`,
  )
  run(["d1", "execute", "buildwithabu", scope, "--file", sqlFile])
} finally {
  rmSync(work, { recursive: true, force: true })
}
console.log(`\nv${args.version} is live. ${(size / 1e6).toFixed(1)} MB, sha256 ${sha256}`)
