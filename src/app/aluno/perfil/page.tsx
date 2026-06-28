import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentAvatarUpload } from "@/components/aluno/avatar-upload";
import { StudentProfileForm } from "@/components/aluno/student-profile-form";
import { DesvincularButton } from "@/components/desvincular-button";
import Link from "next/link";

export default async function AlunoPerfilPage() {
  const session = await getSession();
  if (!session || session.role !== "ALUNO") return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { studentProfile: true },
  });

  const vinculos = await prisma.vinculo.findMany({
    where: { studentId: session.id, status: { in: ["ATIVO", "PENDENTE"] } },
    include: {
      personal: {
        include: {
          personalProfile: {
            include: { categories: { include: { category: true } } },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const activeVinculos = vinculos.filter((v) => v.status === "ATIVO");
  const pendingVinculos = vinculos.filter((v) => v.status === "PENDENTE");
  const endedVinculos = await prisma.vinculo.findMany({
    where: { studentId: session.id, status: "ENCERRADO" },
    include: { personal: true },
    orderBy: { endedAt: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Foto de perfil + dados editáveis */}
      <Card>
        <CardTitle>Meu perfil</CardTitle>
        <div className="mt-4">
          <StudentAvatarUpload currentAvatar={user?.avatarUrl || null} />
        </div>
        <div className="mt-4">
          <StudentProfileForm
            initialName={user?.name || ""}
            initialEmail={user?.email || ""}
            initialPhone={user?.studentProfile?.phone || null}
            initialAge={user?.studentProfile?.age || null}
            initialObservation={user?.studentProfile?.observation || null}
          />
        </div>
      </Card>

      {/* Vínculos ativos */}
      <div>
        <CardTitle>Meus personais</CardTitle>
        {activeVinculos.length === 0 ? (
          <Card className="mt-4 text-center text-slate-400">
            Nenhum personal vinculado.
            <Link href="/aluno/buscar-personal" className="mt-2 block">
              <Button variant="outline" size="sm">Buscar personal</Button>
            </Link>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {activeVinculos.map((v) => (
              <Card key={v.id} className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{v.personal.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {v.personal.personalProfile?.categories.map((c) => (
                      <Badge key={c.categoryId} variant="success" className="text-xs">{c.category.name}</Badge>
                    ))}
                  </div>
                  <Badge variant="success" className="mt-2">Ativo</Badge>
                </div>
                <DesvincularButton vinculoId={v.id} role="ALUNO" />
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Vínculos pendentes */}
      {pendingVinculos.length > 0 && (
        <div>
          <CardTitle>Solicitações pendentes</CardTitle>
          <div className="mt-4 space-y-3">
            {pendingVinculos.map((v) => (
              <Card key={v.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{v.personal.name}</p>
                  <Badge variant="warning">Pendente</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Vínculos encerrados */}
      {endedVinculos.length > 0 && (
        <div>
          <CardTitle>Histórico</CardTitle>
          <div className="mt-4 space-y-3">
            {endedVinculos.map((v) => (
              <Card key={v.id} className="text-sm">
                <p className="font-medium text-slate-300">{v.personal.name}</p>
                <Badge variant="default" className="mt-1">Encerrado</Badge>
                {v.endReason && (
                  <p className="mt-1 text-xs text-slate-500">Motivo: {v.endReason}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
