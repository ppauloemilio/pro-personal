import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, ChevronRight, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function AlunoTreinoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const hasActiveVinculo = await prisma.vinculo.count({
    where: { studentId: session.id, status: "ATIVO" },
  });
  if (hasActiveVinculo === 0) redirect("/aluno");

  const workouts = await prisma.workout.findMany({
    where: { vinculo: { studentId: session.id, status: "ATIVO" } },
    include: {
      vinculo: { include: { personal: true } },
      exercises: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <CardTitle>Treinos</CardTitle>
        <p className="mt-1 text-sm text-slate-400">
          Selecione um treino para ver os exercícios e registrar seu progresso.
        </p>
      </div>

      {workouts.length === 0 ? (
        <Card className="text-center text-slate-400">
          Nenhum treino disponível no momento.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workouts.map((workout) => (
            <Link key={workout.id} href={`/aluno/treino/${workout.id}`}>
              <Card className="flex h-full flex-col gap-3 transition hover:border-brand-500/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/20">
                    <Dumbbell className="h-5 w-5 text-brand-400" />
                  </div>
                  {workout.completed ? (
                    <Badge variant="success">Concluído</Badge>
                  ) : (
                    <Badge variant="info">Ativo</Badge>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{workout.title}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <User className="h-3.5 w-3.5" />
                    {workout.vinculo.personal.name}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {workout.exercises.length} exercício(s)
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Criado em{" "}
                    {format(workout.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center justify-end text-sm text-brand-300">
                  Ver treino
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
