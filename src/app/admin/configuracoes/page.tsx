import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { getAppConfigAction, saveAppConfigFormAction } from "@/lib/actions";
import AdminConfigForm from "./config-form";

export default async function AdminConfiguracoesPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const [
    mpAccessToken,
    mpSandboxMode,
    trialDays,
    planStarterPrice,
    planProPrice,
    planProPlusBase,
    planProPlusExcess,
  ] = await Promise.all([
    getAppConfigAction("mp_access_token"),
    getAppConfigAction("mp_sandbox_mode"),
    getAppConfigAction("trial_days"),
    getAppConfigAction("plan_starter_price"),
    getAppConfigAction("plan_pro_price"),
    getAppConfigAction("plan_pro_plus_base"),
    getAppConfigAction("plan_pro_plus_excess"),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardTitle>Configurações do Sistema</CardTitle>
        <p className="mt-2 text-sm text-slate-400">
          Gerencie as configurações gerais, integrações e valores dos planos.
        </p>

        <AdminConfigForm
          config={{
            mpAccessToken: mpAccessToken || "",
            mpSandboxMode: mpSandboxMode !== "false",
            trialDays: trialDays || "7",
            planStarterPrice: planStarterPrice || "20",
            planProPrice: planProPrice || "50",
            planProPlusBase: planProPlusBase || "50",
            planProPlusExcess: planProPlusExcess || "1.5",
          }}
        />
      </Card>
    </div>
  );
}
