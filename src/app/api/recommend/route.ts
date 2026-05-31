import { NextResponse } from "next/server";
import { getAllCars } from "@/lib/db/cars";
import { prisma } from "@/lib/db/client";
import { getSessionResponse } from "@/lib/db/sessions";
import { explainMatches, type ExplainItem } from "@/lib/llm/explain-match";
import { isLlmEnabled } from "@/lib/llm/client";
import { mergeOverride, parsePreferences } from "@/lib/llm/parse-preferences";
import { recommend } from "@/lib/recommendation/engine";
import { RecommendRequestSchema } from "@/lib/types/preferences";

const TOP_N = 6;

// The catalog query + engine are dynamic per request.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RecommendRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid preferences", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { freeText } = parsed.data;
  let prefs = parsed.data.preferences;
  let aiEnhanced = false;

  // Hybrid step 1: let the LLM refine preferences from free text (no-op without a key).
  if (freeText && isLlmEnabled()) {
    const override = await parsePreferences(freeText);
    if (Object.keys(override).length > 0) {
      prefs = mergeOverride(prefs, override);
      aiEnhanced = true;
    }
  }

  const cars = await getAllCars();
  const ranked = recommend(prefs, cars).slice(0, TOP_N);

  const carById = new Map(cars.map((c) => [c.id, c]));
  const items: ExplainItem[] = ranked
    .map((scored) => ({ scored, car: carById.get(scored.carId)! }))
    .filter((i) => i.car);

  // Hybrid step 2: natural-language explanations (templated without a key).
  const explanations = await explainMatches(prefs, items);
  if (isLlmEnabled()) aiEnhanced = true;
  for (const i of items) i.scored.explanation = explanations[i.car.id];

  const session = await prisma.recommendationSession.create({
    data: {
      preferences: JSON.stringify(prefs),
      freeText: freeText ?? null,
      results: JSON.stringify(items.map((i) => i.scored)),
      aiEnhanced,
    },
  });

  // Return through the shared loader so POST and GET payloads stay identical.
  const response = await getSessionResponse(session.id);
  return NextResponse.json(response);
}
