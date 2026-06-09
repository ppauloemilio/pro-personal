"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EXERCISE_CATEGORIES,
  EXERCISE_PRESETS,
  type ExercisePreset,
} from "@/lib/exercise-presets";
import { cn } from "@/lib/utils";

type ExercisePickerProps = {
  onSelect: (preset: ExercisePreset) => void;
  onCustom: () => void;
  onClose: () => void;
};

export function ExercisePicker({ onSelect, onCustom, onClose }: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");

  const filtered = useMemo(() => {
    return EXERCISE_PRESETS.filter((preset) => {
      const matchesQuery =
        !query ||
        preset.name.toLowerCase().includes(query.toLowerCase()) ||
        preset.category.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || preset.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  const grouped = useMemo(() => {
    const map = new Map<string, ExercisePreset[]>();
    for (const preset of filtered) {
      if (!map.has(preset.category)) map.set(preset.category, []);
      map.get(preset.category)!.push(preset);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="rounded-2xl border border-brand-500/30 bg-surface-elevated/80 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="font-medium text-white">Escolher exercício</h4>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar exercício..."
            className="w-full py-2 pl-10 pr-3 text-sm"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full text-sm"
        >
          <option value="">Todas as categorias</option>
          {EXERCISE_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
        {grouped.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum exercício encontrado.</p>
        ) : (
          grouped.map(([group, items]) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-400">
                {group}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => onSelect(preset)}
                    className={cn(
                      "rounded-xl border border-surface-border bg-surface-card/50 px-3 py-2 text-left text-sm",
                      "transition hover:border-brand-500/40 hover:bg-brand-500/10"
                    )}
                  >
                    <span className="font-medium text-white">{preset.name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Sugestão: {preset.defaultSets}×{preset.defaultReps}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onCustom}>
        + Exercício personalizado
      </Button>
    </div>
  );
}
