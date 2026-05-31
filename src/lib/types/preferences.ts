import { z } from "zod";

/**
 * The single source of truth for the buyer-intake contract.
 * Shared by the wizard (client), the API route (server), the recommendation
 * engine, and the LLM layer — so the shape can never drift between them.
 */

export const BODY_TYPES = ["hatchback", "sedan", "suv", "muv"] as const;
export const FUEL_TYPES = ["petrol", "diesel", "cng", "electric", "hybrid"] as const;
export const USAGES = ["city", "highway", "family", "adventure", "first_car"] as const;
export const PRIORITIES = ["mileage", "safety", "performance", "features", "value"] as const;

export type BodyType = (typeof BODY_TYPES)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type Usage = (typeof USAGES)[number];
export type Priority = (typeof PRIORITIES)[number];

export const PreferencesSchema = z.object({
  // Hard constraint: ceiling (a small tolerance is applied in the engine).
  budgetMaxInr: z.number().int().positive(),
  budgetMinInr: z.number().int().min(0).default(0),
  // What the car is mostly for — shapes default priority weights.
  usage: z.enum(USAGES),
  // Soft preferences (empty array = no preference). They add a match bonus.
  bodyTypes: z.array(z.enum(BODY_TYPES)).default([]),
  fuelTypes: z.array(z.enum(FUEL_TYPES)).default([]),
  transmission: z.enum(["manual", "automatic", "any"]).default("any"),
  // Hard constraint: minimum seats the buyer needs.
  minSeating: z.number().int().min(2).max(8).default(5),
  // The buyer's top priorities (0-3). Empty → derived from `usage`.
  priorities: z.array(z.enum(PRIORITIES)).max(3).default([]),
});

export type Preferences = z.infer<typeof PreferencesSchema>;

export const RecommendRequestSchema = z.object({
  preferences: PreferencesSchema,
  // Optional natural-language context, e.g. "newborn on the way, parents visit often".
  freeText: z.string().trim().max(500).optional(),
});

export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;

/** A car with its computed fit against a buyer's preferences. */
export interface ScoredCar {
  carId: string;
  matchScore: number; // 0-100
  reasons: string[]; // why it fits (deterministic)
  tradeoffs: string[]; // where it falls short
  breakdown: Record<Priority | "budget" | "preference", number>; // 0-1 per dimension
  explanation?: string; // optional natural-language blurb (LLM or template)
}
