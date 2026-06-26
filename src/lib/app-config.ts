import { prisma } from "./prisma";

export async function getAppConfig(key: string): Promise<string | null> {
  const config = await prisma.appConfig.findUnique({ where: { key } });
  return config?.value ?? null;
}

export async function setAppConfig(key: string, value: string): Promise<void> {
  await prisma.appConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getMercadoPagoAccessToken(): Promise<string | null> {
  const token = await getAppConfig("mp_access_token");
  if (!token) return null;
  return token;
}

export async function isSandboxMode(): Promise<boolean> {
  const val = await getAppConfig("mp_sandbox_mode");
  return val !== "false";
}

export async function getTrialDays(): Promise<number> {
  const val = await getAppConfig("trial_days");
  const n = parseInt(val || "", 10);
  return isNaN(n) || n <= 0 ? 7 : n;
}

export async function getPlanPrices(): Promise<{
  starter: number;
  pro: number;
  proPlusBase: number;
  proPlusExcess: number;
}> {
  const [starter, pro, proPlusBase, proPlusExcess] = await Promise.all([
    getAppConfig("plan_starter_price"),
    getAppConfig("plan_pro_price"),
    getAppConfig("plan_pro_plus_base"),
    getAppConfig("plan_pro_plus_excess"),
  ]);

  return {
    starter: parseFloat(starter || "") || 20,
    pro: parseFloat(pro || "") || 50,
    proPlusBase: parseFloat(proPlusBase || "") || 50,
    proPlusExcess: parseFloat(proPlusExcess || "") || 1.5,
  };
}
