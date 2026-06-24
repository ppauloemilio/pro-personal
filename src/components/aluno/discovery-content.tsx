import Link from "next/link";
import { getDiscoveryPersonals } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, User, CheckCircle } from "lucide-react";
import { requestVinculoDiscoveryFormAction } from "@/lib/actions";
import type { UserRole } from "@prisma/client";

type DiscoveryFilters = {
  q?: string;
  city?: string;
  category?: string;
};

export async function DiscoveryContent({
  filters,
  sessionRole,
  vinculoSent,
  linkedPersonalIds = [],
}: {
  filters: DiscoveryFilters;
  sessionRole?: UserRole | null;
  vinculoSent?: boolean;
  linkedPersonalIds?: string[];
}) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const allPersonals = await getDiscoveryPersonals(filters);

  // Filter out already-linked personals
  const personals = allPersonals.filter((p) => !linkedPersonalIds.includes(p.userId));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white lg:text-3xl">
          Buscar personal
        </h1>
        <p className="mt-2 text-slate-400">
          Busque por especialidade e cidade. Solicite vínculo para começar.
        </p>
      </div>

      {vinculoSent && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
          <div>
            <p className="font-medium text-emerald-300">Solicitação de vínculo enviada com sucesso!</p>
            <p className="text-sm text-emerald-400/70">
              Aguarde o personal aceitar sua solicitação. Você será notificado.
            </p>
          </div>
        </div>
      )}

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-surface-border bg-surface-card/50 p-4 sm:grid-cols-4"
      >
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Nome ou bio..."
          className="sm:col-span-2"
        />
        <input name="city" defaultValue={filters.city} placeholder="Cidade" />
        <select name="category" defaultValue={filters.category || ""}>
          <option value="">Todas categorias</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="submit" className="sm:col-span-4">
          Buscar
        </Button>
      </form>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {personals.map((p) => (
          <Card key={p.id} className="flex flex-col">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/20 overflow-hidden">
              {p.user.avatarUrl ? (
                <img src={p.user.avatarUrl} alt={p.user.name} className="h-14 w-14 object-cover rounded-2xl" />
              ) : (
                <User className="h-7 w-7 text-brand-400" />
              )}
            </div>
            <CardTitle>{p.user.name}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-1">
              {p.categories.map((c) => (
                <Badge key={c.categoryId} variant="success">
                  {c.category.name}
                </Badge>
              ))}
            </div>
            <p className="mt-3 flex-1 text-sm text-slate-400 line-clamp-3">
              {p.bio || "Personal na Pro-Personal"}
            </p>
            {p.locations[0] && (
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {p.locations[0].city || p.locations[0].name}
              </p>
            )}
            {/* Portfolio thumbnails */}
            {p.portfolioPhotos && p.portfolioPhotos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-1">
                {p.portfolioPhotos.slice(0, 3).map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.photoUrl}
                    alt={photo.caption || "Portfólio"}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
            {sessionRole === "ALUNO" ? (
              <form action={requestVinculoDiscoveryFormAction} className="mt-4">
                <input type="hidden" name="personalUserId" value={p.userId} />
                <Button type="submit" size="sm" className="w-full">
                  Solicitar vínculo
                </Button>
              </form>
            ) : (
              <Link href="/register?role=ALUNO" className="mt-4 block">
                <Button size="sm" variant="outline" className="w-full">
                  Cadastre-se como aluno
                </Button>
              </Link>
            )}
          </Card>
        ))}
      </div>
      {personals.length === 0 && (
        <p className="text-center text-slate-400">
          Nenhum personal encontrado com esses filtros.
        </p>
      )}
    </div>
  );
}
