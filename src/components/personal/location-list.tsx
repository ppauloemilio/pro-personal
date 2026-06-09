"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveLocationAction, deleteLocationFormAction } from "@/lib/actions";

export type LocationItem = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  mapUrl: string | null;
  notes: string | null;
};

export function LocationList({
  locations,
  canWrite,
}: {
  locations: LocationItem[];
  canWrite: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (locations.length === 0) {
    return <p className="text-sm text-slate-400">Nenhum local cadastrado.</p>;
  }

  return (
    <div className="space-y-2">
      {locations.map((location) =>
        editingId === location.id && canWrite ? (
          <form
            key={location.id}
            action={saveLocationAction}
            className="rounded-xl border border-brand-500/30 bg-surface-elevated/50 p-4"
          >
            <input type="hidden" name="id" value={location.id} />
            <div className="grid gap-3">
              <input
                name="name"
                required
                defaultValue={location.name}
                placeholder="Nome da academia"
                className="w-full"
              />
              <input
                name="address"
                required
                defaultValue={location.address}
                placeholder="Endereço completo"
                className="w-full"
              />
              <input
                name="city"
                defaultValue={location.city || ""}
                placeholder="Cidade"
                className="w-full"
              />
              <input
                name="mapUrl"
                defaultValue={location.mapUrl || ""}
                placeholder="Link do mapa (opcional)"
                className="w-full"
              />
              <div className="flex gap-2">
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
            key={location.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-surface-elevated/50 p-4 text-sm"
          >
            <div>
              <p className="font-medium text-white">{location.name}</p>
              <p className="text-slate-400">{location.address}</p>
              {location.city && <p className="text-slate-500">{location.city}</p>}
            </div>
            {canWrite && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(location.id)}
                >
                  Editar
                </Button>
                <form action={deleteLocationFormAction}>
                  <input type="hidden" name="id" value={location.id} />
                  <Button type="submit" size="sm" variant="danger">
                    Excluir
                  </Button>
                </form>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
