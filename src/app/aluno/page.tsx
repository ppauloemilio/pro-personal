import { getSession } from "@/lib/auth";
import { getStudentContext } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dumbbell, Calendar, Search } from "lucide-react";
import { requestVinculoInviteFormAction } from "@/lib/actions";
import { BookingCard } from "@/components/booking-card";

export default async function AlunoHomePage() {
  const session = await getSession();
  const ctx = await getStudentContext(session!.id);
  const active = ctx.vinculos.find((v) => v.status === "ATIVO");

  if (!active) {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <Card className="space-y-4">
          <CardTitle>Vincule-se a um personal</CardTitle>
          <p className="text-slate-400">
            Você precisa de um vínculo ativo para usar o app. Use um código de
            convite ou encontre um personal em Buscar Personal.
          </p>
          <Link href="/aluno/buscar-personal">
            <Button className="w-full gap-2">
              <Search className="h-4 w-4" />
              Descobrir personais
            </Button>
          </Link>
          <form action={requestVinculoInviteFormAction} className="flex gap-2">
            <input
              name="code"
              placeholder="Código de convite"
              className="flex-1"
              defaultValue="DEMO2024"
            />
            <Button type="submit" variant="secondary">
              Vincular
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const vinculoId = ctx.activeVinculo?.id || active.id;
  const nextBooking = await prisma.booking.findFirst({
    where: {
      vinculoId,
      status: { in: ["CONFIRMADA", "PENDENTE"] },
      startAt: { gte: new Date() },
    },
    orderBy: { startAt: "asc" },
  });

  const workout = await prisma.workout.findFirst({
    where: { vinculoId, completed: false },
    include: { exercises: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <p className="text-sm text-slate-400">Personal ativo</p>
        <h2 className="text-2xl font-bold text-white">
          {ctx.activeVinculo?.personal.name || active.personal.name}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/aluno/treino">
          <Card className="transition hover:border-brand-500/40">
            <Dumbbell className="mb-3 h-8 w-8 text-brand-400" />
            <CardTitle>Treino de hoje</CardTitle>
            <p className="mt-2 text-sm text-slate-400">
              {workout ? workout.title : "Nenhum treino pendente"}
            </p>
          </Card>
        </Link>
        <Link href="/aluno/agendar">
          <Card className="transition hover:border-brand-500/40">
            <Calendar className="mb-3 h-8 w-8 text-brand-400" />
            <CardTitle>Agendar aula</CardTitle>
            <p className="mt-2 text-sm text-slate-400">Ver horários livres</p>
          </Card>
        </Link>
      </div>

      {nextBooking && (
        <section>
          <CardTitle className="mb-4">Próxima aula</CardTitle>
          <BookingCard
            startAt={nextBooking.startAt}
            endAt={nextBooking.endAt}
            locationName={nextBooking.locationName}
            locationAddress={nextBooking.locationAddress}
            locationMapUrl={nextBooking.locationMapUrl}
            status={nextBooking.status}
          />
        </section>
      )}
    </div>
  );
}
