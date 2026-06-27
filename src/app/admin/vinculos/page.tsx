import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminDesvincularFormAction } from "@/lib/actions";
import { SearchInput } from "@/components/search/search-input";
import { matchesSearch } from "@/lib/search";
import { Suspense } from "react";

export default async function AdminVinculosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim();

  const vinculos = await prisma.vinculo.findMany({
    include: {
      personal: true,
      student: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const filtered = query
    ? vinculos.filter((v) =>
        matchesSearch(
          query,
          v.personal.name,
          v.student.name,
          v.status,
          v.endReason || undefined
        )
      )
    : vinculos;

  const active = vinculos.filter((v) => v.status === "ATIVO");
  const pending = vinculos.filter((v) => v.status === "PENDENTE");
  const ended = vinculos.filter((v) => v.status === "ENCERRADO");

  return (
    <div className="space-y-6">
      <CardTitle>Vínculos</CardTitle>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-emerald-400">{active.length}</p>
          <p className="text-sm text-slate-400">Ativos</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-amber-400">{pending.length}</p>
          <p className="text-sm text-slate-400">Pendentes</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-slate-400">{ended.length}</p>
          <p className="text-sm text-slate-400">Encerrados</p>
        </Card>
      </div>

      <Suspense
        fallback={<div className="h-11 animate-pulse rounded-xl bg-surface-elevated/50" />}
      >
        <SearchInput placeholder="Buscar por nome do personal ou aluno..." />
      </Suspense>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="text-center text-slate-400">
            Nenhum vínculo encontrado.
          </Card>
        ) : (
          filtered.map((v) => (
            <Card key={v.id} className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  Personal → Aluno
                </p>
                <p className="font-medium text-white">{v.personal.name}</p>
                <p className="text-sm text-slate-400">{v.student.name}</p>
                {v.createdAt && (
                  <p className="text-xs text-slate-500">
                    Início: {v.createdAt.toLocaleDateString("pt-BR")}
                  </p>
                )}
                <Badge
                  variant={
                    v.status === "ATIVO" ? "success" :
                    v.status === "PENDENTE" ? "warning" : "default"
                  }
                  className="mt-2"
                >
                  {v.status}
                </Badge>
                {v.endReason && (
                  <p className="mt-1 text-xs text-slate-500">Motivo: {v.endReason}</p>
                )}
                {v.endedAt && (
                  <p className="text-xs text-slate-500">
                    Encerrado em {v.endedAt.toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
              {v.status === "ATIVO" && (
                <form action={adminDesvincularFormAction}>
                  <input type="hidden" name="vinculoId" value={v.id} />
                  <Button type="submit" size="sm" variant="danger">Encerrar vínculo</Button>
                </form>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
