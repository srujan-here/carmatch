import type { CarRecord } from "@/lib/types/car";

/** Min-max bounds for a numeric spec across the catalog. */
export interface Range {
  min: number;
  max: number;
}

export interface CatalogRanges {
  mileage: Range;
  power: Range;
  featureCount: Range;
}

function rangeOf(values: number[]): Range {
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** Pre-compute the spec ranges once per scoring run so cars are comparable. */
export function computeRanges(cars: CarRecord[]): CatalogRanges {
  return {
    mileage: rangeOf(cars.map((c) => c.mileageKmpl)),
    power: rangeOf(cars.map((c) => c.powerBhp)),
    featureCount: rangeOf(cars.map((c) => c.features.length)),
  };
}

/** Scale a value to 0-1 within a range; flat catalogs map to a neutral 0.5. */
export function normalize(value: number, range: Range): number {
  if (range.max === range.min) return 0.5;
  const n = (value - range.min) / (range.max - range.min);
  return Math.max(0, Math.min(1, n));
}
