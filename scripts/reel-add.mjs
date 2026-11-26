// Publishes a reel to the site without a redeploy.
//
//   pnpm reel:add path/to/final.mp4 --title "Seven doors" --description "..." \
//     [--slug seven-doors] [--topic "..."] [--transcript script.txt] [--sort 1] [--local]
//
// Makes a 720p web version, a poster and a short muted teaser with ffmpeg, uploads them to R2, then
// writes the row to D1. Re-running with the same slug replaces the reel. --local targets wrangler's
// local state instead of Cloudflare.
import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { parseArgs } from "node:util"

const BUCKET = "reels-public"
const DATABASE = "buildwithabu"
const TEASER_SECONDS = 6

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    title: { type: "string" },
    description: { type: "string" },
    slug: { type: "string" },
    topic: { type: "string" },
    transcript: { type: "string" },
    sort: { type: "string", default: "0" },
    "poster-at": { type: "string", default: "1.5" },
    local: { type: "boolean", default: false },
  },
})

const input = positionals[0]
if (!input || !existsSync(input) || !args.title || !args.description) {
  console.error('Usage: pnpm reel:add <video.mp4> --title "..." --description "..." [--slug x] [--topic "..."] [--transcript file.txt] [--sort 1] [--poster-at 1.5] [--local]')
  process.exit(1)
}

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const slug = args.slug ?? slugify(args.title)
const scope = args.local ? "--local" : "--remote"
const run = (command, list) => {
  const result = spawnSync(command, list, { stdio: "inherit" })
  if (result.status !== 0) throw new Error(`${command} ${list[0]} failed`)
}
const wrangler = (list) => run(process.execPath, ["node_modules/wrangler/bin/wrangler.js", ...list])

const probe = JSON.parse(
  execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", input]).toString(),
)
const duration = Number(probe.format.duration)
const stream = probe.streams?.[0]
const outWidth = 720
const outHeight = stream?.width && stream?.height ? Math.round(((stream.height / stream.width) * outWidth) / 2) * 2 : 1280

const work = mkdtempSync(path.join(tmpdir(), "reel-"))
try {
  const video = path.join(work, "video.mp4")
  const teaser = path.join(work, "teaser.mp4")
  const poster = path.join(work, "poster.jpg")

  // faststart puts the index first, so playback begins before the whole file arrives.
  const scale = `scale=${outWidth}:-2:flags=lanczos`
  run("ffmpeg", ["-v", "error", "-y", "-i", input, "-vf", scale, "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", video])
  run("ffmpeg", ["-v", "error", "-y", "-i", input, "-t", String(TEASER_SECONDS), "-vf", "scale=360:-2:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "28", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", teaser])
  run("ffmpeg", ["-v", "error", "-y", "-ss", args["poster-at"], "-i", input, "-frames:v", "1", "-vf", scale, "-q:v", "4", poster])

  for (const file of [video, teaser, poster]) console.log(path.basename(file), `${(statSync(file).size / 1e6).toFixed(1)} MB`)

  const keys = { video: `reels/${slug}/video.mp4`, teaser: `reels/${slug}/teaser.mp4`, poster: `reels/${slug}/poster.jpg` }
  const put = (key, file, type) =>
    wrangler(["r2", "object", "put", `${BUCKET}/${key}`, "--file", file, "--content-type", type, "--cache-control", "public,max-age=31536000,immutable", scope])
  put(keys.video, video, "video/mp4")
  put(keys.teaser, teaser, "video/mp4")
  put(keys.poster, poster, "image/jpeg")

  const quote = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`)
  const transcript = args.transcript ? readFileSync(args.transcript, "utf8").trim() : null
  const sql = `INSERT OR REPLACE INTO reels (slug, title, description, topic, transcript, duration_seconds, width, height, video_key, poster_key, teaser_key, sort_order, published_at)
VALUES (${[slug, args.title, args.description, args.topic, transcript].map(quote).join(", ")}, ${duration}, ${outWidth}, ${outHeight}, ${quote(keys.video)}, ${quote(keys.poster)}, ${quote(keys.teaser)}, ${Number(args.sort)}, ${quote(new Date().toISOString())});`
  const sqlFile = path.join(work, "reel.sql")
  writeFileSync(sqlFile, sql)
  wrangler(["d1", "execute", DATABASE, scope, "--file", sqlFile])
  console.log(`\nPublished: /reels/${slug}`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
