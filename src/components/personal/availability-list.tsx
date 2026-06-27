"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  saveAvailabilityAction,
  deleteAvailabilityFormAction,
} from "@/lib/actions";export type AvailabilityItem = {
  id: string;
  locationId: string;
  locationName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
};

type LocationOption = {
  id: string;
  name: string;
};

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AvailabilityList({
  rules,
  locations,
  canWrite,
}: {
  rules: AvailabilityItem[];
  locations: LocationOption[];
  canWrite: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const hasWeekdayRules = rules.some((r) => r.dayOfWeek >= 1 && r.dayOfWeek <= 5);

  if (rules.length === 0) {
    return <p className="text-sm text-slate-400">Nenhuma disponibilidade cadastrada.</p>;
  }

  return (
    <div className="space-y-2">
      {rules.map((rule) => {
        const isWeekend = rule.dayOfWeek === 0 || rule.dayOfWeek === 6;
        return editingId === rule.id && canWrite ? (
          <form
            key={rule.id}
            action={saveAvailabilityAction}
            className="rounded-xl border border-brand-500/30 bg-surface-elevated/50 p-4"
          >
            <input type="hidden" name="id" value={rule.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select name="locationId" required defaultValue={rule.locationId} className="w-full">
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              <select name="dayOfWeek" required defaultValue={rule.dayOfWeek} className="w-full">
                {DAYS.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
              <input
                name="startTime"
                type="time"
                required
                defaultValue={rule.startTime}
              />
              <input name="endTime" type="time" required defaultValue={rule.endTime} />
              <input
                name="slotMinutes"
                type="number"
                defaultValue={rule.slotMinutes}
                min={30}
                step={15}
                placeholder="Duração slot (min)"
              />
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" size="sm">
                  Salvar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div
            key={rule.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 text-sm ${
              isWeekend
                ? "border border-amber-500/20 bg-amber-500/5"
                : "bg-surface-elevated/50"
            }`}
          >
            <p className="text-slate-200">
              <span className={`font-medium ${isWeekend ? "text-amber-300" : "text-brand-300"}`}>
                {DAYS[rule.dayOfWeek]}
              </span>
              {" · "}
              {rule.startTime}–{rule.endTime}
              {" · "}
              {rule.locationName}
              {" · "}
              slots de {rule.slotMinutes}min
              {isWeekend && (
                <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] uppercase text-amber-300">
                  Fim de semana
                </span>
              )}
            </p>
            {canWrite && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(rule.id)}
                >
                  Editar
                </Button>
                <form action={deleteAvailabilityFormAction}>
                  <input type="hidden" name="id" value={rule.id} />
                  <Button type="submit" size="sm" variant="danger">
                    Excluir
                  </Button>
                </form>
              </div>
            )}
          </div>
        );
      })}

      {/* Add new availability */}
      {canWrite && locations.length > 0 && (
        <form
          action={saveAvailabilityAction}
          className="rounded-xl border border-dashed border-brand-500/30 bg-brand-500/5 p-4"
        >
          <p className="mb-3 text-sm font-medium text-brand-300">Adicionar disponibilidade</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="locationId" required className="w-full">
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            <select name="dayOfWeek" required className="w-full">
              {DAYS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
            <input name="startTime" type="time" required defaultValue="08:00" />
            <input name="endTime" type="time" required defaultValue="23:00" />
            <input
              name="slotMinutes"
              type="number"
              defaultValue={60}
              min={30}
              step={15}
              placeholder="Duração slot (min)"
            />
            <Button type="submit" size="sm">
              Adicionar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
