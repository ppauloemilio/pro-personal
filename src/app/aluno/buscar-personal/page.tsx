import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DiscoveryContent } from "@/components/aluno/discovery-content";

export default async function AlunoBuscarPersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; category?: string; vinculo?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;

  // Get IDs of already-linked personals to exclude from search
  let linkedPersonalIds: string[] = [];
  if (session?.role === "ALUNO") {
    const vinculos = await prisma.vinculo.findMany({
      where: { studentId: session.id, status: { in: ["ATIVO", "PENDENTE"] } },
      select: { personalId: true },
    });
    linkedPersonalIds = vinculos.map((v) => v.personalId);
  }

  return (
    <DiscoveryContent
      filters={params}
      sessionRole={session?.role}
      vinculoSent={params.vinculo === "sent"}
      linkedPersonalIds={linkedPersonalIds}
    />
  );
}
