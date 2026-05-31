import { notFound } from "next/navigation";
import { ResultsView } from "@/components/ResultsView";
import { getSessionResponse } from "@/lib/db/sessions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your shortlist · CarMatch" };

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSessionResponse(id);
  if (!data) notFound();
  return <ResultsView data={data} />;
}
