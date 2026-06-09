import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createBookingFormAction } from "@/lib/actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Clock } from "lucide-react";

export type BookingSlotItem = {
  startAt: string;
  endAt: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  locationMapUrl: string | null;
};

export function BookingSlotList({
  vinculoId,
  dateLabel,
  slots,
}: {
  vinculoId: string;
  dateLabel: string;
  slots: BookingSlotItem[];
}) {
  if (slots.length === 0) {
    return (
      <Card className="text-center text-slate-400">
        Nenhum horário livre neste dia. Escolha outra data no calendário.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-white">Horários em {dateLabel}</h3>
        <p className="text-sm text-slate-400">
          O pedido pré-reserva o horário até aprovação do personal.
        </p>
      </div>
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
              {slot.locationName}
            </p>
            <p className="text-xs text-slate-500">{slot.locationAddress}</p>
            <form action={createBookingFormAction}>
              <input type="hidden" name="vinculoId" value={vinculoId} />
              <input type="hidden" name="startAt" value={slot.startAt} />
              <input type="hidden" name="endAt" value={slot.endAt} />
              <input type="hidden" name="locationId" value={slot.locationId} />
              <input type="hidden" name="locationName" value={slot.locationName} />
              <input type="hidden" name="locationAddress" value={slot.locationAddress} />
              <input
                type="hidden"
                name="locationMapUrl"
                value={slot.locationMapUrl || ""}
              />
              <Button type="submit" size="sm" className="w-full">
                Solicitar horário
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
