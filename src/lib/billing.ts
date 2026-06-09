export type PlanTier = "starter" | "pro" | "pro_plus";

export function calculateMonthlyPrice(activeStudents: number): {
  tier: PlanTier;
  label: string;
  amount: number;
  excess: number;
} {
  const A = activeStudents;
  const E = Math.max(0, A - 30);

  if (A <= 10) {
    return { tier: "starter", label: "Starter", amount: 20, excess: 0 };
  }
  if (A <= 30) {
    return { tier: "pro", label: "Pro", amount: 50, excess: 0 };
  }
  return {
    tier: "pro_plus",
    label: "Pro+",
    amount: 50 + E * 1.5,
    excess: E,
  };
}

export function getTrialEndDate(from = new Date()) {
  const end = new Date(from);
  end.setDate(end.getDate() + 30);
  return end;
}
