"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { adminCreateBookingFormAction } from "@/lib/actions";

type Vinculo = {
  id: string;
  personal: { id: string; name: string };
  student: { id: string; name: string };
};

type Location = {
  id: string;
  name: string;
  address: string;
  personal: { user: { name: string } };
};

export function AdminCreateBookingForm({
  vinculos,
  locations,
  date,
  selectedPersonalId,
}: {
  vinculos: Vinculo[];
  locations: Location[];
  date: string;
  selectedPersonalId?: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedVinculoId, setSelectedVinculoId] = useState("");

  if (!showForm) {
    return (
      <Button variant="outline" onClick={() => setShowForm(true)}>
        + Novo Agendamento
      </Button>
    );
  }

  return (
    <form
      action={adminCreateBookingFormAction}
      className="space-y-3 rounded-lg border border-surface-border bg-surface-elevated p-4"
    >
      <p className="text-sm font-medium text-white">Novo Agendamento</p>

      <div>
        <label className="mb-1 block text-xs text-slate-400">Vínculo (Personal → Aluno)</label>
        <select
          name="vinculoId"
          required
          value={selectedVinculoId}
          onChange={(e) => setSelectedVinculoId(e.target.value)}
          className="w-full"
        >
          <option value="">Selecione...</option>
          {vinculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.personal.name} → {v.student.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Data</label>
          <input
            name="startAt_date"
            type="date"
            required
            defaultValue={date}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Horário início</label>
          <input
            name="startAt_time"
            type="time"
            required
            defaultValue="08:00"
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-400">Horário fim</label>
        <input
          name="endAt_time"
          type="time"
          required
          defaultValue="09:00"
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-400">Local</label>
        <select name="locationId" required className="w-full">
          <option value="">Selecione...</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} — {l.address} ({l.personal.user.name})
            </option>
          ))}
        </select>
      </div>

      {/* Hidden fields for startAt / endAt — composed from date+time */}
      <input type="hidden" name="startAt" value="" />
      <input type="hidden" name="endAt" value="" />
      <input type="hidden" name="locationName" value="" />
      <input type="hidden" name="locationAddress" value="" />

      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          onClick={(e) => {
            // Compose startAt and endAt from date+time inputs before submit
            const form = (e.target as HTMLButtonElement).closest("form")!;
            const dateVal = (form.querySelector('[name="startAt_date"]') as HTMLInputElement).value;
            const startTime = (form.querySelector('[name="startAt_time"]') as HTMLInputElement).value;
            const endTime = (form.querySelector('[name="endAt_time"]') as HTMLInputElement).value;

            (form.querySelector('[name="startAt"]') as HTMLInputElement).value = `${dateVal}T${startTime}:00`;
            (form.querySelector('[name="endAt"]') as HTMLInputElement).value = `${dateVal}T${endTime}:00`;

            // Set locationName and locationAddress from selected option
            const locSelect = form.querySelector('[name="locationId"]') as HTMLSelectElement;
            const locOption = locSelect.options[locSelect.selectedIndex];
            if (locOption && locOption.value) {
              const loc = locations.find((l) => l.id === locOption.value);
              if (loc) {
                (form.querySelector('[name="locationName"]') as HTMLInputElement).value = loc.name;
                (form.querySelector('[name="locationAddress"]') as HTMLInputElement).value = loc.address;
              }
            }
          }}
        >
          Criar Agendamento
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setShowForm(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
