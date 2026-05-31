import { toCarRecord, type CarRecord } from "@/lib/types/car";
import { prisma } from "./client";

/** Fetch the whole catalog as domain records (features parsed). */
export async function getAllCars(): Promise<CarRecord[]> {
  const rows = await prisma.car.findMany({ orderBy: { priceInr: "asc" } });
  return rows.map(toCarRecord);
}

/** Fetch a set of cars by id, preserving the requested order. */
export async function getCarsByIds(ids: string[]): Promise<CarRecord[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.car.findMany({ where: { id: { in: ids } } });
  const byId = new Map(rows.map((r) => [r.id, toCarRecord(r)]));
  return ids.map((id) => byId.get(id)).filter((c): c is CarRecord => Boolean(c));
}

export async function getCarById(id: string): Promise<CarRecord | null> {
  const row = await prisma.car.findUnique({ where: { id } });
  return row ? toCarRecord(row) : null;
}
