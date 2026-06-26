"use client";

import { useActionState, useCallback } from "react";
import {
  createMercadoPagoSubscriptionAction,
  cancelMercadoPagoSubscriptionAction,
  activateSubscriptionAction,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, XCircle } from "lucide-react";

type SubscriptionActionsProps = {
  isTrial: boolean;
  isReadOnly: boolean;
  hasMPToken: boolean;
  trialEndsAt: string | null;
};

export default function SubscriptionActions({
  isTrial,
  isReadOnly,
  hasMPToken,
  trialEndsAt,
}: SubscriptionActionsProps) {
  const isActive = !isTrial && !isReadOnly;
  const [mpState, mpFormAction, mpPending] = useActionState(
    async (_prev: void) => {
      const result = await createMercadoPagoSubscriptionAction();
      if (result && "checkoutUrl" in result && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    },
    undefined
  );

  const [cancelState, cancelFormAction, cancelPending] = useActionState(
    async (_prev: void) => {
      await cancelMercadoPagoSubscriptionAction();
    },
    undefined
  );

  // Trial + MP token → show "Assinar agora"
  if (isTrial) {
    const daysLeft = trialEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(trialEndsAt).getTime() - Date.now()) / 86400000
          )
        )
      : null;

    return (
      <div className="mt-6 space-y-3">
        {daysLeft !== null && (
          <p className="text-sm text-slate-400">
            {daysLeft > 0
              ? `Restam ${daysLeft} dia${daysLeft > 1 ? "s" : "" de trial.`
              : "Seu trial expirou."}
          </p>
        )}

        {hasMPToken ? (
          <form action={mpFormAction}>
            <Button type="submit" disabled={mpPending} className="w-full sm:w-auto">
              {mpPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {mpPending ? "Processando..." : "Assinar agora"}
            </Button>
          </form>
        ) : (
          <form action={async () => { await activateSubscriptionAction(); }}>
            <Button type="submit" className="w-full sm:w-auto">
              Ativar plano (simulação)
            </Button>
            <p className="mt-2 text-xs text-slate-500">
              Integração de pagamento em breve. Use para testar modo ativo.
            </p>
          </form>
        )}
      </div>
    );
  }

  // Read-only → show "Assinar"
  if (isReadOnly) {
    if (hasMPToken) {
      return (
        <div className="mt-6">
          <form action={mpFormAction}>
            <Button type="submit" disabled={mpPending} className="w-full sm:w-auto">
              {mpPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {mpPending ? "Processando..." : "Assinar plano"}
            </Button>
          </form>
        </div>
      );
    }

    return (
      <div className="mt-6">
        <form action={async () => { await activateSubscriptionAction(); }}>
          <Button type="submit" className="w-full sm:w-auto">
            Ativar plano (simulação)
          </Button>
          <p className="mt-2 text-xs text-slate-500">
            Integração de pagamento em breve. Use para testar modo ativo.
          </p>
        </form>
      </div>
    );
  }

  // Active → show "Cancelar assinatura"
  if (isActive) {
    return (
      <div className="mt-6">
        <form action={cancelFormAction}>
          <Button
            type="submit"
            variant="danger"
            disabled={cancelPending}
            className="w-full sm:w-auto"
          >
            {cancelPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {cancelPending ? "Cancelando..." : "Cancelar assinatura"}
          </Button>
        </form>
      </div>
    );
  }

  return null;
}
