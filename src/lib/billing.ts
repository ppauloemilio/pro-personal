import { getTrialDays, getPlanPrices } from "./app-config";

export type PlanTier = "starter" | "pro" | "pro_plus";

export async function calculateMonthlyPrice(activeStudents: number) {
  const prices = await getPlanPrices();
  const A = activeStudents;
  const proPlusThreshold = 30;

  if (A <= 10) {
    return { tier: "starter" as PlanTier, label: "Starter", amount: prices.starter, excess: 0 };
  }
  if (A <= proPlusThreshold) {
    return { tier: "pro" as PlanTier, label: "Pro", amount: prices.pro, excess: 0 };
  }
  const E = Math.max(0, A - proPlusThreshold);
  return {
    tier: "pro_plus" as PlanTier,
    label: "Pro+",
    amount: prices.proPlusBase + E * prices.proPlusExcess,
    excess: E,
  };
}

/** Synchronous version for contexts where async is not possible (e.g. seed) */
export function calculateMonthlyPriceSync(
  activeStudents: number,
  prices: { starter: number; pro: number; proPlusBase: number; proPlusExcess: number }
) {
  const A = activeStudents;
  if (A <= 10) {
    return { tier: "starter" as PlanTier, label: "Starter", amount: prices.starter, excess: 0 };
  }
  if (A <= 30) {
    return { tier: "pro" as PlanTier, label: "Pro", amount: prices.pro, excess: 0 };
  }
  const E = Math.max(0, A - 30);
  return {
    tier: "pro_plus" as PlanTier,
    label: "Pro+",
    amount: prices.proPlusBase + E * prices.proPlusExcess,
    excess: E,
  };
}

export async function getTrialEndDate(from = new Date()) {
  const days = await getTrialDays();
  const end = new Date(from);
  end.setDate(end.getDate() + days);
  return end;
}

/** Synchronous version for seed / non-async contexts */
export function getTrialEndDateSync(from = new Date(), days = 7) {
  const end = new Date(from);
  end.setDate(end.getDate() + days);
  return end;
}
