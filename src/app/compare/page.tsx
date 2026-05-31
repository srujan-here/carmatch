import { BackButton } from "@/components/BackButton";
import { CompareTable } from "@/components/CompareTable";
import { getCarsByIds } from "@/lib/db/cars";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compare cars · CarMatch" };

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const idList = (ids ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const cars = await getCarsByIds(idList);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <BackButton>← Back to shortlist</BackButton>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Side-by-side compare</h1>
      <p className="mt-1 text-sm text-slate-500">Green marks the best value in each row.</p>

      {cars.length < 2 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          Pick at least two cars from your shortlist to compare.
        </div>
      ) : (
        <div className="mt-6">
          <CompareTable cars={cars} />
        </div>
      )}
    </div>
  );
}
