import type { Preferences, Priority, Usage } from "@/lib/types/preferences";
import { PRIORITIES } from "@/lib/types/preferences";

/** A normalized weight (sums to 1) over the five scoring dimensions. */
export type WeightVector = Record<Priority, number>;

// Each usage nudges the baseline emphasis. These are additive boosts on top of
// a flat baseline; the user's explicit priorities then dominate.
const USAGE_EMPHASIS: Record<Usage, Partial<Record<Priority, number>>> = {
  city: { mileage: 2, value: 2, features: 1 },
  highway: { performance: 2, safety: 2, mileage: 1 },
  family: { safety: 3, features: 1.5, value: 1 },
  adventure: { performance: 2, safety: 1.5, features: 1 },
  first_car: { value: 2.5, safety: 1.5, mileage: 1.5 },
};

const BASELINE = 1;
const PRIORITY_BOOST = 4;

/**
 * Turn the buyer's usage + explicit priorities into a normalized weight vector.
 * Explicit priorities (if any) get a strong boost; usage shapes the rest so the
 * ranking is sensible even when the buyer skips the priorities question.
 */
export function deriveWeights(prefs: Preferences): WeightVector {
  const raw: WeightVector = {
    mileage: BASELINE,
    safety: BASELINE,
    performance: BASELINE,
    features: BASELINE,
    value: BASELINE,
  };

  const emphasis = USAGE_EMPHASIS[prefs.usage];
  for (const key of PRIORITIES) {
    raw[key] += emphasis[key] ?? 0;
  }

  for (const p of prefs.priorities) {
    raw[p] += PRIORITY_BOOST;
  }

  const total = PRIORITIES.reduce((sum, k) => sum + raw[k], 0);
  const normalized = {} as WeightVector;
  for (const key of PRIORITIES) {
    normalized[key] = raw[key] / total;
  }
  return normalized;
}
