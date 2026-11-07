// Reels live in D1 and R2, so `pnpm reel:add` publishes one without a redeploy.
export type ReelRow = {
  slug: string
  title: string
  description: string
  topic: string | null
  transcript: string | null
  duration_seconds: number
  width: number
  height: number
  video_key: string
  poster_key: string
  teaser_key: string
  published_at: string
}

export type Reel = ReelRow & { video: string; poster: string; teaser: string }

const withUrls = (mediaUrl: string, row: ReelRow): Reel => ({
  ...row,
  video: `${mediaUrl}/${row.video_key}`,
  poster: `${mediaUrl}/${row.poster_key}`,
  teaser: `${mediaUrl}/${row.teaser_key}`,
})

/** A missing database never takes a marketing page down: the page shows its empty slots. */
export const listReels = async (env: Env, limit = 60) => {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM reels ORDER BY sort_order ASC, published_at DESC LIMIT ?")
      .bind(limit)
      .all<ReelRow>()
    return results.map((row) => withUrls(env.PUBLIC_MEDIA_URL, row))
  } catch (error) {
    console.error("listReels failed", error)
    return []
  }
}

export const getReel = async (env: Env, slug: string) => {
  const row = await env.DB.prepare("SELECT * FROM reels WHERE slug = ?").bind(slug).first<ReelRow>()
  return row ? withUrls(env.PUBLIC_MEDIA_URL, row) : null
}

export const formatDuration = (seconds: number) => {
  const s = Math.round(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}
