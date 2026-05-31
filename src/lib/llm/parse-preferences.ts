import { z } from "zod";
import {
  BODY_TYPES,
  FUEL_TYPES,
  PRIORITIES,
  USAGES,
  type Preferences,
} from "@/lib/types/preferences";
import { getAnthropic, LLM_MODEL } from "./client";

/**
 * Free-text → structured preference overrides. Every field is optional; the
 * model only fills what the buyer's words clearly imply. Without a key (or on
 * any error) this is a no-op and the wizard answers stand alone.
 */
const OverrideSchema = z
  .object({
    budgetMaxInr: z.number().int().positive().optional(),
    minSeating: z.number().int().min(2).max(8).optional(),
    usage: z.enum(USAGES).optional(),
    bodyTypes: z.array(z.enum(BODY_TYPES)).optional(),
    fuelTypes: z.array(z.enum(FUEL_TYPES)).optional(),
    transmission: z.enum(["manual", "automatic", "any"]).optional(),
    priorities: z.array(z.enum(PRIORITIES)).optional(),
  })
  .partial();

export type PreferenceOverride = z.infer<typeof OverrideSchema>;

const SYSTEM = `You translate a car buyer's free-text notes into structured preference overrides for a recommendation engine in India.

Output ONLY a JSON object (no prose) with any subset of these keys; omit a key entirely if the text doesn't clearly imply it:
- budgetMaxInr: integer rupees (e.g. "under 15 lakh" -> 1500000)
- minSeating: integer (e.g. "family of six", "need 7 seats")
- usage: one of ${USAGES.join(", ")}
- bodyTypes: array from ${BODY_TYPES.join(", ")}
- fuelTypes: array from ${FUEL_TYPES.join(", ")}
- transmission: manual | automatic | any
- priorities: array from ${PRIORITIES.join(", ")} (max 3; "value" = budget/running cost)

Examples:
"newborn on the way, parents visit often, safety is everything" -> {"minSeating":6,"priorities":["safety"],"usage":"family"}
"long highway drives, want it punchy and automatic" -> {"usage":"highway","transmission":"automatic","priorities":["performance"]}
"cheapest to run, mostly city traffic" -> {"usage":"city","priorities":["value","mileage"]}`;

/**
 * Merge a partial override onto wizard preferences. Scalars from the text win;
 * arrays are unioned so the text adds to (never silently erases) wizard choices.
 * minSeating only ratchets up — the engine must still satisfy the buyer's need.
 */
export function mergeOverride(base: Preferences, override: PreferenceOverride): Preferences {
  return {
    ...base,
    budgetMaxInr: override.budgetMaxInr ?? base.budgetMaxInr,
    minSeating: Math.max(base.minSeating, override.minSeating ?? 0),
    usage: override.usage ?? base.usage,
    transmission: override.transmission ?? base.transmission,
    bodyTypes: [...new Set([...base.bodyTypes, ...(override.bodyTypes ?? [])])],
    fuelTypes: [...new Set([...base.fuelTypes, ...(override.fuelTypes ?? [])])],
    priorities: [...new Set([...base.priorities, ...(override.priorities ?? [])])].slice(0, 3),
  };
}

export async function parsePreferences(freeText: string): Promise<PreferenceOverride> {
  const client = getAnthropic();
  if (!client || !freeText.trim()) return {};

  try {
    const res = await client.messages.create({
      model: LLM_MODEL,
      max_tokens: 300,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: freeText.trim() }],
    });
    const text = res.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return {};
    const json = text.text.slice(text.text.indexOf("{"), text.text.lastIndexOf("}") + 1);
    return OverrideSchema.parse(JSON.parse(json));
  } catch {
    // Any failure (no JSON, schema mismatch, network) → fall back to no override.
    return {};
  }
}
