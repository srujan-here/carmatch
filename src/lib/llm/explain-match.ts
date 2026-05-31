import type { CarRecord } from "@/lib/types/car";
import { formatInr } from "@/lib/types/car";
import type { Preferences, ScoredCar } from "@/lib/types/preferences";
import { getAnthropic, LLM_MODEL } from "./client";

export interface ExplainItem {
  car: CarRecord;
  scored: ScoredCar;
}

/** Deterministic, always-available explanation built from the engine's reasons. */
export function templateExplanation(item: ExplainItem): string {
  const { car, scored } = item;
  const lead = `The ${car.make} ${car.model} is a ${scored.matchScore}% match`;
  const why = scored.reasons.length ? ` — ${scored.reasons.slice(0, 2).join(" and ").toLowerCase()}` : "";
  const tradeoff = scored.tradeoffs.length ? ` Worth noting: ${scored.tradeoffs[0].toLowerCase()}.` : "";
  return `${lead}${why}.${tradeoff}`;
}

function buyerProfile(prefs: Preferences): string {
  const parts = [
    `budget up to ${formatInr(prefs.budgetMaxInr)}`,
    `${prefs.usage} use`,
    `${prefs.minSeating}+ seats`,
  ];
  if (prefs.priorities.length) parts.push(`priorities: ${prefs.priorities.join(", ")}`);
  if (prefs.bodyTypes.length) parts.push(`prefers ${prefs.bodyTypes.join("/")}`);
  if (prefs.fuelTypes.length) parts.push(`fuel: ${prefs.fuelTypes.join("/")}`);
  if (prefs.transmission !== "any") parts.push(`${prefs.transmission} gearbox`);
  return parts.join("; ");
}

const SYSTEM = `You are a friendly, honest car advisor in India. For each car, write ONE warm sentence (max 30 words) telling this specific buyer why it fits them, grounded in the provided match reasons. Mention a tradeoff only if given. No hype, no markdown.
Output ONLY a JSON object mapping carId to its sentence.`;

/**
 * Natural-language "why it fits you" per car. Uses one batched, prompt-cached
 * LLM call when a key is present; otherwise returns deterministic templates.
 * Always resolves — never throws — so the route degrades gracefully.
 */
export async function explainMatches(
  prefs: Preferences,
  items: ExplainItem[],
): Promise<Record<string, string>> {
  const fallback = Object.fromEntries(items.map((i) => [i.car.id, templateExplanation(i)]));

  const client = getAnthropic();
  if (!client || items.length === 0) return fallback;

  const payload = {
    buyer: buyerProfile(prefs),
    cars: items.map((i) => ({
      carId: i.car.id,
      name: `${i.car.make} ${i.car.model} ${i.car.variant}`,
      matchScore: i.scored.matchScore,
      reasons: i.scored.reasons,
      tradeoffs: i.scored.tradeoffs,
    })),
  };

  try {
    const res = await client.messages.create({
      model: LLM_MODEL,
      max_tokens: 700,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: JSON.stringify(payload) }],
    });
    const text = res.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return fallback;
    const json = text.text.slice(text.text.indexOf("{"), text.text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    // Keep only valid string entries; fall back per-car for anything missing.
    return Object.fromEntries(
      items.map((i) => {
        const v = parsed[i.car.id];
        return [i.car.id, typeof v === "string" && v.trim() ? v.trim() : fallback[i.car.id]];
      }),
    );
  } catch {
    return fallback;
  }
}
