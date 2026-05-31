"use client";

import { useRouter } from "next/navigation";

export function BackButton({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700">
      {children}
    </button>
  );
}
