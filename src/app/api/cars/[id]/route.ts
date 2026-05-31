import { NextResponse } from "next/server";
import { getCarById } from "@/lib/db/cars";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const car = await getCarById(id);
  if (!car) return NextResponse.json({ error: "Car not found" }, { status: 404 });
  return NextResponse.json({ car });
}
