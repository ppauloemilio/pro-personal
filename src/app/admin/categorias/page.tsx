import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  approveCategoryFormAction,
  rejectCategoryFormAction,
  adminCreateCategoryFormAction,
  adminDeleteCategoryFormAction,
} from "@/lib/actions";

export default async function AdminCategoriasPage() {
  const [categories, requests] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { personals: true } } },
    }),
    prisma.categoryRequest.findMany({
      where: { status: "EM_ANALISE" },
      include: { personal: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Criar nova categoria */}
      <section>
        <CardTitle className="mb-4">Criar nova categoria</CardTitle>
        <form action={adminCreateCategoryFormAction} className="flex gap-3">
          <input
            name="name"
            required
            placeholder="Nome da categoria"
            className="max-w-sm"
          />
          <Button type="submit">Criar</Button>
        </form>
      </section>

      {/* Solicitações pendentes */}
      <section>
        <CardTitle className="mb-4">
          Solicitações pendentes ({requests.length})
        </CardTitle>
        {requests.length === 0 ? (
          <Card className="text-slate-400">
            Nenhuma solicitação pendente.
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <Card key={r.id} className="space-y-3">
                <div>
                  <p className="font-medium text-white">{r.name}</p>
                  <p className="text-sm text-slate-400">
                    Por {r.personal.user.name}
                  </p>
                  {r.description && (
                    <p className="mt-1 text-sm text-slate-500">
                      {r.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={approveCategoryFormAction}>
                    <input type="hidden" name="requestId" value={r.id} />
                    <Button type="submit" size="sm">
                      Aprovar
                    </Button>
                  </form>
                  <form action={rejectCategoryFormAction} className="flex gap-2">
                    <input type="hidden" name="requestId" value={r.id} />
                    <input
                      name="reason"
                      placeholder="Motivo recusa"
                      className="max-w-[200px] rounded-lg border border-surface-border bg-surface-elevated px-3 py-1 text-sm text-white placeholder-slate-500"
                    />
                    <Button type="submit" size="sm" variant="danger">
                      Recusar
                    </Button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Categorias cadastradas */}
      <section>
        <CardTitle className="mb-4">
          Categorias cadastradas ({categories.length})
        </CardTitle>
        <div className="space-y-2">
          {categories.length === 0 && (
            <p className="text-sm text-slate-400">
              Nenhuma categoria cadastrada.
            </p>
          )}
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl bg-surface-elevated/50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Badge variant="success">{c.name}</Badge>
                <span className="text-sm text-slate-400">
                  {c._count.personals} personal
                  {c._count.personals !== 1 ? "s" : ""}
                </span>
              </div>
              <form action={adminDeleteCategoryFormAction}>
                <input type="hidden" name="categoryId" value={c.id} />
                <Button type="submit" size="sm" variant="danger">
                  Excluir
                </Button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
