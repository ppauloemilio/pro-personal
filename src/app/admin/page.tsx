import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { Users, Dumbbell, Tags } from "lucide-react";

export default async function AdminDashboardPage() {
  const [personals, alunos, pendingCategories, pendingBookings] =
    await Promise.all([
      prisma.user.count({ where: { role: "PERSONAL", status: "ATIVO" } }),
      prisma.user.count({ where: { role: "ALUNO", status: "ATIVO" } }),
      prisma.categoryRequest.count({ where: { status: "EM_ANALISE" } }),
      prisma.booking.count({ where: { status: "PENDENTE" } }),
    ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <Users className="mb-2 h-8 w-8 text-brand-400" />
          <p className="text-2xl font-bold text-white">{personals}</p>
          <p className="text-sm text-slate-400">Personais ativos</p>
        </Card>
        <Card>
          <Dumbbell className="mb-2 h-8 w-8 text-brand-400" />
          <p className="text-2xl font-bold text-white">{alunos}</p>
          <p className="text-sm text-slate-400">Alunos ativos</p>
        </Card>
        <Card>
          <Tags className="mb-2 h-8 w-8 text-amber-400" />
          <p className="text-2xl font-bold text-white">{pendingCategories}</p>
          <p className="text-sm text-slate-400">Categorias pendentes</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-white">{pendingBookings}</p>
          <p className="text-sm text-slate-400">Agendamentos pendentes</p>
        </Card>
      </div>
      <Card>
        <CardTitle>Bem-vindo ao painel admin</CardTitle>
        <p className="mt-2 text-slate-400">
          Gerencie personais, alunos, categorias e converse com personais pelo
          chat de suporte.
        </p>
      </Card>
    </div>
  );
}
