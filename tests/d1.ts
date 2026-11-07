// A real SQLite database with the real migration, shaped like the slice of D1 the app uses.
import { readFileSync, readdirSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"

export const testDb = () => {
  const sqlite = new DatabaseSync(":memory:")
  for (const file of readdirSync("migrations").sort()) sqlite.exec(readFileSync(`migrations/${file}`, "utf8"))
  const prepare = (sql: string) => {
    const make = (args: unknown[]) => ({
      bind: (...next: unknown[]) => make(next),
      first: async () => (sqlite.prepare(sql).get(...(args as never[])) as unknown) ?? null,
      run: async () => ({ meta: sqlite.prepare(sql).run(...(args as never[])) }),
    })
    return make([])
  }
  return { db: { prepare } as unknown as D1Database, sqlite }
}
