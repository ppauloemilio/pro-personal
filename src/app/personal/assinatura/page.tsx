import { getSession } from "@/lib/auth";
import { getPersonalAccess } from "@/lib/permissions";
import { calculateMonthlyPrice } from "@/lib/billing";
import { formatCurrency } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { activateSubscriptionAction } from "@/lib/actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check } from "lucide-react";

export default async function PersonalAssinaturaPage() {
  const session = await getSession();
  const access = await getPersonalAccess(session!.id);
  const pricing = calculateMonthlyPrice(access.activeStudents);

  const tiers = [
    { name: "Starter", range: "1 a 10 alunos", price: "R$ 20/mês" },
    { name: "Pro", range: "11 a 30 alunos", price: "R$ 50/mês" },
    {
      name: "Pro+",
      range: "Acima de 30",
      price: "R$ 50 + R$ 1,50 por aluno excedente",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card className="border-brand-500/30 bg-brand-500/5">
        <CardTitle>Sua assinatura</CardTitle>
        <div className="mt-4 flex flex-wrap gap-3">
          <Badge variant={access.isTrial ? "info" : access.isReadOnly ? "danger" : "success"}>
            {access.planLabel}
          </Badge>
          <Badge variant="default">
            {access.activeStudents} alunos ativos
          </Badge>
        </div>
        <p className="mt-4 text-3xl font-bold text-white">
          {access.isTrial
            ? "Trial gratuito"
            : formatCurrency(access.monthlyAmount)}
          <span className="text-base font-normal text-slate-400"> /mês</span>
        </p>
        {access.trialEndsAt && access.isTrial && (
          <p className="mt-2 text-sm text-slate-400">
            Trial até {format(access.trialEndsAt, "dd 'de' MMMM yyyy", { locale: ptBR })}
          </p>
        )}
        {pricing.tier === "pro_plus" && (
          <p className="mt-2 text-sm text-brand-300">
            Excedente: {pricing.excess} alunos × R$ 1,50
          </p>
        )}
        {(access.isReadOnly || access.isTrial) && (
          <form action={activateSubscriptionAction} className="mt-6">
            <Button type="submit" className="w-full sm:w-auto">
              Ativar plano (simulação)
            </Button>
            <p className="mt-2 text-xs text-slate-500">
              Integração de pagamento em breve. Use para testar modo ativo.
            </p>
          </form>
        )}
      </Card>

      <Card>
        <CardTitle>Simulador de planos</CardTitle>
        <div className="mt-4 space-y-4">
          {[5, 15, 35, 50].map((n) => {
            const p = calculateMonthlyPrice(n);
            return (
              <div
                key={n}
                className="flex justify-between rounded-xl bg-surface-elevated/50 px-4 py-3 text-sm"
              >
                <span>{n} alunos → {p.label}</span>
                <span className="font-medium text-brand-300">
                  {formatCurrency(p.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4">
        {tiers.map((t) => (
          <Card key={t.name}>
            <div className="flex items-start gap-3">
              <Check className="mt-1 h-5 w-5 text-brand-400" />
              <div>
                <p className="font-semibold text-white">{t.name}</p>
                <p className="text-sm text-slate-400">{t.range}</p>
                <p className="text-sm text-brand-300">{t.price}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
