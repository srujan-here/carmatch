/** A compact match-score pill. Colour shifts green→amber→slate with the score. */
export function MatchBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : score >= 65
        ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ${tone}`}>
      {score}% match
    </span>
  );
}
