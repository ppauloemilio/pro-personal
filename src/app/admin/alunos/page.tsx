import { Suspense } from "react";

import { prisma } from "@/lib/prisma";

import { Card, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { BlockUserForm } from "@/components/admin/block-user-form";

import { SearchInput } from "@/components/search/search-input";

import { matchesSearch } from "@/lib/search";



export default async function AdminAlunosPage({

  searchParams,

}: {

  searchParams: Promise<{ q?: string }>;

}) {

  const params = await searchParams;

  const query = params.q?.trim();



  const alunos = await prisma.user.findMany({

    where: { role: "ALUNO" },

    include: {

      vinculosAsStudent: {

        include: {

          personal: true,

        },

      },

    },

    orderBy: { createdAt: "desc" },

  });



  const filtered = query

    ? alunos.filter((a) =>

        matchesSearch(

          query,

          a.name,

          a.email,

          ...a.vinculosAsStudent.flatMap((v) => [v.personal.name, v.status])

        )

      )

    : alunos;



  return (

    <div className="space-y-4">

      <Suspense

        fallback={

          <div className="h-11 animate-pulse rounded-xl bg-surface-elevated/50" />

        }

      >

        <SearchInput placeholder="Buscar aluno por nome, e-mail ou personal..." />

      </Suspense>

      <p className="text-sm text-slate-400">

        {filtered.length} de {alunos.length} aluno(s)

        {query ? ` para "${query}"` : " cadastrado(s)"}

      </p>

      {filtered.length === 0 ? (

        <Card className="text-center text-slate-400">

          Nenhum aluno encontrado com essa busca.

        </Card>

      ) : (

        filtered.map((a) => (

          <Card

            key={a.id}

            className="flex flex-wrap items-center justify-between gap-4"

          >

            <div>

              <CardTitle className="text-base">{a.name}</CardTitle>

              <p className="text-sm text-slate-400">{a.email}</p>

              <Badge

                variant={a.status === "ATIVO" ? "success" : "danger"}

                className="mt-2"

              >

                {a.status}

              </Badge>

              <p className="mt-2 text-xs text-slate-500">

                Vínculos:{" "}

                {a.vinculosAsStudent

                  .map((v) => `${v.personal.name} (${v.status})`)

                  .join(" · ") || "Nenhum"}

              </p>

            </div>

            {a.status === "ATIVO" && <BlockUserForm userId={a.id} />}

          </Card>

        ))

      )}

    </div>

  );

}

