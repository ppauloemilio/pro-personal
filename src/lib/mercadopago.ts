import { getMercadoPagoAccessToken, isSandboxMode, getPlanPrices } from "./app-config";
import { prisma } from "./prisma";

const MP_BASE_URL = "https://api.mercadopago.com";
const BACK_URL = "https://to-ligado-personal.m6tens.easypanel.host/personal/assinatura";

export type MPPreapprovalPlanResponse = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

export type MPPreapprovalResponse = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
  status: string;
  preapproval_plan_id: string;
};

async function mpFetch(path: string, options: RequestInit & { token: string }) {
  const { token, ...rest } = options;
  const res = await fetch(`${MP_BASE_URL}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...rest.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[MercadoPago API Error] ${res.status} ${path}: ${body}`);
    throw new Error(`MercadoPago API error: ${res.status} - ${body}`);
  }

  return res.json();
}

/** Create a preapproval plan (recurring subscription plan) */
export async function createPreapprovalPlan(
  tier: string,
  price: number,
  token: string
): Promise<MPPreapprovalPlanResponse> {
  const body = {
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
        { id: "pix" },
      ],
    },
  };

  return mpFetch("/preapproval_plan", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

/** Subscribe a personal to a preapproval plan */
export async function createPreapproval(
  planId: string,
  payerEmail: string,
  token: string
): Promise<MPPreapprovalResponse> {
  const body = {
    preapproval_plan_id: planId,
    payer_email: payerEmail,
    back_url: BACK_URL,
    status: "pending",
  };

  return mpFetch("/preapproval", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

/** Cancel a preapproval subscription */
export async function cancelPreapproval(
  subscriptionId: string,
  token: string
): Promise<void> {
  await mpFetch(`/preapproval/${subscriptionId}`, {
    method: "PUT",
    token,
    body: JSON.stringify({ status: "cancelled" }),
  });
}

/** Get preapproval details */
export async function getPreapproval(
  subscriptionId: string,
  token: string
): Promise<MPPreapprovalResponse> {
  return mpFetch(`/preapproval/${subscriptionId}`, {
    method: "GET",
    token,
  });
}

/** Full flow: create plan + subscribe, returns checkout URL or direct activation for sandbox */
export async function createSubscriptionForPersonal(
  userId: string
): Promise<{ checkoutUrl: string; planId: string; subscriptionId: string; activatedDirectly?: boolean }> {
  const token = await getMercadoPagoAccessToken();
  if (!token) throw new Error("Mercado Pago access token não configurado.");

  const sandbox = await isSandboxMode();

  // Get personal info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true, personalProfile: true },
  });
  if (!user) throw new Error("Usuário não encontrado.");

  // Determine price based on active students
  const sub = user.subscription;
  const activeStudents = sub?.activeStudents ?? 0;
  const prices = await getPlanPrices();

  let tier: string;
  let price: number;
  if (activeStudents <= 10) {
    tier = "Starter";
    price = prices.starter;
  } else if (activeStudents <= 30) {
    tier = "Pro";
    price = prices.pro;
  } else {
    tier = "Pro+";
    const excess = activeStudents - 30;
    price = prices.proPlusBase + excess * prices.proPlusExcess;
  }

  // 1. Create preapproval plan
  const plan = await createPreapprovalPlan(tier, price, token);

  // 2. Subscribe the personal
  const preapproval = await createPreapproval(plan.id, user.email, token);

  // 3. Save plan ID and subscription ID on the Subscription record
  await prisma.subscription.update({
    where: { userId },
    data: {
      mpPlanId: plan.id,
      mpSubscriptionId: preapproval.id,
    },
  });

  // Return the appropriate checkout URL
  const checkoutUrl = sandbox
    ? (preapproval.sandbox_init_point || preapproval.init_point || "")
    : (preapproval.init_point || preapproval.sandbox_init_point || "");

  // Sandbox fallback: MP sandbox preapproval doesn't generate a checkout URL.
  // Activate the subscription directly in the DB so testing still works.
  if (sandbox && !checkoutUrl) {
    console.log("[MP Sandbox] No checkout URL returned. Activating subscription directly.");
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: "ATIVA",
        activatedAt: new Date(),
      },
    });
    return {
      checkoutUrl: "",
      planId: plan.id,
      subscriptionId: preapproval.id,
      activatedDirectly: true,
    };
  }

  return {
    checkoutUrl,
    planId: plan.id,
    subscriptionId: preapproval.id,
  };
}

/** Cancel a personal's subscription in MP and update DB */
export async function cancelSubscriptionForPersonal(
  userId: string
): Promise<void> {
  const token = await getMercadoPagoAccessToken();
  if (!token) throw new Error("Mercado Pago access token não configurado.");

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.mpSubscriptionId) {
    throw new Error("Nenhuma assinatura ativa no Mercado Pago.");
  }

  await cancelPreapproval(sub.mpSubscriptionId, token);

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: "LEITURA",
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

  const token = await getMercadoPagoAccessToken();
  if (!token) {
    console.error("[MP Webhook] No access token configured");
    return;
  }

  if (topic === "preapproval" || topic === "preapproval_plan") {
    try {
      const preapproval = await getPreapproval(id, token);
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
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: "ATIVA",
            activatedAt: new Date(),
          },
        });
        console.log(`[MP Webhook] Activated subscription for user ${sub.userId}`);
      } else if (status === "cancelled" || status === "paused" || status === "ended") {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: "LEITURA",
          },
        });
        console.log(`[MP Webhook] Set subscription to read-only for user ${sub.userId}`);
      }
    } catch (err) {
      console.error("[MP Webhook] Error processing preapproval:", err);
    }
  }
}
