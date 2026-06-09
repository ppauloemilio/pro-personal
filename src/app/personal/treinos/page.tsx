import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { User, ChevronRight, Dumbbell } from "lucide-react";

export default async function PersonalTreinosPage() {
  const session = await getSession();

  const vinculos = await prisma.vinculo.findMany({
    where: { personalId: session!.id, status: "ATIVO" },
    include: {
      student: true,
      _count: { select: { workouts: true } },
    },
    orderBy: { student: { name: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div>
        <CardTitle>Treinos</CardTitle>
        <p className="mt-1 text-sm text-slate-400">
          Selecione um aluno para ver ou criar treinos.
        </p>
      </div>

      {vinculos.length === 0 ? (
        <Card className="text-slate-400">Nenhum aluno ativo vinculado.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vinculos.map((vinculo) => (
            <Link key={vinculo.id} href={`/personal/treinos/aluno/${vinculo.id}`}>
              <Card className="flex h-full items-center gap-4 transition hover:border-brand-500/40">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500/20">
                  <User className="h-6 w-6 text-brand-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{vinculo.student.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {vinculo._count.workouts} treino(s)
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
