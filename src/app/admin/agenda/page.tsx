import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { adminCancelBookingFormAction } from "@/lib/actions";
import { AdminCreateBookingForm } from "./admin-create-booking-form";

export default async function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ personalId?: string; studentId?: string; date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date || format(new Date(), "yyyy-MM-dd");

  const personals = await prisma.user.findMany({
    where: { role: "PERSONAL", status: "ATIVO" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const students = await prisma.user.findMany({
    where: { role: "ALUNO", status: "ATIVO" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const selectedPersonalId = params.personalId;
  const selectedStudentId = params.studentId;

  const where: Record<string, unknown> = {};
  if (selectedPersonalId) {
    where.vinculo = { personalId: selectedPersonalId };
  } else if (selectedStudentId) {
    where.vinculo = { studentId: selectedStudentId };
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      ...where,
      startAt: { gte: dayStart, lte: dayEnd },
    },
    include: {
      vinculo: { include: { personal: true, student: true } },
    },
    orderBy: { startAt: "asc" },
  });

  // Data for the create booking form
  const vinculos = await prisma.vinculo.findMany({
    where: {
      status: "ATIVO",
      ...(selectedPersonalId ? { personalId: selectedPersonalId } : {}),
      ...(selectedStudentId ? { studentId: selectedStudentId } : {}),
    },
    include: {
      personal: true,
      student: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get locations for the selected personal (or all if none selected)
  const locations = await prisma.location.findMany({
    where: selectedPersonalId
      ? { personal: { userId: selectedPersonalId } }
      : {},
    include: { personal: { include: { user: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <CardTitle>Agenda</CardTitle>

      {/* Filters */}
      <form method="get" className="grid gap-3 sm:grid-cols-3">
        <select name="personalId" defaultValue={selectedPersonalId || ""} className="w-full">
          <option value="">Todos personais</option>
          {personals.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select name="studentId" defaultValue={selectedStudentId || ""} className="w-full">
          <option value="">Todos alunos</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input name="date" type="date" defaultValue={date} className="w-full" />
        <Button type="submit" className="sm:col-span-3">Filtrar</Button>
      </form>

      <p className="text-sm text-slate-400">
        {bookings.length} agendamento(s) em {format(dayStart, "dd/MM/yyyy")}
      </p>

      {/* Create booking form */}
      <AdminCreateBookingForm
        vinculos={vinculos}
        locations={locations}
        date={date}
        selectedPersonalId={selectedPersonalId}
      />

      {bookings.length === 0 ? (
        <Card className="text-center text-slate-400">
          Nenhum agendamento nesta data.
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium text-white">
                  {format(b.startAt, "HH:mm")} - {format(b.endAt, "HH:mm")}
                </p>
                <p className="text-sm text-slate-400">
                  Personal: {b.vinculo.personal.name} → Aluno: {b.vinculo.student.name}
                </p>
                <p className="text-sm text-slate-500">
                  {b.locationName} · {b.locationAddress}
                </p>
                <Badge
                  variant={
                    b.status === "CONFIRMADA" ? "success" :
                    b.status === "PENDENTE" ? "warning" :
                    b.status === "CANCELAMENTO_SOLICITADO" ? "warning" : "default"
                  }
                  className="mt-2"
                >
                  {b.status}
                </Badge>
              </div>
              {/* Cancel button for active bookings */}
              {b.status !== "CANCELADA" && b.status !== "RECUSADA" && (
                <form action={adminCancelBookingFormAction}>
                  <input type="hidden" name="bookingId" value={b.id} />
                  <Button type="submit" size="sm" variant="danger">Cancelar</Button>
                </form>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
