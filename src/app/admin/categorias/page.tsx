import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  approveCategoryFormAction,
  rejectCategoryFormAction,
} from "@/lib/actions";

export default async function AdminCategoriasPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const requests = await prisma.categoryRequest.findMany({
    where: { status: "EM_ANALISE" },
    include: {
      personal: { include: { user: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-8">
      <section>
        <CardTitle className="mb-4">Solicitações pendentes</CardTitle>
        {requests.length === 0 ? (
          <Card className="text-slate-400">Nenhuma solicitação pendente.</Card>
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
                    <p className="mt-1 text-sm text-slate-500">{r.description}</p>
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
                      className="max-w-[200px]"
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

      <section>
        <CardTitle className="mb-4">Categorias aprovadas</CardTitle>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Badge key={c.id} variant="success">
              {c.name}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
