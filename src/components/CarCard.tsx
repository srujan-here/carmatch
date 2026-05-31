import { formatInr } from "@/lib/types/car";
import type { RecommendationItem } from "@/lib/types/recommendation";
import { MatchBadge } from "./MatchBadge";

interface Props {
  item: RecommendationItem;
  rank: number;
  selected: boolean;
  onToggleCompare: (carId: string) => void;
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}

export function CarCard({ item, rank, selected, onToggleCompare }: Props) {
  const { car, scored } = item;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="rounded bg-slate-100 px-1.5 py-0.5">#{rank}</span>
            <span className="uppercase tracking-wide">{car.bodyType}</span>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {car.make} {car.model}
          </h3>
          <p className="text-sm text-slate-500">{car.variant}</p>
        </div>
        <div className="text-right">
          <MatchBadge score={scored.matchScore} />
          <p className="mt-1 text-base font-semibold text-slate-900">{formatInr(car.priceInr)}</p>
        </div>
      </div>

      {scored.explanation && (
        <p className="mt-3 rounded-lg bg-indigo-50/60 px-3 py-2 text-sm text-slate-700">
          {scored.explanation}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Spec label="Mileage" value={`${car.mileageKmpl} km/l`} />
        <Spec label="Safety" value={`${car.safetyRating}★ NCAP`} />
        <Spec label="Fuel" value={car.fuelType} />
        <Spec label="Seats" value={String(car.seating)} />
      </dl>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Why it fits</p>
          <ul className="mt-1 space-y-1">
            {scored.reasons.map((r) => (
              <li key={r} className="flex gap-1.5 text-sm text-slate-700">
                <span className="text-emerald-500">✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
        {scored.tradeoffs.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Trade-offs</p>
            <ul className="mt-1 space-y-1">
              {scored.tradeoffs.map((t) => (
                <li key={t} className="flex gap-1.5 text-sm text-slate-600">
                  <span className="text-amber-500">!</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleCompare(car.id)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Add to compare
      </label>
    </article>
  );
}
