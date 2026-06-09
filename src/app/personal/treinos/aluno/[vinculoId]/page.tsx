import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPersonalAccess } from "@/lib/permissions";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createWorkoutFormAction, deleteWorkoutFormAction } from "@/lib/actions";
import { ArrowLeft, Pencil, Plus } from "lucide-react";

export default async function PersonalAlunoTreinosPage({
  params,
}: {
  params: Promise<{ vinculoId: string }>;
}) {
  const session = await getSession();
  const access = await getPersonalAccess(session!.id);
  const { vinculoId } = await params;

  const vinculo = await prisma.vinculo.findFirst({
    where: { id: vinculoId, personalId: session!.id, status: "ATIVO" },
    include: {
      student: true,
      workouts: {
        include: { exercises: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vinculo) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/personal/treinos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar aos alunos
          </Button>
        </Link>
        {access.canWrite && (
          <form action={createWorkoutFormAction}>
            <input type="hidden" name="vinculoId" value={vinculo.id} />
            <input type="hidden" name="title" value="Novo treino" />
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" />
              Novo treino
            </Button>
          </form>
        )}
      </div>

      <div>
        <CardTitle>Treinos de {vinculo.student.name}</CardTitle>
        <p className="mt-1 text-sm text-slate-400">
          {vinculo.workouts.length} treino(s) cadastrado(s)
        </p>
      </div>

      {vinculo.workouts.length === 0 ? (
        <Card className="text-center text-slate-400">
          Nenhum treino cadastrado. Clique em &quot;Novo treino&quot; para criar uma ficha
          vazia.
        </Card>
      ) : (
        <ul className="space-y-3">
          {vinculo.workouts.map((workout) => (
            <li
              key={workout.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-elevated/40 px-4 py-3"
            >
              <div>
                <span className="font-medium text-brand-300">{workout.title}</span>
                <span className="text-sm text-slate-500">
                  {" "}
                  · {workout.exercises.length} exercícios
                  {workout.completed ? " · Concluído" : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <Link href={`/personal/treinos/${workout.id}`}>
                  <Button size="sm" variant="outline">
                    <Pencil className="h-3.5 w-3.5" />
                    Abrir
                  </Button>
                </Link>
                {access.canWrite && (
                  <form action={deleteWorkoutFormAction}>
                    <input type="hidden" name="workoutId" value={workout.id} />
                    <input
                      type="hidden"
                      name="redirectTo"
                      value={`/personal/treinos/aluno/${vinculo.id}`}
                    />
                    <Button type="submit" size="sm" variant="danger">
                      Excluir
                    </Button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
