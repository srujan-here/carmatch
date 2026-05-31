import { describe, expect, it } from "vitest";
import type { CarRecord } from "@/lib/types/car";
import type { Preferences } from "@/lib/types/preferences";
import { recommend } from "./engine";

// A compact catalog covering the personas we test against.
function car(p: Partial<CarRecord> & { id: string }): CarRecord {
  return {
    make: "Test", model: "Model", variant: "V", bodyType: "hatchback", fuelType: "petrol",
    transmission: "manual", priceInr: 800000, mileageKmpl: 18, seating: 5, safetyRating: 3,
    powerBhp: 90, bootLitres: 300, year: 2024, features: ["a", "b"], summary: "", imageUrl: null,
    ...p,
  };
}

const CATALOG: CarRecord[] = [
  car({ id: "frugal-hatch", priceInr: 600000, mileageKmpl: 25, safetyRating: 2, powerBhp: 70, bodyType: "hatchback" }),
  car({ id: "thirsty-cheap", priceInr: 950000, mileageKmpl: 14, safetyRating: 3, powerBhp: 95, bodyType: "hatchback" }),
  car({ id: "safe-7str", priceInr: 2500000, mileageKmpl: 15, safetyRating: 5, powerBhp: 175, seating: 7, bodyType: "suv" }),
  car({ id: "hot-sedan", priceInr: 1800000, mileageKmpl: 16, safetyRating: 4, powerBhp: 160, bodyType: "sedan", transmission: "automatic" }),
  car({ id: "loaded-suv", priceInr: 2000000, mileageKmpl: 17, safetyRating: 5, powerBhp: 150, bodyType: "suv", features: ["a", "b", "c", "d", "e", "f"] }),
];

function prefs(p: Partial<Preferences>): Preferences {
  return {
    budgetMaxInr: 3000000, budgetMinInr: 0, usage: "city", bodyTypes: [], fuelTypes: [],
    transmission: "any", minSeating: 4, priorities: [], ...p,
  };
}

describe("recommend", () => {
  it("ranks the frugal hatch top for a tight-budget mileage-first commuter", () => {
    const results = recommend(
      prefs({ budgetMaxInr: 1000000, usage: "city", priorities: ["mileage", "value"] }),
      CATALOG,
    );
    // frugal-hatch and thirsty-cheap both qualify; the frugal one must win.
    expect(results[0].carId).toBe("frugal-hatch");
    expect(results[0].matchScore).toBeGreaterThan(60);
  });

  it("surfaces the safe 7-seater for a safety-first family needing 7 seats", () => {
    const results = recommend(
      prefs({ usage: "family", minSeating: 7, priorities: ["safety"] }),
      CATALOG,
    );
    // Only the 7-seater clears the hard seating filter.
    expect(results.every((r) => r.carId === "safe-7str")).toBe(true);
    expect(results[0].carId).toBe("safe-7str");
  });

  it("favours the high-power car for a performance seeker", () => {
    const results = recommend(prefs({ priorities: ["performance"], usage: "highway" }), CATALOG);
    expect(["safe-7str", "hot-sedan"]).toContain(results[0].carId);
  });

  it("applies the budget ceiling with tolerance as a hard filter", () => {
    const results = recommend(prefs({ budgetMaxInr: 600000 }), CATALOG);
    // 660k tolerance band → only the 600k hatch qualifies.
    expect(results.map((r) => r.carId)).toEqual(["frugal-hatch"]);
  });

  it("rewards matching an explicit body-type preference", () => {
    const withPref = recommend(prefs({ bodyTypes: ["sedan"], transmission: "automatic" }), CATALOG);
    const top = withPref[0];
    expect(top.carId).toBe("hot-sedan");
    expect(top.reasons.some((r) => /sedan|automatic/i.test(r))).toBe(true);
  });

  it("returns reasons and tradeoffs for every result", () => {
    const results = recommend(prefs({ priorities: ["safety"] }), CATALOG);
    for (const r of results) {
      expect(r.reasons.length).toBeGreaterThan(0);
      expect(r.matchScore).toBeGreaterThanOrEqual(0);
      expect(r.matchScore).toBeLessThanOrEqual(100);
    }
  });
});
