import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/layout/app-logo";
import { DiscoveryContent } from "@/components/aluno/discovery-content";

export default async function DescobertaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; category?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;

  if (session?.role === "ALUNO") {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.city) query.set("city", params.city);
    if (params.category) query.set("category", params.category);
    const suffix = query.toString();
    redirect(`/aluno/buscar-personal${suffix ? `?${suffix}` : ""}`);
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-surface-border px-4 py-4 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <AppLogo size="md" href="/" />
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <DiscoveryContent filters={params} sessionRole={session?.role} />
      </main>
    </div>
  );
}
