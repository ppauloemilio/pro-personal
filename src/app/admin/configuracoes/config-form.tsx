"use client";

import { useActionState, useRef, useState } from "react";
import { saveAppConfigFormAction } from "@/lib/actions";
import { Eye, EyeOff, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfigData = {
  mpAccessToken: string;
  mpSandboxMode: boolean;
  trialDays: string;
  planStarterPrice: string;
  planProPrice: string;
  planProPlusBase: string;
  planProPlusExcess: string;
};

export default function AdminConfigForm({ config }: { config: ConfigData }) {
  const [showToken, setShowToken] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [_state, formAction, isPending] = useActionState(
    async (_prev: void) => {
      await saveAppConfigFormAction(new FormData(formRef.current!));
    },
    undefined
  );

  return (
    <form ref={formRef} action={formAction} className="mt-6 space-y-6">
      {/* Mercado Pago Access Token */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          Access Token do Mercado Pago
        </label>
        <div className="relative">
          <input
            type={showToken ? "text" : "password"}
            name="mp_access_token"
            defaultValue={config.mpAccessToken}
            placeholder="APP_USR-xxxx ou TEST-xxxx"
            className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2.5 pr-12 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Encontre em: Mercado Pago → Credenciais → Access Token
        </p>
      </div>

      {/* Sandbox Mode Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-elevated px-4 py-3">
        <div>
          <p className="text-sm font-medium text-white">Modo Sandbox</p>
          <p className="text-xs text-slate-500">
            Use credenciais de teste durante o desenvolvimento
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            name="mp_sandbox_mode"
            defaultChecked={config.mpSandboxMode}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-slate-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-full" />
        </label>
      </div>

      {/* Trial Days */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          Dias Grátis (Trial)
        </label>
        <input
          type="number"
          name="trial_days"
          defaultValue={config.trialDays}
          min={1}
          max={365}
          className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Plan Prices */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-slate-300">Valores dos Planos</h4>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Starter (R$/mês)</label>
            <input
              type="number"
              name="plan_starter_price"
              defaultValue={config.planStarterPrice}
              min={0}
              step="0.01"
              className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Pro (R$/mês)</label>
            <input
              type="number"
              name="plan_pro_price"
              defaultValue={config.planProPrice}
              min={0}
              step="0.01"
              className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Pro+ Base (R$/mês)</label>
            <input
              type="number"
              name="plan_pro_plus_base"
              defaultValue={config.planProPlusBase}
              min={0}
              step="0.01"
              className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Pro+ Excedente/aluno (R$)</label>
            <input
              type="number"
              name="plan_pro_plus_excess"
              defaultValue={config.planProPlusExcess}
              min={0}
              step="0.01"
              className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </form>
  );
}
