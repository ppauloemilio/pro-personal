import { getSession } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

import { getPersonalAccess } from "@/lib/permissions";

import { Card, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { AcceptVinculoForm, RejectVinculoForm } from "@/components/forms/action-forms";

import { SearchInput } from "@/components/search/search-input";

import { matchesSearch } from "@/lib/search";

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



      <div className="space-y-3">

        {filtered.length === 0 ? (

          <Card className="text-center text-slate-400">

            Nenhum aluno encontrado com essa busca.

          </Card>

        ) : (

          filtered.map((v) => (

            <Card key={v.id} className="flex flex-wrap items-center justify-between gap-4">

              <div>

                <p className="font-medium text-white">{v.student.name}</p>

                <p className="text-sm text-slate-400">{v.student.email}</p>

                <Badge

                  variant={

                    v.status === "ATIVO"

                      ? "success"

                      : v.status === "PENDENTE"

                        ? "warning"

                        : "default"

                  }

                  className="mt-2"

                >

                  {v.status}

                </Badge>

              </div>

              {v.status === "PENDENTE" && (

                <div className="flex gap-2">

                  {access.canAddStudents ? (

                    <>

                      <AcceptVinculoForm vinculoId={v.id} />

                      <RejectVinculoForm vinculoId={v.id} />

                    </>

                  ) : (

                    <Badge variant="danger">Modo leitura</Badge>

                  )}

                </div>

              )}

            </Card>

          ))

        )}

      </div>

    </div>

  );

}

