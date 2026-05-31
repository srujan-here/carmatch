import { PrismaClient } from "@prisma/client";

/**
 * Single Prisma client for the whole app.
 *
 * - Local dev: `DATABASE_URL="file:./dev.db"` → Prisma's native SQLite connector.
 *   The CLI (`prisma db push`) and the runtime resolve the same file, so there is
 *   no path-mismatch surprise.
 * - Production (Vercel): `DATABASE_URL="libsql://...turso.io"` + `TURSO_AUTH_TOKEN`
 *   → the libSQL driver adapter, which works on serverless and persists writes.
 *
 * Same schema, same queries, both ways.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const isLibsql = url.startsWith("libsql://") || Boolean(process.env.TURSO_AUTH_TOKEN);

  if (isLibsql) {
    // Lazy require so the native (file) path never loads the libSQL adapter.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require("@prisma/adapter-libsql");
    const adapter = new PrismaLibSQL({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter });
  }

  return new PrismaClient();
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
