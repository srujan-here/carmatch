"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BODY_TYPES,
  FUEL_TYPES,
  PRIORITIES,
  USAGES,
  type BodyType,
  type FuelType,
  type Preferences,
  type Priority,
  type Usage,
} from "@/lib/types/preferences";

const USAGE_META: Record<Usage, { label: string; hint: string; icon: string }> = {
  city: { label: "City commute", hint: "Stop-go traffic, parking, errands", icon: "🏙️" },
  highway: { label: "Highway miles", hint: "Long drives, cruising, overtaking", icon: "🛣️" },
  family: { label: "Family duty", hint: "Space, safety, the school run", icon: "👨‍👩‍👧" },
  adventure: { label: "Adventure", hint: "Bad roads, trips, the occasional trail", icon: "⛰️" },
  first_car: { label: "My first car", hint: "Easy, affordable, forgiving", icon: "🔰" },
};

const BODY_META: Record<BodyType, string> = {
  hatchback: "Hatchback",
  sedan: "Sedan",
  suv: "SUV",
  muv: "MUV / 7-seater",
};

const FUEL_META: Record<FuelType, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  cng: "CNG",
  electric: "Electric",
  hybrid: "Hybrid",
};

const PRIORITY_META: Record<Priority, { label: string; icon: string }> = {
  mileage: { label: "Fuel economy", icon: "⛽" },
  safety: { label: "Safety", icon: "🛡️" },
  performance: { label: "Performance", icon: "🏎️" },
  features: { label: "Features & tech", icon: "✨" },
  value: { label: "Value for money", icon: "💰" },
};

const SEATING_OPTIONS = [2, 4, 5, 6, 7];

function lakh(n: number) {
  return n >= 100 ? `₹${(n / 100).toFixed(1)} Cr` : `₹${n} L`;
}

const STEP_COUNT = 5;

export function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [budgetLakh, setBudgetLakh] = useState(12);
  const [usage, setUsage] = useState<Usage>("city");
  const [minSeating, setMinSeating] = useState(5);
  const [bodyTypes, setBodyTypes] = useState<BodyType[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [transmission, setTransmission] = useState<"manual" | "automatic" | "any">("any");
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [freeText, setFreeText] = useState("");

  function toggle<T>(list: T[], value: T, setter: (v: T[]) => void, max?: number) {
    if (list.includes(value)) setter(list.filter((v) => v !== value));
    else if (!max || list.length < max) setter([...list, value]);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const preferences: Preferences = {
      budgetMaxInr: budgetLakh * 100000,
      budgetMinInr: 0,
      usage,
      bodyTypes,
      fuelTypes,
      transmission,
      minSeating,
      priorities,
    };
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences, freeText: freeText.trim() || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Something went wrong");
      const data = await res.json();
      router.push(`/results/${data.sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const progress = ((step + 1) / STEP_COUNT) * 100;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6">
        <div className="h-1.5 w-full rounded-full bg-slate-200">
          <div
            className="h-1.5 rounded-full bg-indigo-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-medium text-slate-400">
          Step {step + 1} of {STEP_COUNT}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 0 && (
          <Section title="What's your budget?" subtitle="On-road, roughly. We allow a little stretch above this.">
            <div className="text-center">
              <span className="text-3xl font-bold text-indigo-600">{lakh(budgetLakh)}</span>
            </div>
            <input
              type="range"
              min={3}
              max={60}
              step={1}
              value={budgetLakh}
              onChange={(e) => setBudgetLakh(Number(e.target.value))}
              className="mt-4 w-full accent-indigo-600"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>₹3 L</span>
              <span>₹60 L</span>
            </div>
          </Section>
        )}

        {step === 1 && (
          <Section title="How will you mostly use it?" subtitle="This shapes what we optimise for.">
            <div className="grid gap-3 sm:grid-cols-2">
              {USAGES.map((u) => (
                <Choice
                  key={u}
                  active={usage === u}
                  onClick={() => setUsage(u)}
                  icon={USAGE_META[u].icon}
                  label={USAGE_META[u].label}
                  hint={USAGE_META[u].hint}
                />
              ))}
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title="How many seats do you need?" subtitle="We'll only show cars that seat at least this many.">
            <div className="flex flex-wrap gap-2">
              {SEATING_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setMinSeating(s)}
                  className={`rounded-lg border px-5 py-3 text-sm font-medium transition ${
                    minSeating === s
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {s}+ seats
                </button>
              ))}
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section
            title="Any body style or fuel preference?"
            subtitle="Optional — leave blank if you're open. Picks here strongly steer the ranking."
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Body style</p>
            <div className="flex flex-wrap gap-2">
              {BODY_TYPES.map((b) => (
                <Pill key={b} active={bodyTypes.includes(b)} onClick={() => toggle(bodyTypes, b, setBodyTypes)}>
                  {BODY_META[b]}
                </Pill>
              ))}
            </div>
            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">Fuel</p>
            <div className="flex flex-wrap gap-2">
              {FUEL_TYPES.map((f) => (
                <Pill key={f} active={fuelTypes.includes(f)} onClick={() => toggle(fuelTypes, f, setFuelTypes)}>
                  {FUEL_META[f]}
                </Pill>
              ))}
            </div>
            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">Transmission</p>
            <div className="flex flex-wrap gap-2">
              {(["any", "manual", "automatic"] as const).map((t) => (
                <Pill key={t} active={transmission === t} onClick={() => setTransmission(t)}>
                  {t === "any" ? "No preference" : t[0].toUpperCase() + t.slice(1)}
                </Pill>
              ))}
            </div>
          </Section>
        )}

        {step === 4 && (
          <Section title="What matters most?" subtitle="Pick up to 3. Then add anything else in your own words.">
            <div className="grid gap-3 sm:grid-cols-2">
              {PRIORITIES.map((p) => (
                <Choice
                  key={p}
                  active={priorities.includes(p)}
                  onClick={() => toggle(priorities, p, setPriorities, 3)}
                  icon={PRIORITY_META[p].icon}
                  label={PRIORITY_META[p].label}
                />
              ))}
            </div>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="e.g. Newborn on the way, parents visit often, and I do a 40 km city commute daily."
              className="mt-5 w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              Optional. If an AI key is configured, we read this to refine your match.
            </p>
          </Section>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-0"
          >
            ← Back
          </button>
          {step < STEP_COUNT - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Finding your matches…" : "Show my shortlist"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  hint?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
        active ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span>
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </button>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
