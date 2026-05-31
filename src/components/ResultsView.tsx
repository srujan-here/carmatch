"use client";

import Link from "next/link";
import { useState } from "react";
import { formatInr } from "@/lib/types/car";
import type { RecommendationResponse } from "@/lib/types/recommendation";
import { CarCard } from "./CarCard";

function summarise(prefs: RecommendationResponse["preferences"]): string[] {
  const chips = [`Up to ${formatInr(prefs.budgetMaxInr)}`, `${prefs.usage.replace("_", " ")} use`, `${prefs.minSeating}+ seats`];
  if (prefs.transmission !== "any") chips.push(prefs.transmission);
  if (prefs.bodyTypes.length) chips.push(prefs.bodyTypes.join(" / "));
  if (prefs.fuelTypes.length) chips.push(prefs.fuelTypes.join(" / "));
  if (prefs.priorities.length) chips.push(`priorities: ${prefs.priorities.join(", ")}`);
  return chips;
}

export function ResultsView({ data }: { data: RecommendationResponse }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  function toggleCompare(carId: string) {
    setSelected((prev) =>
      prev.includes(carId) ? prev.filter((id) => id !== carId) : prev.length < 4 ? [...prev, carId] : prev,
    );
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your shortlist</h1>
          <p className="mt-1 text-sm text-slate-500">
            We scored {data.total} cars and ranked your top {data.items.length}.
            {data.aiEnhanced && (
              <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                ✨ AI-enhanced
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {copied ? "Copied ✓" : "Share"}
          </button>
          <Link
            href="/find"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refine
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {summarise(data.preferences).map((c) => (
          <span key={c} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {c}
          </span>
        ))}
      </div>

      {data.freeText && (
        <p className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm italic text-slate-500">
          “{data.freeText}”
        </p>
      )}

      {data.items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">No cars matched those constraints.</p>
          <Link href="/find" className="mt-3 inline-block font-medium text-indigo-600 hover:text-indigo-700">
            Loosen your filters →
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.items.map((item, i) => (
            <CarCard
              key={item.car.id}
              item={item}
              rank={i + 1}
              selected={selected.includes(item.car.id)}
              onToggleCompare={toggleCompare}
            />
          ))}
        </div>
      )}

      {selected.length >= 2 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
            <span className="text-sm text-slate-600">{selected.length} cars selected</span>
            <Link
              href={`/compare?ids=${selected.join(",")}`}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Compare side by side →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
