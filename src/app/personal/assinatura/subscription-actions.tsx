"use client";

import { useState, useTransition } from "react";
import {
  createMercadoPagoSubscriptionAction,
  cancelMercadoPagoSubscriptionAction,
  activateSubscriptionAction,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, XCircle, Users, Crown, Zap, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PLANS = [
  {
    tier: "starter",
    name: "Starter",
    range: "1 a 10 alunos",
    price: "R$ 20,00/mês",
    icon: Zap,
  },
  {
    tier: "pro",
    name: "Pro",
    range: "11 a 30 alunos",
    price: "R$ 50,00/mês",
    icon: Users,
  },
  {
    tier: "pro_plus",
    name: "Pro+",
    range: "Acima de 30 alunos",
    price: "R$ 50,00 + R$ 1,50/excedente",
    icon: Crown,
  },
];

type SubscriptionActionsProps = {
  isTrial: boolean;
  isReadOnly: boolean;
  isCancelled: boolean;
  hasMPToken: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
};

export default function SubscriptionActions({
  isTrial,
  isReadOnly,
  isCancelled,
  hasMPToken,
  trialEndsAt,
  currentPeriodEnd,
}: SubscriptionActionsProps) {
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isActive = !isTrial && !isReadOnly && !isCancelled;
  const cancelledStillActive = isCancelled && currentPeriodEnd && new Date(currentPeriodEnd) >= new Date();

  function handleSubscribe(tier: string) {
    setError(null);
    setSelectedTier(tier);
    startTransition(async () => {
      try {
        if (hasMPToken) {
          const result = await createMercadoPagoSubscriptionAction(tier);
          if ("error" in result) {
            setError(result.error);
          } else if (result.checkoutUrl) {
            window.location.href = result.checkoutUrl;
          }
        } else {
          await activateSubscriptionAction(tier);
          setShowPlanPicker(false);
        }
      } catch {
        setError("Erro ao processar assinatura.");
      }
    });
  }

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await cancelMercadoPagoSubscriptionAction();
        if ("error" in result) {
          setError(result.error);
        } else {
          setShowCancelConfirm(false);
        }
      } catch {
        setError("Erro ao cancelar assinatura.");
      }
    });
  }

  // === PLAN PICKER MODAL ===
  if (showPlanPicker) {
    return (
      <div className="mt-6 rounded-2xl border border-brand-500/30 bg-surface-elevated p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Escolha seu plano</h3>
        <div className="space-y-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isLoading = isPending && selectedTier === plan.tier;
            return (
              <button
                key={plan.tier}
                onClick={() => handleSubscribe(plan.tier)}
                disabled={isPending}
                className="flex w-full items-center gap-4 rounded-xl border border-surface-border bg-surface-base p-4 text-left transition-colors hover:border-brand-500 hover:bg-brand-500/5 disabled:opacity-50"
              >
                <Icon className="h-8 w-8 text-brand-400" />
                <div className="flex-1">
                  <p className="font-semibold text-white">{plan.name}</p>
                  <p className="text-sm text-slate-400">{plan.range}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-300">{plan.price}</p>
                </div>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-brand-400" />
                )}
              </button>
            );
          })}
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!hasMPToken && (
          <p className="text-xs text-slate-500">
            Integração de pagamento em breve. Use para testar modo ativo.
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPlanPicker(false)}
          disabled={isPending}
        >
          Voltar
        </Button>
      </div>
    );
  }

  // === CANCEL CONFIRM MODAL ===
  if (showCancelConfirm) {
    const endDate = currentPeriodEnd
      ? format(new Date(currentPeriodEnd), "dd/MM/yyyy", { locale: ptBR })
      : "o fim do período";
    return (
      <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Cancelar assinatura?</h3>
        <p className="text-sm text-slate-300">
          Seu plano permanecerá ativo até <strong className="text-white">{endDate}</strong>.
          Após essa data, sua conta entrará em modo leitura.
        </p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="danger"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {isPending ? "Cancelando..." : "Sim, cancelar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowCancelConfirm(false)}
            disabled={isPending}
          >
            Manter assinatura
          </Button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  // === TRIAL STATE ===
  if (isTrial) {
    const daysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
      : null;

    return (
      <div className="mt-6 space-y-3">
        {daysLeft !== null && (
          <p className="text-sm text-slate-400">
            {daysLeft > 0
              ? `Restam ${daysLeft} dia${daysLeft > 1 ? "s" : ""} de trial.`
              : "Seu trial expirou."}
          </p>
        )}
        <Button onClick={() => setShowPlanPicker(true)} className="w-full sm:w-auto">
          <CreditCard className="h-4 w-4" />
          Assinar plano
        </Button>
      </div>
    );
  }

  // === READ-ONLY STATE ===
  if (isReadOnly) {
    return (
      <div className="mt-6">
        <Button onClick={() => setShowPlanPicker(true)} className="w-full sm:w-auto">
          <CreditCard className="h-4 w-4" />
          Assinar plano
        </Button>
      </div>
    );
  }

  // === ACTIVE STATE ===
  if (isActive) {
    return (
      <div className="mt-6">
        <Button
          variant="danger"
          onClick={() => setShowCancelConfirm(true)}
          className="w-full sm:w-auto"
        >
          <XCircle className="h-4 w-4" />
          Cancelar assinatura
        </Button>
      </div>
    );
  }

  // === CANCELLED BUT STILL ACTIVE ===
  if (cancelledStillActive) {
    return (
      <div className="mt-6">
        <p className="text-sm text-amber-300">
          Assinatura cancelada. Plano ativo até{" "}
          {currentPeriodEnd
            ? format(new Date(currentPeriodEnd), "dd/MM/yyyy", { locale: ptBR })
            : "o fim do período"}
          .
        </p>
      </div>
    );
  }

  return null;
}
