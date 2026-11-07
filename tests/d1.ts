// A real SQLite database with the real migration, shaped like the slice of D1 the app uses.
import { readFileSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"

export const testDb = () => {
  const sqlite = new DatabaseSync(":memory:")
  sqlite.exec(readFileSync("migrations/0001_init.sql", "utf8"))
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
