import Link from "next/link";
import {
  Calendar,
  Dumbbell,
  MessageCircle,
  Search,
  Shield,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/layout/app-logo";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { roleHomePath } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect(roleHomePath(session.role));

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 lg:px-8">
        <AppLogo size="md" href="/" />
        <nav className="flex items-center gap-3">
          <Link href="/descoberta" className="hidden text-sm text-slate-400 hover:text-white sm:block">
            Encontrar personal
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">
              Começar grátis
            </Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-12 text-center lg:px-8 lg:pt-20">
        <p className="mb-4 inline-block rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1 text-sm text-brand-300">
          30 dias grátis para personais
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Sua carreira de personal,
          <span className="gradient-text block">organizada em um só lugar</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Treinos, agenda com múltiplas academias, chat com alunos e gestão de
          assinatura. Tudo o que você precisa para o atendimento presencial.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/register?role=PERSONAL">
            <Button size="lg" className="gap-2">
              Sou personal
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/register?role=ALUNO">
            <Button size="lg" variant="outline" className="gap-2">
              Sou aluno
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
        {[
          {
            icon: Dumbbell,
            title: "Treinos inteligentes",
            desc: "Monte fichas e receba comentários por exercício dos alunos.",
          },
          {
            icon: Calendar,
            title: "Agenda multi-academia",
            desc: "Disponibilidade por local, pré-reserva e aprovação de horários.",
          },
          {
            icon: MessageCircle,
            title: "Chat completo",
            desc: "Mensagens, fotos e arquivos com cada aluno.",
          },
          {
            icon: Search,
            title: "Descoberta",
            desc: "Alunos encontram você por especialidade e cidade.",
          },
          {
            icon: Shield,
            title: "Painel admin",
            desc: "Moderação, categorias e suporte aos personais.",
          },
          {
            icon: Check,
            title: "Planos justos",
            desc: "De R$ 20/mês (até 10 alunos) até Pro+ escalável.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="glass animate-fade-in rounded-2xl p-6 text-left"
          >
            <f.icon className="mb-4 h-8 w-8 text-brand-400" />
            <h3 className="font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-surface-border py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Pro-Personal · PT-BR
      </footer>
    </div>
  );
}
