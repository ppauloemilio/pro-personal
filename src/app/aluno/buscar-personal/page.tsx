import { getSession } from "@/lib/auth";
import { DiscoveryContent } from "@/components/aluno/discovery-content";

export default async function AlunoBuscarPersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; category?: string; vinculo?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;

  return <DiscoveryContent filters={params} sessionRole={session?.role} vinculoSent={params.vinculo === "sent"} />;
}
