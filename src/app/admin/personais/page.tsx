import { Suspense } from "react";

import { prisma } from "@/lib/prisma";

import { Card, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import Link from "next/link";

import { Button } from "@/components/ui/button";

import { BlockUserForm } from "@/components/admin/block-user-form";

import { SearchInput } from "@/components/search/search-input";

import { matchesSearch } from "@/lib/search";



function formatDate(date: Date) {

  return date.toLocaleDateString("pt-BR", {

    day: "2-digit",

    month: "2-digit",

    year: "2-digit",

  });

}



export default async function AdminPersonaisPage({

  searchParams,

}: {

  searchParams: Promise<{ q?: string }>;

}) {

  const params = await searchParams;

  const query = params.q?.trim();



  const personals = await prisma.user.findMany({

    where: { role: "PERSONAL" },

    include: {

      personalProfile: {

        include: {

          categories: { include: { category: true } },

          locations: true,

        },

      },

      subscription: true,

      vinculosAsPersonal: {

        where: { status: "ATIVO" },

        include: { student: true },

      },

    },

    orderBy: { createdAt: "desc" },

  });



  const filtered = query

    ? personals.filter((p) =>

        matchesSearch(

          query,

          p.name,

          p.email,

          p.personalProfile?.bio,

          ...(p.personalProfile?.categories.map((c) => c.category.name) || []),

          ...(p.personalProfile?.locations.flatMap((l) => [l.name, l.city]) || []),

          ...p.vinculosAsPersonal.flatMap((v) => [v.student.name, v.student.email])

        )

      )

    : personals;



  return (

    <div className="space-y-6">

      <Suspense

        fallback={

          <div className="h-11 animate-pulse rounded-xl bg-surface-elevated/50" />

        }

      >

        <SearchInput placeholder="Buscar personal por nome, e-mail, categoria ou local..." />

      </Suspense>

      <p className="text-sm text-slate-400">

        {filtered.length} de {personals.length} personal(is)

        {query ? ` para "${query}"` : " cadastrado(s)"}

      </p>

      {filtered.length === 0 ? (

        <Card className="text-center text-slate-400">

          Nenhum personal encontrado com essa busca.

        </Card>

      ) : (

        filtered.map((p) => (

          <Card key={p.id} className="space-y-4">

            <div className="flex flex-wrap items-start justify-between gap-4">

              <div>

                <CardTitle>{p.name}</CardTitle>

                <p className="text-sm text-slate-400">{p.email}</p>

                <Badge

                  variant={p.status === "ATIVO" ? "success" : "danger"}

                  className="mt-2"

                >

                  {p.status}

                </Badge>

                {p.subscription && (

                  <p className="mt-2 text-sm text-brand-300">

                    {p.subscription.planLabel} · {p.subscription.status}

                    {p.subscription.trialEndsAt && (

                      <> · trial até {formatDate(p.subscription.trialEndsAt)}</>

                    )}

                  </p>

                )}

              </div>

              {p.status === "ATIVO" && <BlockUserForm userId={p.id} />}

            </div>



            {p.personalProfile && (

              <div className="text-sm text-slate-400">

                <p>

                  Categorias:{" "}

                  {p.personalProfile.categories

                    .map((c) => c.category.name)

                    .join(", ") || "—"}

                </p>

                <p>

                  Locais:{" "}

                  {p.personalProfile.locations.map((l) => l.name).join(", ") ||

                    "—"}

                </p>

              </div>

            )}



            <div>

              <p className="mb-2 text-sm font-medium text-white">
                Alunos ativos: {p.vinculosAsPersonal.length}
              </p>
              <ul className="space-y-1 text-sm text-slate-400">
                {p.vinculosAsPersonal.map((v) => (
                  <li key={v.id} className="flex items-center gap-2">
                    {v.student.avatarUrl ? (
                      <img src={v.student.avatarUrl} alt={v.student.name} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20 text-[10px] text-brand-400">
                        {v.student.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {v.student.name}
                    {v.createdAt && (
                      <span className="text-xs text-slate-500">
                        desde {v.createdAt.toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </li>
                ))}
                {p.vinculosAsPersonal.length === 0 && (
                  <li>Nenhum aluno ativo</li>
                )}
              </ul>
            </div>



            <Link href={`/admin/chat?personalId=${p.id}`}>

              <Button variant="outline" size="sm">

                Abrir chat de suporte

              </Button>

            </Link>

          </Card>

        ))

      )}

    </div>

  );

}

