import type { CarRecord } from "@/lib/types/car";
import { formatInr } from "@/lib/types/car";
import type { Preferences, Priority, ScoredCar } from "@/lib/types/preferences";
import { PRIORITIES } from "@/lib/types/preferences";
import { computeRanges, normalize, type CatalogRanges } from "./normalize";
import { deriveWeights, type WeightVector } from "./weights";

// Cars up to 10% over the stated ceiling still make the shortlist, with a penalty —
// buyers usually stretch a little for the right car.
const BUDGET_TOLERANCE = 1.1;

// How the final 0-100 score is composed. Preferences (body/fuel/transmission)
// carry real weight: when a buyer explicitly asks for a sedan, a matching car
// should out-rank a slightly-better-specced car of the wrong shape.
const CORE_WEIGHT = 0.6; // weighted spec fit (mileage/safety/performance/features/value)
const BUDGET_WEIGHT = 0.12;
const PREFERENCE_WEIGHT = 0.28;

type DimensionScores = Record<Priority, number>;

function dimensionScores(
  car: CarRecord,
  prefs: Preferences,
  ranges: CatalogRanges,
): DimensionScores {
  const mileage = normalize(car.mileageKmpl, ranges.mileage);
  const headroom = clamp((prefs.budgetMaxInr - car.priceInr) / prefs.budgetMaxInr, 0, 1);
  return {
    mileage,
    safety: clamp(car.safetyRating / 5, 0, 1),
    performance: normalize(car.powerBhp, ranges.power),
    features: normalize(car.features.length, ranges.featureCount),
    value: clamp(0.7 * headroom + 0.3 * mileage, 0, 1),
  };
}

function budgetFit(car: CarRecord, prefs: Preferences): number {
  if (car.priceInr <= prefs.budgetMaxInr) return 1;
  const ceiling = prefs.budgetMaxInr * BUDGET_TOLERANCE;
  return clamp((ceiling - car.priceInr) / (ceiling - prefs.budgetMaxInr), 0, 1);
}

interface PreferenceMatch {
  score: number; // 0-1
  matched: string[];
  missed: string[];
}

function preferenceMatch(car: CarRecord, prefs: Preferences): PreferenceMatch {
  const parts: number[] = [];
  const matched: string[] = [];
  const missed: string[] = [];

  if (prefs.bodyTypes.length > 0) {
    const ok = prefs.bodyTypes.includes(car.bodyType);
    parts.push(ok ? 1 : 0);
    (ok ? matched : missed).push(`${car.bodyType} body style`);
  }
  if (prefs.fuelTypes.length > 0) {
    const ok = prefs.fuelTypes.includes(car.fuelType);
    parts.push(ok ? 1 : 0);
    (ok ? matched : missed).push(`${car.fuelType} powertrain`);
  }
  if (prefs.transmission !== "any") {
    const ok = car.transmission === prefs.transmission;
    parts.push(ok ? 1 : 0);
    (ok ? matched : missed).push(`${car.transmission} gearbox`);
  }

  const score = parts.length === 0 ? 1 : parts.reduce((a, b) => a + b, 0) / parts.length;
  return { score, matched, missed };
}

const POSITIVE_LABEL: Record<Priority, (c: CarRecord) => string> = {
  mileage: (c) => `Excellent fuel economy (${c.mileageKmpl} km/l)`,
  safety: (c) => `Strong safety (${c.safetyRating}★ NCAP)`,
  performance: (c) => `Punchy performance (${c.powerBhp} bhp)`,
  features: (c) => `Generously equipped (${c.features.length} key features)`,
  value: () => `Great value within your budget`,
};

const TRADEOFF_LABEL: Record<Priority, (c: CarRecord) => string> = {
  mileage: (c) => `Thirstier than rivals (${c.mileageKmpl} km/l)`,
  safety: (c) => `Modest safety rating (${c.safetyRating}★)`,
  performance: (c) => `Modest performance (${c.powerBhp} bhp)`,
  features: () => `Lighter on features than rivals`,
  value: () => `Priced near the top of your budget`,
};

function buildReasons(
  car: CarRecord,
  prefs: Preferences,
  weights: WeightVector,
  dims: DimensionScores,
  pref: PreferenceMatch,
): { reasons: string[]; tradeoffs: string[] } {
  const ranked = PRIORITIES.map((dim) => ({
    dim,
    good: dims[dim],
    contribution: weights[dim] * dims[dim],
  })).sort((a, b) => b.contribution - a.contribution);

  const reasons: string[] = [];
  for (const { dim, good } of ranked) {
    if (reasons.length >= 3) break;
    // 0.66 keeps the praise honest — e.g. a 3★ (0.6) car isn't called "strong on safety".
    if (good >= 0.66 && weights[dim] >= 0.12) reasons.push(POSITIVE_LABEL[dim](car));
  }
  // Preference matches the buyer explicitly asked for are always worth stating.
  for (const m of pref.matched) {
    if (reasons.length >= 4) break;
    reasons.push(`Matches your ${m} preference`);
  }
  if (car.priceInr <= prefs.budgetMaxInr * 0.85 && reasons.length < 4) {
    reasons.push(`Comfortably within budget at ${formatInr(car.priceInr)}`);
  }
  // Never leave a card empty. When nothing stands out, stay honest — don't slap a
  // superlative on a middling spec; explain why it still ranked.
  if (reasons.length === 0) {
    reasons.push("Best overall balance of your priorities within budget");
  }

  const tradeoffs: string[] = [];
  for (const { dim, good } of [...ranked].sort((a, b) => weights[b.dim] - weights[a.dim])) {
    if (tradeoffs.length >= 2) break;
    if (weights[dim] >= 0.15 && good <= 0.4) tradeoffs.push(TRADEOFF_LABEL[dim](car));
  }
  if (car.priceInr > prefs.budgetMaxInr && tradeoffs.length < 2) {
    tradeoffs.push(`Slightly over budget at ${formatInr(car.priceInr)}`);
  }
  for (const m of pref.missed) {
    if (tradeoffs.length >= 2) break;
    tradeoffs.push(`Not the ${m} you preferred`);
  }

  return { reasons, tradeoffs };
}

/**
 * The core computation: score every car against the buyer's preferences and
 * return them ranked best-first. Pure and deterministic — no I/O, fully testable.
 * Hard filters (min seating, budget ceiling+tolerance) are applied first; the
 * rest is a weighted, normalized soft score.
 */
export function recommend(prefs: Preferences, cars: CarRecord[]): ScoredCar[] {
  const weights = deriveWeights(prefs);

  const eligible = cars.filter(
    (c) =>
      c.seating >= prefs.minSeating &&
      c.priceInr >= prefs.budgetMinInr &&
      c.priceInr <= prefs.budgetMaxInr * BUDGET_TOLERANCE,
  );

  if (eligible.length === 0) return [];

  const ranges = computeRanges(eligible);

  const scored: ScoredCar[] = eligible.map((car) => {
    const dims = dimensionScores(car, prefs, ranges);
    const core = PRIORITIES.reduce((sum, dim) => sum + weights[dim] * dims[dim], 0);
    const budget = budgetFit(car, prefs);
    const pref = preferenceMatch(car, prefs);

    const matchScore = Math.round(
      100 * (CORE_WEIGHT * core + BUDGET_WEIGHT * budget + PREFERENCE_WEIGHT * pref.score),
    );

    const { reasons, tradeoffs } = buildReasons(car, prefs, weights, dims, pref);

    return {
      carId: car.id,
      matchScore,
      reasons,
      tradeoffs,
      breakdown: { ...dims, budget, preference: pref.score },
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
