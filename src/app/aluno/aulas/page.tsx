import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingCard } from "@/components/booking-card";
import { StudentBookingActions } from "@/components/aluno/student-booking-actions";
import { BookingMonthCalendar } from "@/components/booking-month-calendar";
import { buildBookingsByDate } from "@/lib/booking-calendar";
import { ArrowLeft } from "lucide-react";
import type { BookingStatus } from "@prisma/client";

const CALENDAR_STATUSES: BookingStatus[] = [
  "PENDENTE",
  "CONFIRMADA",
  "CANCELAMENTO_SOLICITADO",
  "RECUSADA",
];

export default async function AlunoAulasPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;

  const bookings = await prisma.booking.findMany({
    where: {
      vinculo: { studentId: session.id, status: "ATIVO" },
      status: { in: CALENDAR_STATUSES },
    },
    include: {
      vinculo: { include: { personal: true } },
    },
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
        <CardTitle>Minhas aulas</CardTitle>
        <p className="mt-1 text-sm text-slate-400">
          Veja suas aulas no calendário. Toque em um dia para ver os detalhes.
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card className="text-center text-slate-400">
          Você ainda não tem aulas agendadas.
        </Card>
      ) : (
        <>
          <BookingMonthCalendar
            bookingsByDate={bookingsByDate}
            selectedDate={selectedDate}
            basePath="/aluno/aulas"
            startOnCurrentMonth
            legend={[
              { tone: "upcoming", label: "Próximas aulas" },
              { tone: "past", label: "Aulas realizadas" },
              { tone: "pending", label: "Aguardando aprovação" },
              { tone: "rejected", label: "Pedidos recusados" },
            ]}
          />

          {selectedDate && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-medium text-white">
                  Aulas de{" "}
                  {format(parseISO(selectedDate), "EEEE, dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </h3>
                <Link href="/aluno/aulas">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao calendário
                  </Button>
                </Link>
              </div>

              {dayBookings.length === 0 ? (
                <Card className="text-slate-400">Nenhuma aula neste dia.</Card>
              ) : (
                dayBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    startAt={booking.startAt}
                    endAt={booking.endAt}
                    locationName={booking.locationName}
                    locationAddress={booking.locationAddress}
                    locationMapUrl={booking.locationMapUrl}
                    status={booking.status}
                    highlight={booking.status === "RECUSADA"}
                    actions={
                      <div className="w-full space-y-3">
                        <div className="grid gap-1 text-sm">
                          <p className="text-slate-300">
                            <span className="text-slate-500">Personal: </span>
                            {booking.vinculo.personal.name}
                          </p>
                          <p className="text-slate-300">
                            <span className="text-slate-500">Horário: </span>
                            {format(booking.startAt, "HH:mm", { locale: ptBR })} –{" "}
                            {format(booking.endAt, "HH:mm", { locale: ptBR })}
                          </p>
                          {booking.status === "RECUSADA" && (
                            <p className="text-xs text-rejected-300">
                              Pedido recusado pelo personal.
                            </p>
                          )}
                          {booking.cancelReason && (
                            <p className="text-xs text-slate-500">
                              Motivo: {booking.cancelReason}
                            </p>
                          )}
                        </div>
                        <StudentBookingActions
                          bookingId={booking.id}
                          status={booking.status}
                          startAt={booking.startAt.toISOString()}
                        />
                      </div>
                    }
                  />
                ))
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
