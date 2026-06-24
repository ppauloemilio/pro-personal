import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPersonalAccess } from "@/lib/permissions";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AcceptVinculoForm, RejectVinculoForm } from "@/components/forms/action-forms";
import { SearchInput } from "@/components/search/search-input";
import { matchesSearch } from "@/lib/search";
import { DesvincularButton } from "@/components/desvincular-button";
import { Suspense } from "react";

export default async function PersonalAlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  const access = await getPersonalAccess(session!.id);
  const params = await searchParams;
  const query = params.q?.trim();

  const profile = await prisma.personalProfile.findUnique({
    where: { userId: session!.id },
  });

  const vinculos = await prisma.vinculo.findMany({
    where: { personalId: session!.id },
    include: { student: true },
    orderBy: { updatedAt: "desc" },
  });

  const activeVinculos = vinculos.filter((v) => v.status === "ATIVO");
  const pendingVinculos = vinculos.filter((v) => v.status === "PENDENTE");
  const endedVinculos = vinculos.filter((v) => v.status === "ENCERRADO");

  const filtered = query
    ? vinculos.filter((v) =>
        matchesSearch(query, v.student.name, v.student.email, v.status)
      )
    : vinculos;

  return (
    <div className="space-y-6">
      <Card className="bg-brand-500/10 border-brand-500/20">
        <CardTitle>Código de convite</CardTitle>
        <p className="mt-2 font-mono text-2xl font-bold text-brand-300">
          {profile?.inviteCode}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Compartilhe com alunos para solicitação de vínculo.
        </p>
      </Card>

      <div className="space-y-4">
        <CardTitle>Meus alunos</CardTitle>
        <Suspense
          fallback={
            <div className="h-11 animate-pulse rounded-xl bg-surface-elevated/50" />
          }
        >
          <SearchInput placeholder="Buscar aluno por nome ou e-mail..." />
        </Suspense>
        <p className="text-sm text-slate-400">
          {filtered.length} de {vinculos.length} aluno(s)
          {query ? ` para "${query}"` : ""}
        </p>
      </div>

      {/* Pending */}
      {pendingVinculos.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-amber-300">Solicitações pendentes</p>
          {pendingVinculos.map((v) => (
            <Card key={v.id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium text-white">{v.student.name}</p>
                <p className="text-sm text-slate-400">{v.student.email}</p>
                <Badge variant="warning" className="mt-2">PENDENTE</Badge>
              </div>
              {access.canAddStudents && (
                <div className="flex gap-2">
                  <AcceptVinculoForm vinculoId={v.id} />
                  <RejectVinculoForm vinculoId={v.id} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Active */}
      {activeVinculos.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-emerald-300">Alunos ativos ({activeVinculos.length})</p>
          {activeVinculos.map((v) => (
            <Card key={v.id} className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {v.student.avatarUrl ? (
                  <img src={v.student.avatarUrl} alt={v.student.name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/20 text-sm text-brand-400">
                    {v.student.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{v.student.name}</p>
                  <p className="text-sm text-slate-400">{v.student.email}</p>
                  <Badge variant="success" className="mt-1">ATIVO</Badge>
                </div>
              </div>
              <DesvincularButton vinculoId={v.id} role="PERSONAL" />
            </Card>
          ))}
        </div>
      )}

      {/* Ended */}
      {endedVinculos.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">Encerrados ({endedVinculos.length})</p>
          {endedVinculos.slice(0, 5).map((v) => (
            <Card key={v.id} className="text-sm opacity-60">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-slate-300">{v.student.name}</p>
                  <Badge variant="default" className="mt-1">ENCERRADO</Badge>
                  {v.endReason && (
                    <p className="mt-1 text-xs text-slate-500">Motivo: {v.endReason}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <Card className="text-center text-slate-400">
          Nenhum aluno encontrado com essa busca.
        </Card>
      )}
    </div>
  );
}
