"use client";

import { setActiveVinculoAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function VinculoSwitcher({
  vinculos,
  activeId,
}: {
  vinculos: {
    id: string;
    status: string;
    personalName: string;
    categories: string;
  }[];
  activeId?: string;
}) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
      {vinculos
        .filter((v) => v.status === "ATIVO")
        .map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveVinculoAction(v.id)}
            className={cn(
              "shrink-0 rounded-xl border px-4 py-2 text-left text-sm transition",
              v.id === activeId
                ? "border-brand-500 bg-brand-500/15 text-brand-200"
                : "border-surface-border text-slate-400 hover:border-brand-500/30"
            )}
          >
            <p className="font-medium">{v.personalName}</p>
            {v.categories && (
              <p className="text-xs opacity-70">{v.categories}</p>
            )}
          </button>
        ))}
    </div>
  );
}
