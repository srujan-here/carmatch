import { NextResponse } from "next/server";
import { getAllCars, getCarsByIds } from "@/lib/db/cars";

export const dynamic = "force-dynamic";

/**
 * GET /api/cars            → full catalog
 * GET /api/cars?ids=a,b,c  → specific cars (used by the compare view)
 */
export async function GET(req: Request) {
  const ids = new URL(req.url).searchParams.get("ids");
  const cars = ids
    ? await getCarsByIds(ids.split(",").map((s) => s.trim()).filter(Boolean))
    : await getAllCars();
  return NextResponse.json({ cars });
}
