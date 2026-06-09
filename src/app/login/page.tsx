import Link from "next/link";
import { loginAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/layout/app-logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMsg =
    params.error === "invalid"
      ? "Credenciais inválidas ou conta bloqueada."
      : null;
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <AppLogo size="lg" />
          </div>
          <CardTitle>Entrar no Pro-Personal</CardTitle>
          <p className="mt-2 text-sm text-slate-400">
            Acesse sua conta de personal, aluno ou admin
          </p>
        </div>
        {errorMsg && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {errorMsg}
          </p>
        )}
        <form action={loginAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-slate-400">E-mail</label>
            <input name="email" type="email" required placeholder="seu@email.com" className="w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Senha</label>
            <input name="password" type="password" required placeholder="••••••••" className="w-full" />
          </div>
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
        <p className="text-center text-sm text-slate-400">
          Não tem conta?{" "}
          <Link href="/register" className="text-brand-400 hover:underline">
            Cadastre-se
          </Link>
        </p>
        <div className="rounded-xl bg-surface-elevated/50 p-3 text-xs text-slate-500">
          <p className="font-medium text-slate-400">Demo (senha: demo123)</p>
          <p>personal@demo.com · aluno@demo.com · admin@propersonal.com</p>
        </div>
      </Card>
    </div>
  );
}
