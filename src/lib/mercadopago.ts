import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from "mercadopago";
import { getAppConfig, getPlanPrices } from "./app-config";
import { prisma } from "./prisma";

const BACK_URL = "https://to-ligado-personal.m6tens.easypanel.host/personal/assinatura";

/** Create a configured MercadoPago client from the stored access token */
async function getMPClient(): Promise<MercadoPagoConfig> {
  const token = await getAppConfig("mp_access_token");
  if (!token || token.trim().length === 0) {
    throw new Error("Mercado Pago access token não configurado. Peça ao admin para configurar em Configurações.");
  }
  return new MercadoPagoConfig({ accessToken: token });
}

/** Check if running in sandbox mode (TEST- token) */
async function isSandbox(): Promise<boolean> {
  const token = await getAppConfig("mp_access_token");
  return token?.startsWith("TEST-") ?? false;
}

/** Create a preapproval plan (recurring subscription plan) */
export async function createPreapprovalPlan(
  tier: string,
  price: number,
  client: MercadoPagoConfig
): Promise<{ id: string; init_point: string; sandbox_init_point: string }> {
  const planClient = new PreApprovalPlan(client);
  const result = await planClient.create({
    body: {
      reason: `Pro-Personal - Plano ${tier}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: price,
        currency_id: "BRL",
      },
      back_url: BACK_URL,
      payment_methods_allowed: {
        payment_types: [
          { id: "credit_card" },
          { id: "debit_card" },
        ],
      },
    },
  });
  return result as unknown as { id: string; init_point: string; sandbox_init_point: string };
}

/** Subscribe a personal to a preapproval plan */
export async function createPreapproval(
  planId: string,
  payerEmail: string,
  client: MercadoPagoConfig
): Promise<{ id: string; init_point: string; sandbox_init_point: string; status: string }> {
  const subClient = new PreApproval(client);
  const result = await subClient.create({
    body: {
      preapproval_plan_id: planId,
      payer_email: payerEmail,
      back_url: BACK_URL,
      status: "pending",
    },
  });
  return result as unknown as { id: string; init_point: string; sandbox_init_point: string; status: string };
}

/** Cancel a preapproval subscription */
export async function cancelPreapproval(
  subscriptionId: string,
  client: MercadoPagoConfig
): Promise<void> {
  const subClient = new PreApproval(client);
  await subClient.update({
    id: subscriptionId,
    body: { status: "cancelled" },
  });
}

/** Get preapproval details */
export async function getPreapproval(
  subscriptionId: string,
  client: MercadoPagoConfig
): Promise<{ id: string; status: string; preapproval_plan_id: string }> {
  const subClient = new PreApproval(client);
  const result = await subClient.get({ id: subscriptionId });
  return result as unknown as { id: string; status: string; preapproval_plan_id: string };
}

/** Full flow: create plan + subscribe, returns checkout URL or direct activation for sandbox */
export async function createSubscriptionForPersonal(
  userId: string,
  tier: string
): Promise<{ checkoutUrl: string; planId: string; subscriptionId: string; activatedDirectly?: boolean }> {
  const client = await getMPClient();
  const sandbox = await isSandbox();

  // Get personal info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true, personalProfile: true },
  });
  if (!user) throw new Error("Usuário não encontrado.");

  const prices = await getPlanPrices();

  let tierLabel: string;
  let price: number;
  if (tier === "starter") {
    tierLabel = "Starter";
    price = prices.starter;
  } else if (tier === "pro") {
    tierLabel = "Pro";
    price = prices.pro;
  } else {
    tierLabel = "Pro+";
    const activeStudents = user.subscription?.activeStudents ?? 0;
    const excess = Math.max(0, activeStudents - 30);
    price = prices.proPlusBase + excess * prices.proPlusExcess;
  }

  // 1. Create preapproval plan
  const plan = await createPreapprovalPlan(tierLabel, price, client);

  // 2. Subscribe the personal
  const preapproval = await createPreapproval(plan.id, user.email, client);

  // 3. Calculate currentPeriodEnd (1 month from now)
  const currentPeriodEnd = new Date();
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

  // 4. Save plan ID, subscription ID and tier on the Subscription record
  await prisma.subscription.update({
    where: { userId },
    data: {
      mpPlanId: plan.id,
      mpSubscriptionId: preapproval.id,
      planTier: tier,
      currentPeriodEnd,
    },
  });

  // Return the appropriate checkout URL
  const checkoutUrl = sandbox
    ? (preapproval.sandbox_init_point || preapproval.init_point || "")
    : (preapproval.init_point || preapproval.sandbox_init_point || "");

  // Sandbox fallback: MP sandbox preapproval doesn't always generate a checkout URL.
  // Activate the subscription directly in the DB so testing still works.
  if (sandbox && !checkoutUrl) {
    console.log("[MP Sandbox] No checkout URL returned. Activating subscription directly.");
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: "ATIVA",
        activatedAt: new Date(),
        planTier: tier,
        currentPeriodEnd,
      },
    });
    return {
      checkoutUrl: "",
      planId: plan.id,
      subscriptionId: preapproval.id,
      activatedDirectly: true,
    };
  }

  if (!checkoutUrl) {
    throw new Error("Mercado Pago não retornou URL de checkout. Verifique as credenciais e o modo sandbox.");
  }

  return {
    checkoutUrl,
    planId: plan.id,
    subscriptionId: preapproval.id,
  };
}

/** Cancel a personal's subscription in MP only (DB update done in actions) */
export async function cancelSubscriptionInMP(
  mpSubscriptionId: string
): Promise<void> {
  const client = await getMPClient();
  await cancelPreapproval(mpSubscriptionId, client);
}

/** Legacy: cancel subscription for personal (MP + DB) */
export async function cancelSubscriptionForPersonal(
  userId: string
): Promise<void> {
  const client = await getMPClient();

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.mpSubscriptionId) {
    throw new Error("Nenhuma assinatura ativa no Mercado Pago.");
  }

  await cancelPreapproval(sub.mpSubscriptionId, client);

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: "CANCELADA",
      cancelledAt: new Date(),
      mpSubscriptionId: null,
      mpPlanId: null,
    },
  });
}

/** Process webhook notification from Mercado Pago */
export async function processWebhookNotification(
  topic: string | null,
  id: string | null
): Promise<void> {
  if (!id) return;

  let client: MercadoPagoConfig;
  try {
    client = await getMPClient();
  } catch {
    console.error("[MP Webhook] No access token configured");
    return;
  }

  if (topic === "preapproval" || topic === "preapproval_plan") {
    try {
      const preapproval = await getPreapproval(id, client);
      const mpSubscriptionId = preapproval.id;

      // Find subscription by mpSubscriptionId
      const sub = await prisma.subscription.findFirst({
        where: { mpSubscriptionId },
      });

      if (!sub) {
        console.warn(`[MP Webhook] No subscription found for mpSubscriptionId=${mpSubscriptionId}`);
        return;
      }

      const status = preapproval.status;

      if (status === "authorized" || status === "active") {
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: "ATIVA",
            activatedAt: new Date(),
            currentPeriodEnd,
          },
        });
        console.log(`[MP Webhook] Activated subscription for user ${sub.userId}`);
      } else if (status === "cancelled" || status === "paused" || status === "ended") {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: "CANCELADA",
            cancelledAt: new Date(),
          },
        });
        console.log(`[MP Webhook] Cancelled subscription for user ${sub.userId}`);
      }
    } catch (err) {
      console.error("[MP Webhook] Error processing preapproval:", err);
    }
  }
}
