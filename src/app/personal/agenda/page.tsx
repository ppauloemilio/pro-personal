import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPersonalAccess } from "@/lib/permissions";
import { BookingCard } from "@/components/booking-card";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ApproveBookingForm,
  RejectBookingForm,
  CancelBookingForm,
  ApproveCancellationForm,
  RejectCancellationForm,
} from "@/components/forms/action-forms";
import { BookingMonthCalendar } from "@/components/booking-month-calendar";
import { buildBookingsByDate } from "@/lib/booking-calendar";
import { generateSlotsForRange } from "@/lib/slots";
import {
  personalCreateBookingFormAction,
  personalBlockSlotFormAction,
  removeScheduleBlockFormAction,
} from "@/lib/actions";
import { format, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Clock, Ban } from "lucide-react";
import type { BookingStatus } from "@prisma/client";

const AGENDA_STATUSES: BookingStatus[] = [
  "PENDENTE",
  "CONFIRMADA",
  "CANCELAMENTO_SOLICITADO",
];

export default async function PersonalAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getSession();
  const access = await getPersonalAccess(session!.id);
  const params = await searchParams;

  const profile = await prisma.personalProfile.findUnique({
    where: { userId: session!.id },
  });

  const bookings = await prisma.booking.findMany({
    where: {
      vinculo: { personalId: session!.id },
      status: { in: AGENDA_STATUSES },
    },
    include: { vinculo: { include: { student: true } } },
    orderBy: { startAt: "asc" },
  });

  const scheduleBlocks = profile
    ? await prisma.scheduleBlock.findMany({
        where: { personalId: profile.id },
        orderBy: { startAt: "asc" },
      })
    : [];

  const bookingsByDate = buildBookingsByDate(bookings);
  const selectedDate = params.date;
  const dayBookings = selectedDate
    ? bookings.filter((b) => format(b.startAt, "yyyy-MM-dd") === selectedDate)
    : [];

  // Compute available slots for the selected day
  let freeSlots: Awaited<ReturnType<typeof generateSlotsForRange>> = [];
  let dayBlocks: { id: string; startAt: Date; endAt: Date; reason: string | null }[] = [];

  if (selectedDate && profile) {
    const dayStart = startOfDay(parseISO(selectedDate));

    const availabilityRules = await prisma.availabilityRule.findMany({
      where: { personalId: profile.id },
      include: { location: true },
    });

    const availInput = availabilityRules.map((r) => ({
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
      slotMinutes: r.slotMinutes,
      locationId: r.locationId,
      locationName: r.location.name,
      locationAddress: r.location.address,
      locationMapUrl: r.location.mapUrl,
    }));

    const occupiedSlots = bookings
      .filter((b) => format(b.startAt, "yyyy-MM-dd") === selectedDate)
      .map((b) => ({
        startAt: b.startAt,
        endAt: b.endAt,
        locationId: b.locationId,
      }));

    const blocksInput = scheduleBlocks
      .filter(
        (bl) =>
          format(bl.startAt, "yyyy-MM-dd") === selectedDate ||
          format(bl.endAt, "yyyy-MM-dd") === selectedDate
      )
      .map((bl) => ({ startAt: bl.startAt, endAt: bl.endAt }));

    freeSlots = generateSlotsForRange(
      dayStart,
      1,
      availInput,
      occupiedSlots,
      blocksInput
    );

    dayBlocks = scheduleBlocks.filter(
      (bl) =>
        format(bl.startAt, "yyyy-MM-dd") === selectedDate ||
        format(bl.endAt, "yyyy-MM-dd") === selectedDate
    );
  }

  // Get active vinculos for the "agendar aula" form
  const activeVinculos = profile
    ? await prisma.vinculo.findMany({
        where: { personalId: session!.id, status: "ATIVO" },
        include: { student: true },
        orderBy: { student: { name: "asc" } },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <CardTitle>Agenda</CardTitle>
        <p className="mt-1 text-sm text-slate-400">
          Pedidos pendentes, aulas confirmadas e histórico no calendário.
        </p>
      </div>

      <BookingMonthCalendar
        bookingsByDate={bookingsByDate}
        selectedDate={selectedDate}
        basePath="/personal/agenda"
        startOnCurrentMonth
        allDaysClickable
        legend={[
          { tone: "upcoming", label: "Aulas agendadas" },
          { tone: "past", label: "Aulas realizadas" },
          { tone: "pending", label: "Pedidos pendentes" },
        ]}
      />

      {selectedDate && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-medium text-white">
              Agenda de{" "}
              {format(parseISO(selectedDate), "EEEE, dd/MM/yyyy", {
                locale: ptBR,
              })}
            </h3>
            <Link href="/personal/agenda">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao calendário
              </Button>
            </Link>
          </div>

          {/* Existing bookings */}
          {dayBookings.length === 0 && freeSlots.length === 0 && dayBlocks.length === 0 && (
            <Card className="text-slate-400">Nenhum agendamento neste dia.</Card>
          )}
          {dayBookings.map((b) => (
            <BookingCard
              key={b.id}
              startAt={b.startAt}
              endAt={b.endAt}
              locationName={b.locationName}
              locationAddress={b.locationAddress}
              locationMapUrl={b.locationMapUrl}
              status={b.status}
              actions={
                <>
                  <p className="w-full text-sm text-slate-400">
                    Aluno: {b.vinculo.student.name}
                  </p>
                  {b.status === "PENDENTE" && access.canApproveBookings && (
                    <>
                      <ApproveBookingForm bookingId={b.id} />
                      <RejectBookingForm bookingId={b.id} />
                    </>
                  )}
                  {b.status === "CANCELAMENTO_SOLICITADO" && access.canWrite && (
                    <>
                      <p className="w-full text-xs text-amber-400">
                        Aluno solicitou cancelamento desta aula.
                        {b.cancelReason ? ` Motivo: ${b.cancelReason}` : ""}
                      </p>
                      <ApproveCancellationForm bookingId={b.id} />
                      <RejectCancellationForm bookingId={b.id} />
                    </>
                  )}
                  {(b.status === "CONFIRMADA" || b.status === "PENDENTE") &&
                    access.canWrite && <CancelBookingForm bookingId={b.id} />}
                </>
              }
            />
          ))}

          {/* Schedule blocks for this day */}
          {dayBlocks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-300">Horários bloqueados</h4>
              {dayBlocks.map((bl) => (
                <Card key={bl.id} className="flex items-center justify-between gap-3 border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center gap-2 text-sm">
                    <Ban className="h-4 w-4 text-amber-400" />
                    <span className="text-amber-300">
                      {format(bl.startAt, "HH:mm")} – {format(bl.endAt, "HH:mm")}
                    </span>
                    {bl.reason && (
                      <span className="text-slate-400">({bl.reason})</span>
                    )}
                  </div>
                  <form action={removeScheduleBlockFormAction}>
                    <input type="hidden" name="blockId" value={bl.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                      Remover
                    </Button>
                  </form>
                </Card>
              ))}
            </div>
          )}

          {/* Free slots — available for booking or blocking */}
          {access.canWrite && freeSlots.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">
                <Clock className="mr-1 inline h-4 w-4 text-brand-400" />
                Horários disponíveis
              </h4>
              {freeSlots.map((slot, idx) => (
                <Card key={idx} className="flex flex-col gap-3 border-brand-500/20 bg-brand-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium text-brand-300">
                        {format(slot.startAt, "HH:mm")} – {format(slot.endAt, "HH:mm")}
                      </span>
                      <span className="ml-3 text-slate-400">{slot.locationName}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Agendar aula — inline form */}
                    <form action={personalCreateBookingFormAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="startAt" value={slot.startAt.toISOString()} />
                      <input type="hidden" name="endAt" value={slot.endAt.toISOString()} />
                      <input type="hidden" name="locationId" value={slot.locationId} />
                      <input type="hidden" name="locationName" value={slot.locationName} />
                      <input type="hidden" name="locationAddress" value={slot.locationAddress} />
                      {slot.locationMapUrl && (
                        <input type="hidden" name="locationMapUrl" value={slot.locationMapUrl} />
                      )}
                      <select
                        name="vinculoId"
                        required
                        className="rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-sm text-white"
                      >
                        <option value="">Selecionar aluno...</option>
                        {activeVinculos.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.student.name}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm">
                        Agendar aula
                      </Button>
                    </form>

                    {/* Bloquear horário */}
                    <form action={personalBlockSlotFormAction} className="flex items-center gap-2">
                      <input type="hidden" name="startAt" value={slot.startAt.toISOString()} />
                      <input type="hidden" name="endAt" value={slot.endAt.toISOString()} />
                      <input
                        name="reason"
                        placeholder="Motivo (opcional)"
                        className="rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-sm text-white"
                      />
                      <Button type="submit" size="sm" variant="outline" className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                        <Ban className="mr-1 h-3.5 w-3.5" />
                        Bloquear
                      </Button>
                    </form>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* If no slots but has write access, show block-all option */}
          {access.canWrite && freeSlots.length === 0 && dayBookings.length === 0 && dayBlocks.length === 0 && (
            <Card className="p-4 text-slate-400">
              Nenhum horário disponível neste dia. Configure sua disponibilidade no{" "}
              <Link href="/personal/perfil" className="text-brand-400 hover:underline">
                seu perfil
              </Link>.
            </Card>
          )}
        </div>
      )}

      {!selectedDate && bookings.length === 0 && (
        <Card className="text-slate-400">Nenhum agendamento ainda.</Card>
      )}
    </div>
  );
}
