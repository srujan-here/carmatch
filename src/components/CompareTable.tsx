import { formatInr, type CarRecord } from "@/lib/types/car";

type Dir = "high" | "low" | "none";

interface Row {
  label: string;
  dir: Dir;
  value: (c: CarRecord) => string;
  num?: (c: CarRecord) => number;
}

const ROWS: Row[] = [
  { label: "Price", dir: "low", value: (c) => formatInr(c.priceInr), num: (c) => c.priceInr },
  { label: "Body type", dir: "none", value: (c) => c.bodyType },
  { label: "Fuel", dir: "none", value: (c) => c.fuelType },
  { label: "Transmission", dir: "none", value: (c) => c.transmission },
  { label: "Mileage", dir: "high", value: (c) => `${c.mileageKmpl} km/l`, num: (c) => c.mileageKmpl },
  { label: "Safety", dir: "high", value: (c) => `${c.safetyRating}★`, num: (c) => c.safetyRating },
  { label: "Power", dir: "high", value: (c) => `${c.powerBhp} bhp`, num: (c) => c.powerBhp },
  { label: "Seats", dir: "high", value: (c) => String(c.seating), num: (c) => c.seating },
  { label: "Boot", dir: "high", value: (c) => `${c.bootLitres} L`, num: (c) => c.bootLitres },
];

/** Find which car(s) win a row so we can highlight the best value per spec. */
function bestIndices(cars: CarRecord[], row: Row): Set<number> {
  if (row.dir === "none" || !row.num) return new Set();
  const vals = cars.map(row.num);
  const target = row.dir === "high" ? Math.max(...vals) : Math.min(...vals);
  return new Set(vals.map((v, i) => (v === target ? i : -1)).filter((i) => i >= 0));
}

export function CompareTable({ cars }: { cars: CarRecord[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Spec</th>
            {cars.map((c) => (
              <th key={c.id} className="p-4 text-left align-top">
                <span className="block font-semibold text-slate-900">
                  {c.make} {c.model}
                </span>
                <span className="block text-xs font-normal text-slate-500">{c.variant}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const best = bestIndices(cars, row);
            return (
              <tr key={row.label} className="border-b border-slate-100 last:border-0">
                <td className="p-4 font-medium text-slate-500">{row.label}</td>
                {cars.map((c, i) => (
                  <td
                    key={c.id}
                    className={`p-4 capitalize ${
                      best.has(i) ? "font-semibold text-emerald-700" : "text-slate-800"
                    }`}
                  >
                    {row.value(c)}
                    {best.has(i) && <span className="ml-1 text-xs text-emerald-500">●</span>}
                  </td>
                ))}
              </tr>
            );
          })}
          <tr>
            <td className="p-4 font-medium text-slate-500 align-top">Summary</td>
            {cars.map((c) => (
              <td key={c.id} className="p-4 text-slate-600">
                {c.summary}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
