import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * Idempotent seed: wipes the catalog and reloads it from the curated JSON.
 * Uses the libSQL adapter when pointed at Turso (production), else the native
 * SQLite connector (local dev). Run with `npm run db:seed`.
 */
function makeClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (url.startsWith("libsql://") || process.env.TURSO_AUTH_TOKEN) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require("@prisma/adapter-libsql");
    return new PrismaClient({
      adapter: new PrismaLibSQL({ url, authToken: process.env.TURSO_AUTH_TOKEN }),
    });
  }
  return new PrismaClient();
}

interface SeedCar {
  features: string[];
  [key: string]: unknown;
}

async function main() {
  const prisma = makeClient();
  const file = join(process.cwd(), "src", "data", "cars.seed.json");
  const cars = JSON.parse(readFileSync(file, "utf-8")) as SeedCar[];

  await prisma.recommendationSession.deleteMany();
  await prisma.car.deleteMany();

  for (const car of cars) {
    const { features, ...rest } = car;
    await prisma.car.create({
      data: { ...(rest as object), features: JSON.stringify(features) } as never,
    });
  }

  const count = await prisma.car.count();
  console.log(`Seeded ${count} cars.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
