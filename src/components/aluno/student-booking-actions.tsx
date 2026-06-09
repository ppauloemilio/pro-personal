"use client";

import {
  CancelBookingForm,
  RequestCancellationForm,
} from "@/components/forms/action-forms";
import { canStudentRequestCancellation } from "@/lib/slots";

export function StudentBookingActions({
  bookingId,
  status,
  startAt,
}: {
  bookingId: string;
  status: string;
  startAt: string;
}) {
  const start = new Date(startAt);
  const canRequestCancel = canStudentRequestCancellation(start);

  if (status === "PENDENTE") {
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">
          Aguardando aprovação do personal. Você pode cancelar o pedido.
        </p>
        <CancelBookingForm bookingId={bookingId} label="Cancelar pedido" />
      </div>
    );
  }

  if (status === "CONFIRMADA") {
    if (!canRequestCancel) {
      return (
        <p className="text-xs text-amber-400">
          Cancelamento só é permitido com pelo menos 24h de antecedência.
        </p>
      );
    }
    return (
      <RequestCancellationForm bookingId={bookingId} />
    );
  }

  if (status === "CANCELAMENTO_SOLICITADO") {
    return (
      <p className="text-xs text-slate-400">
        Aguardando confirmação do personal para cancelar esta aula.
      </p>
    );
  }

  return null;
}
