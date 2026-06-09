"use client";

import { Button } from "@/components/ui/button";
import {
  acceptVinculoFormAction,
  rejectVinculoFormAction,
  approveBookingFormAction,
  rejectBookingFormAction,
  cancelBookingFormAction,
  requestBookingCancellationFormAction,
  approveCancellationFormAction,
  rejectCancellationFormAction,
} from "@/lib/actions";

export function AcceptVinculoForm({ vinculoId }: { vinculoId: string }) {
  return (
    <form action={acceptVinculoFormAction}>
      <input type="hidden" name="vinculoId" value={vinculoId} />
      <Button type="submit" size="sm">
        Aceitar
      </Button>
    </form>
  );
}

export function RejectVinculoForm({ vinculoId }: { vinculoId: string }) {
  return (
    <form action={rejectVinculoFormAction}>
      <input type="hidden" name="vinculoId" value={vinculoId} />
      <Button type="submit" size="sm" variant="danger">
        Recusar
      </Button>
    </form>
  );
}

export function ApproveBookingForm({ bookingId }: { bookingId: string }) {
  return (
    <form action={approveBookingFormAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" size="sm">
        Aprovar
      </Button>
    </form>
  );
}

export function RejectBookingForm({ bookingId }: { bookingId: string }) {
  return (
    <form action={rejectBookingFormAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" size="sm" variant="danger">
        Recusar
      </Button>
    </form>
  );
}

export function CancelBookingForm({
  bookingId,
  label = "Cancelar",
}: {
  bookingId: string;
  label?: string;
}) {
  return (
    <form action={cancelBookingFormAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" size="sm" variant="outline">
        {label}
      </Button>
    </form>
  );
}

export function RequestCancellationForm({ bookingId }: { bookingId: string }) {
  return (
    <form action={requestBookingCancellationFormAction} className="space-y-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input
        name="reason"
        placeholder="Motivo (opcional)"
        className="w-full max-w-xs text-sm"
      />
      <Button type="submit" size="sm" variant="danger">
        Solicitar cancelamento
      </Button>
    </form>
  );
}

export function ApproveCancellationForm({ bookingId }: { bookingId: string }) {
  return (
    <form action={approveCancellationFormAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" size="sm" variant="danger">
        Confirmar cancelamento
      </Button>
    </form>
  );
}

export function RejectCancellationForm({ bookingId }: { bookingId: string }) {
  return (
    <form action={rejectCancellationFormAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" size="sm" variant="outline">
        Manter aula
      </Button>
    </form>
  );
}
