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
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
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

  const bookings = await prisma.booking.findMany({
    where: {
      vinculo: { personalId: session!.id },
      status: { in: AGENDA_STATUSES },
    },
    include: { vinculo: { include: { student: true } } },
    orderBy: { startAt: "asc" },
  });

  const bookingsByDate = buildBookingsByDate(bookings);
  const selectedDate = params.date;
  const dayBookings = selectedDate
    ? bookings.filter((b) => format(b.startAt, "yyyy-MM-dd") === selectedDate)
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

          {dayBookings.length === 0 ? (
            <Card className="text-slate-400">Nenhum agendamento neste dia.</Card>
          ) : (
            dayBookings.map((b) => (
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
            ))
          )}
        </div>
      )}

      {!selectedDate && bookings.length === 0 && (
        <Card className="text-slate-400">Nenhum agendamento ainda.</Card>
      )}
    </div>
  );
}
