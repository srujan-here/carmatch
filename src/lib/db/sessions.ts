import type { Preferences, ScoredCar } from "@/lib/types/preferences";
import type { RecommendationResponse } from "@/lib/types/recommendation";
import { getCarsByIds } from "./cars";
import { prisma } from "./client";

/**
 * Rebuild a full recommendation response from a persisted session: parse the
 * stored scored snapshot and re-hydrate the car records. POST and GET share
 * this so their payloads can never drift apart.
 */
export async function getSessionResponse(id: string): Promise<RecommendationResponse | null> {
  const session = await prisma.recommendationSession.findUnique({ where: { id } });
  if (!session) return null;

  const scored = JSON.parse(session.results) as ScoredCar[];
  const cars = await getCarsByIds(scored.map((s) => s.carId));
  const carById = new Map(cars.map((c) => [c.id, c]));

  const items = scored
    .map((s) => ({ scored: s, car: carById.get(s.carId)! }))
    .filter((i) => i.car);

  const total = await prisma.car.count();

  return {
    sessionId: session.id,
    createdAt: session.createdAt.toISOString(),
    preferences: JSON.parse(session.preferences) as Preferences,
    freeText: session.freeText,
    aiEnhanced: session.aiEnhanced,
    items,
    total,
  };
}
