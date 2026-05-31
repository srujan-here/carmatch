import { NextResponse } from "next/server";
import { getSessionResponse } from "@/lib/db/sessions";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const response = await getSessionResponse(id);
  if (!response) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(response);
}
