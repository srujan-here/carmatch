import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";

/**
 * Creates the tables on a Turso (libSQL) database from the generated DDL.
 * Prisma's CLI can't push over `libsql://`, so we apply the schema directly.
 * After this, run `npm run db:seed` (with the same env vars) to load the cars.
 *
 * Usage:
 *   export DATABASE_URL="libsql://your-db.turso.io"
 *   export TURSO_AUTH_TOKEN="..."
 *   npm run db:push:turso
 */
async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !url.startsWith("libsql://")) {
    throw new Error('DATABASE_URL must be a libsql:// URL (got: ' + url + ")");
  }

  const client = createClient({ url, authToken });
  const sql = readFileSync(join(process.cwd(), "prisma", "turso-setup.sql"), "utf-8");

  // executeMultiple runs the whole DDL script (multiple statements) in one go.
  await client.executeMultiple(sql);
  console.log("Turso schema created. Now run: npm run db:seed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
