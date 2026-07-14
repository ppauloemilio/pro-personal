import { getSession } from "@/lib/auth";
import { getPersonalAccess } from "@/lib/permissions";
import { calculateMonthlyPrice } from "@/lib/billing";
import { formatCurrency } from "@/lib/utils";
import { getAppConfig } from "@/lib/app-config";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Users, Zap, Crown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import SubscriptionActions from "./subscription-actions";

const PLANS = [
  {
    tier: "starter",
    name: "Starter",
    range: "1 a 10 alunos",
    price: "R$ 20,00/mês",
    priceNum: 20,
    icon: Zap,
    features: ["Até 10 alunos", "Agendamento", "Chat com alunos", "Treinos personalizados"],
  },
  {
    tier: "pro",
    name: "Pro",
    range: "11 a 30 alunos",
    price: "R$ 50,00/mês",
    priceNum: 50,
    icon: Users,
    features: ["Até 30 alunos", "Agendamento", "Chat com alunos", "Treinos personalizados", "Portfólio de fotos"],
  },
  {
    tier: "pro_plus",
    name: "Pro+",
    range: "Acima de 30 alunos",
    price: "R$ 50,00 + R$ 1,50 por aluno excedente/mês",
    priceNum: 50,
    icon: Crown,
    features: ["Alunos ilimitados", "Tudo do Pro", "R$ 1,50 por aluno acima de 30", "Suporte prioritário"],
  },
];

export default async function PersonalAssinaturaPage() {
  const session = await getSession();
  const access = await getPersonalAccess(session!.id);
  const pricing = await calculateMonthlyPrice(access.activeStudents);

  const mpToken = await getAppConfig("mp_access_token");
  const hasMPToken = !!mpToken && mpToken.trim().length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Current subscription card */}
      <Card className="border-brand-500/30 bg-brand-500/5">
        <CardTitle>Sua assinatura</CardTitle>
        <div className="mt-4 flex flex-wrap gap-3">
          <Badge variant={access.isTrial ? "info" : access.isReadOnly ? "danger" : "success"}>
            {access.planLabel}
          </Badge>
          <Badge variant="default">
            {access.activeStudents} alunos ativos
          </Badge>
          {access.isCancelled && access.currentPeriodEnd && (
            <Badge variant="warning">
              Cancelada — ativa até {format(access.currentPeriodEnd, "dd/MM/yyyy", { locale: ptBR })}
            </Badge>
          )}
          {!access.isTrial && !access.isReadOnly && !access.isCancelled && (
            <Badge variant="success">Plano ativo</Badge>
          )}
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
        {access.isCancelled && access.currentPeriodEnd && (
          <p className="mt-2 text-sm text-amber-300">
            Sua assinatura foi cancelada. O plano permanece ativo até{" "}
            {format(access.currentPeriodEnd, "dd 'de' MMMM yyyy", { locale: ptBR })}.
          </p>
        )}
        {pricing.tier === "pro_plus" && (
          <p className="mt-2 text-sm text-brand-300">
            Excedente: {pricing.excess} alunos × R$ 1,50
          </p>
        )}

        <SubscriptionActions
          isTrial={access.isTrial}
          isReadOnly={access.isReadOnly}
          isCancelled={access.isCancelled}
          hasMPToken={hasMPToken}
          trialEndsAt={access.trialEndsAt?.toISOString() ?? null}
          currentPeriodEnd={access.currentPeriodEnd?.toISOString() ?? null}
        />
      </Card>

      {/* Plan cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Planos disponíveis</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = access.planTier === plan.tier && !access.isTrial && !access.isReadOnly;
            return (
              <Card
                key={plan.tier}
                className={`relative ${isCurrent ? "border-brand-500 ring-1 ring-brand-500" : ""}`}
              >
                {isCurrent && (
                  <span className="absolute -top-2 right-3 rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">
                    Atual
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-brand-400" />
                  <h3 className="font-semibold text-white">{plan.name}</h3>
                </div>
                <p className="mt-2 text-sm text-slate-400">{plan.range}</p>
                <p className="mt-1 text-lg font-bold text-brand-300">{plan.price}</p>
                <ul className="mt-3 space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="h-3.5 w-3.5 text-brand-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
}
