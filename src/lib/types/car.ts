import type { BodyType, FuelType } from "./preferences";

/**
 * Domain car — the catalog row with `features` already parsed from its JSON
 * string. The engine and UI work with this; only the DB layer deals with the
 * raw Prisma row.
 */
export interface CarRecord {
  id: string;
  make: string;
  model: string;
  variant: string;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: "manual" | "automatic";
  priceInr: number;
  mileageKmpl: number;
  seating: number;
  safetyRating: number;
  powerBhp: number;
  bootLitres: number;
  year: number;
  features: string[];
  summary: string;
  imageUrl?: string | null;
}

/**
 * The raw Prisma row shape: SQLite stores the enum-like columns as plain
 * strings and `features` as a JSON string.
 */
type RawCar = Omit<CarRecord, "features" | "bodyType" | "fuelType" | "transmission"> & {
  bodyType: string;
  fuelType: string;
  transmission: string;
  features: string;
};

/** Parse a DB row into a domain car (narrowing the string enums). */
export function toCarRecord(row: RawCar): CarRecord {
  let features: string[] = [];
  try {
    const parsed = JSON.parse(row.features);
    if (Array.isArray(parsed)) features = parsed.map(String);
  } catch {
    features = [];
  }
  return {
    ...row,
    bodyType: row.bodyType as BodyType,
    fuelType: row.fuelType as FuelType,
    transmission: row.transmission as CarRecord["transmission"],
    features,
  };
}

export function formatInr(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
}
