"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { adminUpdateLocationFormAction } from "@/lib/actions";
import type { Location } from "@prisma/client";

type LocationWithExtras = Location & {
  personal: { user: { name: string } };
  _count: { bookings: number; availability: number };
};

export function EditLocationForm({ location }: { location: LocationWithExtras }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
        Editar
      </Button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await adminUpdateLocationFormAction(formData);
        setEditing(false);
      }}
      className="space-y-3 rounded-lg border border-surface-border bg-surface-elevated p-4"
    >
      <input type="hidden" name="locationId" value={location.id} />
      <div>
        <label className="mb-1 block text-xs text-slate-400">Nome</label>
        <input
          name="name"
          type="text"
          required
          defaultValue={location.name}
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">Endereço</label>
        <input
          name="address"
          type="text"
          required
          defaultValue={location.address}
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">Cidade</label>
        <input
          name="city"
          type="text"
          defaultValue={location.city || ""}
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">URL do Mapa</label>
        <input
          name="mapUrl"
          type="text"
          defaultValue={location.mapUrl || ""}
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">Observações</label>
        <input
          name="notes"
          type="text"
          defaultValue={location.notes || ""}
          className="w-full"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Salvar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setEditing(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
