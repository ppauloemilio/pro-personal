import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { completeExerciseFormAction } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function AlunoTreinoDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const session = await getSession();
  const { workoutId } = await params;

  const workout = await prisma.workout.findFirst({
    where: {
      id: workoutId,
      vinculo: { studentId: session!.id, status: "ATIVO" },
    },
    include: {
      vinculo: { include: { personal: true } },
      exercises: {
        include: {
          logs: { include: { comments: true } },
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!workout) notFound();

  return (
    <div className="space-y-6">
      <Link href="/aluno/treino">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Voltar aos treinos
        </Button>
      </Link>

      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>{workout.title}</CardTitle>
          {workout.completed ? (
            <Badge variant="success">Concluído</Badge>
          ) : (
            <Badge variant="info">Ativo</Badge>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Personal: {workout.vinculo.personal.name}
        </p>
        {workout.notes && (
          <p className="mt-2 text-sm text-slate-400">{workout.notes}</p>
        )}
        <p className="mt-1 text-xs text-slate-500">
          {workout.exercises.length} exercício(s) ·{" "}
          {format(workout.createdAt, "dd/MM/yyyy", { locale: ptBR })}
        </p>
      </div>

      {workout.exercises.length === 0 ? (
        <Card className="text-center text-slate-400">
          Este treino ainda não possui exercícios cadastrados.
        </Card>
      ) : (
        workout.exercises.map((ex) => {
          const log = ex.logs[0];
          return (
            <Card key={ex.id} className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-white">{ex.name}</h3>
                  <p className="text-sm text-slate-400">
                    {ex.sets}×{ex.reps}
                    {ex.load ? ` · ${ex.load}` : ""}
                    {ex.restSeconds ? ` · ${ex.restSeconds}s descanso` : ""}
                  </p>
                  {ex.notes && (
                    <p className="mt-1 text-xs text-brand-300/80">{ex.notes}</p>
                  )}
                </div>
                {log?.completed && <Badge variant="success">Feito</Badge>}
              </div>

              {log && !workout.completed && (
                <>
                  <form
                    action={completeExerciseFormAction}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <input type="hidden" name="logId" value={log.id} />
                    <input
                      name="actualSets"
                      type="number"
                      placeholder="Séries feitas"
                      defaultValue={log.actualSets || ex.sets}
                    />
                    <input
                      name="actualReps"
                      placeholder="Reps"
                      defaultValue={log.actualReps || ex.reps}
                    />
                    <input
                      name="actualLoad"
                      placeholder="Carga"
                      defaultValue={log.actualLoad || ex.load || ""}
                    />
                    <input
                      name="studentNote"
                      placeholder="Comentário (opcional)"
                      defaultValue={log.studentNote || ""}
                    />
                    <Button type="submit" className="sm:col-span-2">
                      {log.completed ? "Atualizar" : "Marcar como feito"}
                    </Button>
                  </form>
                  {log.comments.map((c) => (
                    <p key={c.id} className="text-xs text-slate-500">
                      Comentário registrado
                    </p>
                  ))}
                </>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
