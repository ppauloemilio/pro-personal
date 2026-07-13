import { prisma } from "./prisma";
import { calculateMonthlyPrice } from "./billing";
import type { SessionUser } from "./auth";
import type { SubscriptionStatus } from "@prisma/client";

export type PersonalAccess = {
  canWrite: boolean;
  canApproveBookings: boolean;
  canAddStudents: boolean;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  planLabel: string;
  monthlyAmount: number;
  activeStudents: number;
  isTrial: boolean;
  isReadOnly: boolean;
  isCancelled: boolean;
  currentPeriodEnd: Date | null;
  planTier: string;
};

export async function countActiveStudents(personalUserId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const vinculos = await prisma.vinculo.findMany({
    where: { personalId: personalUserId, status: "ATIVO" },
    include: {
      bookings: {
        where: { status: "CONFIRMADA", startAt: { gte: thirtyDaysAgo } },
        take: 1,
      },
      workouts: {
        where: { updatedAt: { gte: thirtyDaysAgo } },
        take: 1,
      },
    },
  });

  return vinculos.filter(
    (v) => v.bookings.length > 0 || v.workouts.length > 0
  ).length || vinculos.length;
}

export async function syncSubscription(personalUserId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { userId: personalUserId },
  });
  if (!sub) return null;

  const activeStudents = await countActiveStudents(personalUserId);
  const pricing = await calculateMonthlyPrice(activeStudents);
  const now = new Date();
  const trialExpired = sub.status === "TRIAL" && sub.trialEndsAt < now;

  // Cancelled subscription that has expired → move to LEITURA
  const cancelledExpired =
    sub.status === "CANCELADA" && sub.currentPeriodEnd && sub.currentPeriodEnd < now;

  let status = sub.status;
  if (trialExpired && status === "TRIAL") status = "LEITURA";
  if (cancelledExpired) status = "LEITURA";

  await prisma.subscription.update({
    where: { userId: personalUserId },
    data: {
      status,
      activeStudents,
      monthlyAmount: pricing.amount,
      planLabel: status === "TRIAL" ? "Trial" : pricing.label,
    },
  });

  return { ...sub, status, activeStudents, monthlyAmount: pricing.amount };
}

export async function getPersonalAccess(
  userId: string
): Promise<PersonalAccess> {
  const sub = await syncSubscription(userId);
  const now = new Date();

  if (!sub) {
    return {
      canWrite: false,
      canApproveBookings: false,
      canAddStudents: false,
      subscriptionStatus: "LEITURA",
      trialEndsAt: null,
      planLabel: "—",
      monthlyAmount: 0,
      activeStudents: 0,
      isTrial: false,
      isReadOnly: true,
      isCancelled: false,
      currentPeriodEnd: null,
      planTier: "starter",
    };
  }

  const isTrial = sub.status === "TRIAL" && sub.trialEndsAt >= now;
  const isActive = sub.status === "ATIVA";
  const isCancelled = sub.status === "CANCELADA";
  const isReadOnly = sub.status === "LEITURA";

  // Cancelled but still within period → can operate
  const cancelledStillActive =
    isCancelled && !!sub.currentPeriodEnd && sub.currentPeriodEnd >= now;

  const canOperate = isTrial || isActive || cancelledStillActive;

  return {
    canWrite: canOperate,
    canApproveBookings: canOperate,
    canAddStudents: canOperate,
    subscriptionStatus: sub.status,
    trialEndsAt: sub.trialEndsAt,
    planLabel: sub.planLabel,
    monthlyAmount: sub.monthlyAmount,
    activeStudents: sub.activeStudents,
    isTrial,
    isReadOnly,
    isCancelled,
    currentPeriodEnd: sub.currentPeriodEnd,
    planTier: sub.planTier,
  };
}

export async function assertPersonalCanWrite(userId: string) {
  const access = await getPersonalAccess(userId);
  if (!access.canWrite) {
    throw new Error(
      "Sua assinatura está em modo leitura. Ative um plano para continuar."
    );
  }
  return access;
}

export async function assertStudentHasActiveVinculo(userId: string) {
  const count = await prisma.vinculo.count({
    where: { studentId: userId, status: "ATIVO" },
  });
  if (count === 0) throw new Error("VINCULO_REQUIRED");
  return count;
}

export function assertRole(user: SessionUser, roles: SessionUser["role"][]) {
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
}
