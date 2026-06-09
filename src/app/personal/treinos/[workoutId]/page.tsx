import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPersonalAccess } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkoutEditor, DeleteWorkoutForm } from "@/components/personal/workout-editor";
import { ArrowLeft } from "lucide-react";

export default async function PersonalTreinoDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const session = await getSession();
  const access = await getPersonalAccess(session!.id);
  const { workoutId } = await params;

  const workout = await prisma.workout.findFirst({
    where: {
      id: workoutId,
      vinculo: { personalId: session!.id },
    },
    include: {
      vinculo: { include: { student: true } },
      exercises: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!workout) notFound();

  const backHref = `/personal/treinos/aluno/${workout.vinculoId}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href={backHref}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar aos treinos de {workout.vinculo.student.name}
          </Button>
        </Link>
        {access.canWrite && (
          <DeleteWorkoutForm workoutId={workout.id} redirectTo={backHref} />
        )}
      </div>

      <Card>
        <WorkoutEditor
          workoutId={workout.id}
          title={workout.title}
          notes={workout.notes}
          studentName={workout.vinculo.student.name}
          canWrite={access.canWrite}
          exercises={workout.exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            load: exercise.load || undefined,
            restSeconds: exercise.restSeconds || undefined,
            notes: exercise.notes || undefined,
          }))}
        />
      </Card>
    </div>
  );
}
