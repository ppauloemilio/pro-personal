"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createBookingFormAction } from "@/lib/actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Clock } from "lucide-react";
import { useState } from "react";

export type LocationOption = {
  id: string;
  name: string;
  address: string;
  mapUrl: string | null;
};

export type BookingSlotItem = {
  startAt: string;
  endAt: string;
};

export function BookingSlotList({
  vinculoId,
  dateLabel,
  slots,
  locations,
}: {
  vinculoId: string;
  dateLabel: string;
  slots: BookingSlotItem[];
  locations: LocationOption[];
}) {
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  if (slots.length === 0) {
    return (
      <Card className="text-center text-slate-400">
        Nenhum horário livre neste dia. Escolha outra data no calendário.
      </Card>
    );
  }

  if (locations.length === 0) {
    return (
      <Card className="text-center text-slate-400">
        Nenhum local de atendimento cadastrado. Peça ao personal para cadastrar locais.
      </Card>
    );
  }

  const chosenLocation = locations.find((l) => l.id === selectedLocation);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-white">Horários em {dateLabel}</h3>
        <p className="text-sm text-slate-400">
          O pedido pré-reserva o horário até aprovação do personal.
        </p>
      </div>

      {/* Location selector */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-300">
          <MapPin className="mr-1 inline h-4 w-4 text-brand-400" />
          Escolha o local da aula
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {locations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => setSelectedLocation(loc.id)}
              className={`rounded-xl border p-3 text-left text-sm transition ${
                selectedLocation === loc.id
                  ? "border-brand-500 bg-brand-500/10"
                  : "border-surface-border bg-surface-card/50 hover:border-brand-500/30"
              }`}
            >
              <p className="font-medium text-white">{loc.name}</p>
              <p className="text-xs text-slate-400">{loc.address}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Time slots — only shown after location is selected */}
      {selectedLocation && chosenLocation ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {slots.map((slot) => (
            <Card key={slot.startAt} className="space-y-3">
              <p className="flex items-center gap-2 font-medium text-white">
                <Clock className="h-4 w-4 text-brand-400" />
                {format(new Date(slot.startAt), "HH:mm", { locale: ptBR })} –{" "}
                {format(new Date(slot.endAt), "HH:mm", { locale: ptBR })}
              </p>
              <p className="flex items-center gap-1 text-sm text-brand-300">
                <MapPin className="h-4 w-4" />
                {chosenLocation.name}
              </p>
              <p className="text-xs text-slate-500">{chosenLocation.address}</p>
              <form action={createBookingFormAction}>
                <input type="hidden" name="vinculoId" value={vinculoId} />
                <input type="hidden" name="startAt" value={slot.startAt} />
                <input type="hidden" name="endAt" value={slot.endAt} />
                <input type="hidden" name="locationId" value={chosenLocation.id} />
                <input type="hidden" name="locationName" value={chosenLocation.name} />
                <input type="hidden" name="locationAddress" value={chosenLocation.address} />
                <input
                  type="hidden"
                  name="locationMapUrl"
                  value={chosenLocation.mapUrl || ""}
                />
                <Button type="submit" size="sm" className="w-full">
                  Solicitar horário
                </Button>
              </form>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center text-sm text-slate-400">
          Selecione um local acima para ver os horários disponíveis.
        </Card>
      )}
    </div>
  );
}
