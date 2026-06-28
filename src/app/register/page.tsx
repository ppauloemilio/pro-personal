import Link from "next/link";
import { registerAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/layout/app-logo";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>;
}) {
  const params = await searchParams;
  const allowAdmin = params.role === "ADMIN";
  const defaultRole = allowAdmin
    ? "ADMIN"
    : params.role === "PERSONAL"
      ? "PERSONAL"
      : "ALUNO";
  const errorMsg =
    params.error === "exists"
      ? "E-mail já cadastrado."
      : params.error === "missing"
        ? "Preencha todos os campos."
        : params.error === "admin_exists"
          ? "Já existe uma conta de administrador."
          : null;

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <AppLogo size="lg" />
        </div>
        <CardTitle className="text-center">Criar conta</CardTitle>
        {errorMsg && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {errorMsg}
          </p>
        )}
        <form action={registerAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nome</label>
            <input name="name" required placeholder="Seu nome" className="w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">E-mail</label>
            <input name="email" type="email" required className="w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Senha</label>
            <input name="password" type="password" required minLength={6} className="w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Telefone</label>
            <input name="phone" type="tel" placeholder="(11) 99999-9999" className="w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Idade</label>
            <input name="age" type="number" min={1} max={120} placeholder="Ex: 25" className="w-full" />
          </div>
          {allowAdmin && (
            <div>
              <label className="mb-1 block text-xs text-slate-400">Tipo de conta</label>
              <select name="role" defaultValue="ADMIN" className="w-full">
                <option value="ADMIN">Administrador</option>
                <option value="PERSONAL">Personal trainer</option>
                <option value="ALUNO">Aluno</option>
              </select>
              <p className="mt-1 text-xs text-amber-400">⚠️ Modo de criação de administrador</p>
            </div>
          )}
          {!allowAdmin && (
            <div>
              <label className="mb-1 block text-xs text-slate-400">Tipo de conta</label>
              <select name="role" defaultValue={defaultRole} className="w-full">
                <option value="PERSONAL">Personal trainer</option>
                <option value="ALUNO">Aluno</option>
              </select>
            </div>
          )}
          <Button type="submit" className="w-full">
            Cadastrar
          </Button>
        </form>
        <p className="text-center text-sm text-slate-400">
          Já tem conta?{" "}
          <Link href="/login" className="text-brand-400 hover:underline">
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  );
}
