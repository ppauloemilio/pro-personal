"use client";

import { useActionState, useCallback } from "react";
import {
  createMercadoPagoSubscriptionAction,
  cancelMercadoPagoSubscriptionAction,
  activateSubscriptionAction,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, XCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [sandboxMessage, setSandboxMessage] = useState<string | null>(null);
  const router = useRouter();

  const [mpState, mpFormAction, mpPending] = useActionState(
    async (_prev: void) => {
      const result = await createMercadoPagoSubscriptionAction();
      if (result && "error" in result) {
        alert(result.error);
        return;
      }
      if (result && "activatedDirectly" in result && result.activatedDirectly) {
        setSandboxMessage("Assinatura ativada com sucesso! (modo teste)");
        router.refresh();
        return;
      }
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

  // Sandbox activation success banner
  const sandboxBanner = sandboxMessage ? (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-400">
      <CheckCircle className="h-5 w-5 shrink-0" />
      {sandboxMessage}
    </div>
  ) : null;

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
        {sandboxBanner}
        {daysLeft !== null && (
          <p className="text-sm text-slate-400">
            {daysLeft > 0
              ? `Restam ${daysLeft} dia${daysLeft > 1 ? "s" : ""} de trial.`
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
          {sandboxBanner}
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
        {sandboxBanner}
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
