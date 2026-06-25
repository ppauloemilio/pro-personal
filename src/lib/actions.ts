"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  verifyPassword,
  roleHomePath,
} from "./auth";
import { getTrialEndDate } from "./billing";
import { getPersonalAccess, assertPersonalCanWrite } from "./permissions";
import {
  notify,
  notifyVinculo,
  sendVinculoChatMessage,
} from "./notifications";
import { slugify, generateInviteCode } from "./utils";
import { canCancelWithNotice, canStudentRequestCancellation } from "./slots";
import { format } from "date-fns";
import type { UserRole } from "@prisma/client";

function revalidateAll() {
  revalidatePath("/", "layout");
}

function bookingDateLink(startAt: Date, role: "personal" | "aluno") {
  const date = format(startAt, "yyyy-MM-dd");
  return role === "personal"
    ? `/personal/agenda?date=${date}`
    : `/aluno/aulas?date=${date}`;
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "ALUNO") as UserRole;

  if (!email || !password || !name) {
    const roleParam = role === "ADMIN" ? "?role=ADMIN&" : "?";
    redirect(`/register${roleParam}error=missing`);
  }

  // Only allow ADMIN role if no admin exists yet (first-admin safety)
  if (role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount > 0) {
      redirect("/register?role=ADMIN&error=admin_exists");
    }
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    const roleParam = role === "ADMIN" ? "?role=ADMIN&" : "?";
    redirect(`/register${roleParam}error=exists`);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
      ...(role === "ADMIN"
        ? {}
        : role === "PERSONAL"
          ? {
              personalProfile: {
                create: {
                  publicSlug: slugify(name) + "-" + Date.now().toString(36),
                  inviteCode: generateInviteCode(),
                  isPublic: true,
                },
              },
              subscription: {
                create: {
                  status: "TRIAL",
                  trialEndsAt: getTrialEndDate(),
                  planLabel: "Trial",
                },
              },
            }
          : { studentProfile: { create: {} } }),
    },
  });

  if (role === "PERSONAL") {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (admin) {
      let conv = await prisma.conversation.findFirst({
        where: { type: "ADMIN_PERSONAL", personalId: user.id },
      });
      if (!conv) {
        conv = await prisma.conversation.create({
          data: { type: "ADMIN_PERSONAL", personalId: user.id },
        });
      }
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: admin.id,
          content:
            "Bem-vindo ao Pro-Personal! Estamos à disposição para ajudar.",
        },
      });
    }
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  redirect(roleHomePath(user.role));
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "ATIVO") {
    redirect("/login?error=invalid");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) redirect("/login?error=invalid");

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  redirect(roleHomePath(user.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function acceptVinculoAction(vinculoId: string) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  const vinculo = await prisma.vinculo.findUnique({ where: { id: vinculoId } });
  if (!vinculo) return { error: "Vínculo não encontrado." };

  if (session.role === "PERSONAL" && vinculo.personalId === session.id) {
    await assertPersonalCanWrite(session.id);
    await prisma.vinculo.update({
      where: { id: vinculoId },
      data: { status: "ATIVO" },
    });
    let conv = await prisma.conversation.findUnique({
      where: { vinculoId },
    });
    if (!conv) {
      conv = await prisma.conversation.create({
        data: { type: "VINCULO", vinculoId },
      });
    }
    await notifyVinculo(
      vinculo.studentId,
      vinculoId,
      "VINCULO_ACCEPTED",
      "Vínculo aceito",
      "Seu personal aceitou sua solicitação.",
      "/aluno"
    );
  } else if (session.role === "ALUNO" && vinculo.studentId === session.id) {
    await prisma.vinculo.update({
      where: { id: vinculoId },
      data: { status: "ATIVO" },
    });
    await notifyVinculo(
      vinculo.personalId,
      vinculoId,
      "VINCULO_ACCEPTED",
      "Convite aceito",
      "Um aluno aceitou seu convite.",
      "/personal/alunos"
    );
  } else {
    return { error: "Sem permissão." };
  }

  revalidateAll();
  return { success: true };
}

export async function rejectVinculoAction(vinculoId: string) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  const vinculo = await prisma.vinculo.findUnique({ where: { id: vinculoId } });
  if (!vinculo) return { error: "Vínculo não encontrado." };

  await prisma.vinculo.update({
    where: { id: vinculoId },
    data: { status: "ENCERRADO" },
  });

  revalidateAll();
  return { success: true };
}

export async function requestVinculoByInviteAction(inviteCode: string) {
  const session = await getSession();
  if (!session || session.role !== "ALUNO") throw new Error("FORBIDDEN");

  const profile = await prisma.personalProfile.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
  });
  if (!profile) return { error: "Código de convite inválido." };

  const existing = await prisma.vinculo.findUnique({
    where: {
      personalId_studentId: {
        personalId: profile.userId,
        studentId: session.id,
      },
    },
  });
  if (existing?.status === "ATIVO") return { error: "Você já está vinculado." };

  const vinculo = await prisma.vinculo.upsert({
    where: {
      personalId_studentId: {
        personalId: profile.userId,
        studentId: session.id,
      },
    },
    create: {
      personalId: profile.userId,
      studentId: session.id,
      status: "PENDENTE",
      origem: "CONVITE",
    },
    update: { status: "PENDENTE", origem: "CONVITE" },
  });

  await notifyVinculo(
    profile.userId,
    vinculo.id,
    "VINCULO_REQUEST",
    "Nova solicitação de vínculo",
    "Um aluno solicitou vínculo via convite.",
    "/personal/alunos"
  );

  revalidateAll();
  return { success: true, vinculoId: vinculo.id };
}

export async function requestVinculoDiscoveryAction(personalUserId: string) {
  const session = await getSession();
  if (!session || session.role !== "ALUNO") throw new Error("FORBIDDEN");

  const vinculo = await prisma.vinculo.upsert({
    where: {
      personalId_studentId: { personalId: personalUserId, studentId: session.id },
    },
    create: {
      personalId: personalUserId,
      studentId: session.id,
      status: "PENDENTE",
      origem: "DESCOBERTA",
    },
    update: { status: "PENDENTE", origem: "DESCOBERTA" },
  });

  await notifyVinculo(
    personalUserId,
    vinculo.id,
    "VINCULO_REQUEST",
    "Solicitação via descoberta",
    "Um aluno quer treinar com você.",
    "/personal/alunos"
  );

  revalidateAll();
  return { success: true, vinculoId: vinculo.id };
}

export async function setActiveVinculoAction(vinculoId: string) {
  const session = await getSession();
  if (!session || session.role !== "ALUNO") throw new Error("FORBIDDEN");

  await prisma.studentProfile.update({
    where: { userId: session.id },
    data: { activeVinculoId: vinculoId },
  });

  revalidatePath("/aluno");
  return { success: true };
}

export async function createBookingAction(
  vinculoId: string,
  slot: {
    startAt: string;
    endAt: string;
    locationId: string;
    locationName: string;
    locationAddress: string;
    locationMapUrl?: string;
  }
) {
  const session = await getSession();
  if (!session || session.role !== "ALUNO") throw new Error("FORBIDDEN");

  const vinculo = await prisma.vinculo.findFirst({
    where: { id: vinculoId, studentId: session.id, status: "ATIVO" },
  });
  if (!vinculo) return { error: "Vínculo inválido." };

  const booking = await prisma.booking.create({
    data: {
      vinculoId,
      locationId: slot.locationId,
      startAt: new Date(slot.startAt),
      endAt: new Date(slot.endAt),
      status: "PENDENTE",
      locationName: slot.locationName,
      locationAddress: slot.locationAddress,
      locationMapUrl: slot.locationMapUrl || null,
    },
  });

  await notifyVinculo(
    vinculo.personalId,
    vinculoId,
    "BOOKING_REQUEST",
    "Novo pedido de agendamento",
    `Solicitação para ${slot.locationName} em ${format(booking.startAt, "dd/MM 'às' HH:mm")}.`,
    bookingDateLink(booking.startAt, "personal")
  );

  revalidateAll();
  return { success: true, bookingId: booking.id };
}

export async function approveBookingAction(bookingId: string) {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vinculo: true },
  });
  if (!booking || booking.vinculo.personalId !== session.id) {
    return { error: "Agendamento não encontrado." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMADA" },
  });

  await notifyVinculo(
    booking.vinculo.studentId,
    booking.vinculoId,
    "BOOKING_APPROVED",
    "Aula confirmada",
    "Seu personal aprovou o agendamento.",
    bookingDateLink(booking.startAt, "aluno")
  );

  revalidateAll();
  return { success: true };
}

export async function rejectBookingAction(bookingId: string) {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vinculo: true },
  });
  if (!booking || booking.vinculo.personalId !== session.id) {
    return { error: "Agendamento não encontrado." };
  }
  if (booking.status !== "PENDENTE") {
    return { error: "Este pedido já foi processado." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "RECUSADA" },
  });

  const dateLabel = format(booking.startAt, "dd/MM/yyyy");
  const startLabel = format(booking.startAt, "HH:mm");
  const endLabel = format(booking.endAt, "HH:mm");

  const chatMessage =
    `Sua solicitação de agendamento foi recusada.\n\n` +
    `Data: ${dateLabel}\n` +
    `Horário: ${startLabel} às ${endLabel}\n` +
    `Local: ${booking.locationName}`;

  await sendVinculoChatMessage(booking.vinculoId, session.id, chatMessage);

  await notifyVinculo(
    booking.vinculo.studentId,
    booking.vinculoId,
    "BOOKING_REJECTED",
    "Pedido recusado",
    `Solicitação de ${dateLabel} às ${startLabel} (${booking.locationName}) foi recusada.`,
    bookingDateLink(booking.startAt, "aluno")
  );

  revalidateAll();
  return { success: true };
}

export async function cancelBookingAction(bookingId: string, reason?: string) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vinculo: true },
  });
  if (!booking) return { error: "Não encontrado." };

  const isPersonal =
    session.role === "PERSONAL" && booking.vinculo.personalId === session.id;
  const isStudent =
    session.role === "ALUNO" && booking.vinculo.studentId === session.id;

  if (!isPersonal && !isStudent) return { error: "Sem permissão." };

  if (isStudent && booking.status === "CONFIRMADA") {
    return {
      error: "Aulas confirmadas exigem solicitação de cancelamento ao personal.",
    };
  }

  if (isStudent && booking.status === "CANCELAMENTO_SOLICITADO") {
    return { error: "Cancelamento já solicitado." };
  }

  if (!isPersonal && !canCancelWithNotice(booking.startAt, isPersonal)) {
    return { error: "Cancelamento permitido apenas com 24h de antecedência." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELADA", cancelReason: reason || null },
  });

  const targetId = isPersonal
    ? booking.vinculo.studentId
    : booking.vinculo.personalId;
  await notifyVinculo(
    targetId,
    booking.vinculoId,
    "BOOKING_CANCELLED",
    "Aula cancelada",
    reason || "Uma aula foi cancelada.",
    isPersonal ? "/aluno/aulas" : "/personal/agenda"
  );

  revalidateAll();
  return { success: true };
}

export async function requestBookingCancellationAction(
  bookingId: string,
  reason?: string
) {
  const session = await getSession();
  if (!session || session.role !== "ALUNO") throw new Error("FORBIDDEN");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vinculo: true },
  });
  if (!booking || booking.vinculo.studentId !== session.id) {
    return { error: "Agendamento não encontrado." };
  }

  if (booking.status !== "CONFIRMADA") {
    return { error: "Somente aulas confirmadas exigem aprovação para cancelar." };
  }

  if (!canStudentRequestCancellation(booking.startAt)) {
    return { error: "Cancelamento permitido apenas com 24h de antecedência." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELAMENTO_SOLICITADO",
      cancelReason: reason || null,
    },
  });

  await notifyVinculo(
    booking.vinculo.personalId,
    booking.vinculoId,
    "BOOKING_CANCEL_REQUEST",
    "Pedido de cancelamento",
    "Um aluno solicitou cancelamento de aula confirmada.",
    "/personal/agenda"
  );

  revalidateAll();
  return { success: true };
}

export async function approveCancellationAction(bookingId: string) {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vinculo: true },
  });
  if (!booking || booking.vinculo.personalId !== session.id) {
    return { error: "Agendamento não encontrado." };
  }
  if (booking.status !== "CANCELAMENTO_SOLICITADO") {
    return { error: "Não há solicitação de cancelamento pendente." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELADA" },
  });

  await notifyVinculo(
    booking.vinculo.studentId,
    booking.vinculoId,
    "BOOKING_CANCELLED",
    "Cancelamento aprovado",
    "Seu personal confirmou o cancelamento da aula.",
    "/aluno/aulas"
  );

  revalidateAll();
  return { success: true };
}

export async function rejectCancellationRequestAction(bookingId: string) {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vinculo: true },
  });
  if (!booking || booking.vinculo.personalId !== session.id) {
    return { error: "Agendamento não encontrado." };
  }
  if (booking.status !== "CANCELAMENTO_SOLICITADO") {
    return { error: "Não há solicitação de cancelamento pendente." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMADA", cancelReason: null },
  });

  await notifyVinculo(
    booking.vinculo.studentId,
    booking.vinculoId,
    "BOOKING_CANCEL_DENIED",
    "Cancelamento recusado",
    "Seu personal manteve a aula confirmada.",
    "/aluno/aulas"
  );

  revalidateAll();
  return { success: true };
}

export async function sendMessageAction(
  conversationId: string,
  content: string,
  type: "TEXT" | "IMAGE" | "FILE" = "TEXT",
  fileUrl?: string,
  fileName?: string
) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { vinculo: true },
  });
  if (!conv) return { error: "Conversa não encontrada." };

  const allowed = await userCanAccessConversation(
    session.id,
    session.role,
    conv
  );
  if (!allowed) return { error: "Sem permissão." };

  if (conv.type === "VINCULO" && conv.vinculo) {
    const access = await getPersonalAccess(conv.vinculo.personalId);
    if (
      session.id === conv.vinculo.personalId &&
      !access.canWrite &&
      session.role === "PERSONAL"
    ) {
      return { error: "Modo leitura: assine para enviar mensagens." };
    }
  }

  await prisma.message.create({
    data: {
      conversationId,
      senderId: session.id,
      content,
      type,
      fileUrl,
      fileName,
    },
  });

  revalidateAll();
  return { success: true };
}

async function userCanAccessConversation(
  userId: string,
  role: UserRole,
  conv: {
    type: "VINCULO" | "ADMIN_PERSONAL" | "ADMIN_ALUNO";
    personalId: string | null;
    studentId: string | null;
    vinculo: { personalId: string; studentId: string } | null;
  }
) {
  if (conv.type === "VINCULO" && conv.vinculo) {
    return (
      conv.vinculo.personalId === userId || conv.vinculo.studentId === userId
    );
  }
  if (conv.type === "ADMIN_PERSONAL") {
    if (role === "ADMIN") return true;
    return conv.personalId === userId;
  }
  if (conv.type === "ADMIN_ALUNO") {
    if (role === "ADMIN") return true;
    return conv.studentId === userId;
  }
  return false;
}

export async function markConversationReadAction(conversationId: string) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { vinculo: true },
  });
  if (!conv) return { error: "Conversa não encontrada." };

  const allowed = await userCanAccessConversation(
    session.id,
    session.role,
    conv
  );
  if (!allowed) return { error: "Sem permissão." };

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  await prisma.notification.updateMany({
    where: {
      userId: session.id,
      conversationId,
      read: false,
    },
    data: { read: true },
  });

  revalidateAll();
  return { success: true };
}

export async function activateSubscriptionAction(): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");

  await prisma.subscription.update({
    where: { userId: session.id },
    data: { status: "ATIVA", activatedAt: new Date() },
  });

  revalidatePath("/personal/assinatura");
}

export async function requestCategoryAction(name: string, description?: string) {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const profile = await prisma.personalProfile.findUnique({
    where: { userId: session.id },
  });
  if (!profile) return { error: "Perfil não encontrado." };

  await prisma.categoryRequest.create({
    data: {
      personalId: profile.id,
      requestedBy: session.id,
      name: name.trim(),
      description: description?.trim(),
    },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  for (const admin of admins) {
    await notify(
      admin.id,
      "SYSTEM",
      "Nova categoria solicitada",
      `${name} aguarda aprovação.`,
      "/admin/categorias"
    );
  }

  revalidateAll();
  return { success: true };
}

export async function approveCategoryRequestAction(requestId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("FORBIDDEN");

  const req = await prisma.categoryRequest.findUnique({
    where: { id: requestId },
    include: { personal: true },
  });
  if (!req) return { error: "Solicitação não encontrada." };

  const slug = slugify(req.name);
  const category = await prisma.category.upsert({
    where: { slug },
    create: { name: req.name, slug },
    update: {},
  });

  await prisma.categoryRequest.update({
    where: { id: requestId },
    data: { status: "APROVADA" },
  });

  await prisma.personalCategory.upsert({
    where: {
      personalId_categoryId: {
        personalId: req.personalId,
        categoryId: category.id,
      },
    },
    create: { personalId: req.personalId, categoryId: category.id },
    update: {},
  });

  await notify(
    req.requestedBy,
    "CATEGORY_APPROVED",
    "Categoria aprovada",
    `"${req.name}" foi adicionada ao seu perfil.`,
    "/personal/perfil"
  );

  revalidateAll();
  return { success: true };
}

export async function rejectCategoryRequestAction(
  requestId: string,
  reason: string
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("FORBIDDEN");

  const req = await prisma.categoryRequest.findUnique({
    where: { id: requestId },
    include: { personal: true },
  });
  if (!req) return { error: "Não encontrado." };

  await prisma.categoryRequest.update({
    where: { id: requestId },
    data: { status: "RECUSADA", rejectReason: reason },
  });

  await notify(
    req.requestedBy,
    "CATEGORY_REJECTED",
    "Categoria recusada",
    reason,
    "/personal/perfil"
  );

  revalidateAll();
  return { success: true };
}

export async function blockUserAction(userId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("FORBIDDEN");

  await prisma.user.update({
    where: { id: userId },
    data: { status: "BLOQUEADO" },
  });

  revalidateAll();
}

/** Server actions para formulários (evita inline actions em páginas admin) */
export async function blockUserFormAction(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") || "");
  if (userId) await blockUserAction(userId);
}

export async function acceptVinculoFormAction(formData: FormData): Promise<void> {
  const vinculoId = String(formData.get("vinculoId") || "");
  if (vinculoId) await acceptVinculoAction(vinculoId);
}

export async function rejectVinculoFormAction(formData: FormData): Promise<void> {
  const vinculoId = String(formData.get("vinculoId") || "");
  if (vinculoId) await rejectVinculoAction(vinculoId);
}

export async function approveBookingFormAction(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("bookingId") || "");
  if (bookingId) await approveBookingAction(bookingId);
}

export async function rejectBookingFormAction(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("bookingId") || "");
  if (bookingId) await rejectBookingAction(bookingId);
}

export async function cancelBookingFormAction(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("bookingId") || "");
  if (bookingId) await cancelBookingAction(bookingId);
}

export async function requestBookingCancellationFormAction(
  formData: FormData
): Promise<void> {
  const bookingId = String(formData.get("bookingId") || "");
  const reason = String(formData.get("reason") || "") || undefined;
  if (bookingId) await requestBookingCancellationAction(bookingId, reason);
}

export async function approveCancellationFormAction(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("bookingId") || "");
  if (bookingId) await approveCancellationAction(bookingId);
}

export async function rejectCancellationFormAction(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("bookingId") || "");
  if (bookingId) await rejectCancellationRequestAction(bookingId);
}

export async function approveCategoryFormAction(formData: FormData): Promise<void> {
  const requestId = String(formData.get("requestId") || "");
  if (requestId) await approveCategoryRequestAction(requestId);
}

export async function rejectCategoryFormAction(formData: FormData): Promise<void> {
  const requestId = String(formData.get("requestId") || "");
  const reason = String(formData.get("reason") || "Recusada pelo admin");
  if (requestId) await rejectCategoryRequestAction(requestId, reason);
}

export async function personalCreateBookingAction(
  vinculoId: string,
  slot: {
    startAt: string;
    endAt: string;
    locationId: string;
    locationName: string;
    locationAddress: string;
    locationMapUrl?: string;
  }
) {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const vinculo = await prisma.vinculo.findFirst({
    where: { id: vinculoId, personalId: session.id, status: "ATIVO" },
  });
  if (!vinculo) return { error: "Vínculo inválido." };

  const booking = await prisma.booking.create({
    data: {
      vinculoId,
      locationId: slot.locationId,
      startAt: new Date(slot.startAt),
      endAt: new Date(slot.endAt),
      status: "CONFIRMADA",
      locationName: slot.locationName,
      locationAddress: slot.locationAddress,
      locationMapUrl: slot.locationMapUrl || null,
    },
  });

  await notifyVinculo(
    vinculo.studentId,
    vinculoId,
    "BOOKING_APPROVED",
    "Aula agendada",
    `Seu personal agendou aula para ${format(booking.startAt, "dd/MM 'às' HH:mm")} em ${slot.locationName}.`,
    bookingDateLink(booking.startAt, "aluno")
  );

  revalidateAll();
  return { success: true, bookingId: booking.id };
}

export async function personalBlockSlotAction(
  startAt: string,
  endAt: string,
  reason?: string
) {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const profile = await prisma.personalProfile.findUnique({
    where: { userId: session.id },
  });
  if (!profile) return { error: "Perfil não encontrado." };

  await prisma.scheduleBlock.create({
    data: {
      personalId: profile.id,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      reason: reason || "Horário bloqueado",
    },
  });

  revalidateAll();
  return { success: true };
}

export async function removeScheduleBlockAction(blockId: string) {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const profile = await prisma.personalProfile.findUnique({
    where: { userId: session.id },
  });
  if (!profile) return { error: "Perfil não encontrado." };

  const block = await prisma.scheduleBlock.findFirst({
    where: { id: blockId, personalId: profile.id },
  });
  if (!block) return { error: "Bloqueio não encontrado." };

  await prisma.scheduleBlock.delete({ where: { id: blockId } });

  revalidateAll();
  return { success: true };
}

export async function personalCreateBookingFormAction(formData: FormData): Promise<void> {
  const vinculoId = String(formData.get("vinculoId") || "");
  if (!vinculoId) return;
  const startAt = String(formData.get("startAt"));
  const result = await personalCreateBookingAction(vinculoId, {
    startAt,
    endAt: String(formData.get("endAt")),
    locationId: String(formData.get("locationId")),
    locationName: String(formData.get("locationName")),
    locationAddress: String(formData.get("locationAddress")),
    locationMapUrl: String(formData.get("locationMapUrl") || "") || undefined,
  });
  if (result?.success && startAt) {
    redirect(bookingDateLink(new Date(startAt), "personal"));
  }
}

export async function personalBlockSlotFormAction(formData: FormData): Promise<void> {
  const startAt = String(formData.get("startAt") || "");
  const endAt = String(formData.get("endAt") || "");
  const reason = String(formData.get("reason") || "") || undefined;
  if (startAt && endAt) {
    await personalBlockSlotAction(startAt, endAt, reason);
  }
  redirect(`/personal/agenda?date=${format(new Date(startAt), "yyyy-MM-dd")}`);
}

export async function removeScheduleBlockFormAction(formData: FormData): Promise<void> {
  const blockId = String(formData.get("blockId") || "");
  if (blockId) await removeScheduleBlockAction(blockId);
}

export async function requestVinculoInviteFormAction(formData: FormData): Promise<void> {
  const code = String(formData.get("code") || "");
  if (code) await requestVinculoByInviteAction(code);
}

export async function requestVinculoDiscoveryFormAction(
  formData: FormData
): Promise<void> {
  const personalUserId = String(formData.get("personalUserId") || "");
  if (personalUserId) await requestVinculoDiscoveryAction(personalUserId);
  redirect("/aluno/buscar-personal?vinculo=sent");
}

export async function createBookingFormAction(formData: FormData): Promise<void> {
  const vinculoId = String(formData.get("vinculoId") || "");
  if (!vinculoId) return;
  const startAt = String(formData.get("startAt"));
  const result = await createBookingAction(vinculoId, {
    startAt,
    endAt: String(formData.get("endAt")),
    locationId: String(formData.get("locationId")),
    locationName: String(formData.get("locationName")),
    locationAddress: String(formData.get("locationAddress")),
    locationMapUrl: String(formData.get("locationMapUrl") || "") || undefined,
  });
  if (result?.success && startAt) {
    redirect(bookingDateLink(new Date(startAt), "aluno"));
  }
}

export async function completeExerciseFormAction(formData: FormData): Promise<void> {
  const logId = String(formData.get("logId") || "");
  if (!logId) return;
  await completeExerciseAction(logId, {
    actualSets: Number(formData.get("actualSets")) || undefined,
    actualReps: String(formData.get("actualReps") || ""),
    actualLoad: String(formData.get("actualLoad") || ""),
    studentNote: String(formData.get("studentNote") || ""),
  });
}

export async function requestCategoryFormAction(formData: FormData): Promise<void> {
  await requestCategoryAction(
    String(formData.get("name") || ""),
    String(formData.get("description") || "")
  );
}

export async function uploadFileAction(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "Arquivo não enviado." };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "application/octet-stream";
  const url = `data:${mimeType};base64,${base64}`;

  return { url, fileName: file.name };
}

export async function updatePersonalProfileAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const bio = String(formData.get("bio") || "");
  const isPublic = formData.get("isPublic") === "on";
  const categoryIds = formData.getAll("categoryIds") as string[];

  const profile = await prisma.personalProfile.findUnique({
    where: { userId: session.id },
  });
  if (!profile) return;

  await prisma.personalProfile.update({
    where: { id: profile.id },
    data: { bio, isPublic },
  });

  await prisma.personalCategory.deleteMany({
    where: { personalId: profile.id },
  });
  if (categoryIds.length) {
    await prisma.personalCategory.createMany({
      data: categoryIds.map((categoryId) => ({
        personalId: profile.id,
        categoryId,
      })),
    });
  }

  revalidatePath("/personal/perfil");
}

export async function saveLocationAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const profile = await prisma.personalProfile.findUnique({
    where: { userId: session.id },
  });
  if (!profile) return;

  const id = formData.get("id") as string | null;
  const data = {
    personalId: profile.id,
    name: String(formData.get("name")),
    address: String(formData.get("address")),
    city: String(formData.get("city") || "") || null,
    mapUrl: String(formData.get("mapUrl") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  };

  if (id) {
    const existing = await prisma.location.findFirst({
      where: { id, personalId: profile.id },
    });
    if (!existing) throw new Error("FORBIDDEN");
    await prisma.location.update({ where: { id }, data });
  } else {
    await prisma.location.create({ data });
  }

  revalidatePath("/personal/perfil");
  revalidatePath("/personal/agenda");
}

export async function deleteLocationFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const profile = await prisma.personalProfile.findUnique({
    where: { userId: session.id },
  });
  if (!profile) return;

  const id = String(formData.get("id") || "");
  const location = await prisma.location.findFirst({
    where: { id, personalId: profile.id },
  });
  if (!location) throw new Error("FORBIDDEN");

  const bookings = await prisma.booking.count({ where: { locationId: id } });
  if (bookings > 0) {
    redirect("/personal/perfil?error=location_in_use");
  }

  await prisma.location.delete({ where: { id } });
  revalidatePath("/personal/perfil");
  revalidatePath("/personal/agenda");
}

export async function saveAvailabilityAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const profile = await prisma.personalProfile.findUnique({
    where: { userId: session.id },
  });
  if (!profile) return;

  const id = formData.get("id") as string | null;
  const data = {
    personalId: profile.id,
    locationId: String(formData.get("locationId")),
    dayOfWeek: Number(formData.get("dayOfWeek")),
    startTime: String(formData.get("startTime")),
    endTime: String(formData.get("endTime")),
    slotMinutes: Number(formData.get("slotMinutes") || 60),
  };

  if (id) {
    const existing = await prisma.availabilityRule.findFirst({
      where: { id, personalId: profile.id },
    });
    if (!existing) throw new Error("FORBIDDEN");
    await prisma.availabilityRule.update({ where: { id }, data });
  } else {
    await prisma.availabilityRule.create({ data });
  }

  revalidatePath("/personal/perfil");
  revalidatePath("/personal/agenda");
}

export async function deleteAvailabilityFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const profile = await prisma.personalProfile.findUnique({
    where: { userId: session.id },
  });
  if (!profile) return;

  const id = String(formData.get("id") || "");
  await prisma.availabilityRule.deleteMany({
    where: { id, personalId: profile.id },
  });

  revalidatePath("/personal/perfil");
  revalidatePath("/personal/agenda");
}

export async function createWorkoutAction(
  vinculoId: string,
  title: string,
  exercises: {
    name: string;
    sets: number;
    reps: string;
    load?: string;
    restSeconds?: number;
    notes?: string;
  }[]
) {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const workout = await prisma.workout.create({
    data: {
      vinculoId,
      title,
      ...(exercises.length > 0
        ? {
            exercises: {
              create: exercises.map((ex, i) => ({
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                load: ex.load,
                restSeconds: ex.restSeconds,
                notes: ex.notes,
                orderIndex: i,
                logs: { create: {} },
              })),
            },
          }
        : {}),
    },
  });

  await notify(
    (
      await prisma.vinculo.findUnique({
        where: { id: vinculoId },
        select: { studentId: true },
      })
    )!.studentId,
    "SYSTEM",
    "Novo treino",
    `Treino "${title}" disponível.`,
    "/aluno/treino"
  );

  revalidateAll();
  return { success: true, workoutId: workout.id };
}

const defaultWorkoutExercises: {
  name: string;
  sets: number;
  reps: string;
  load?: string;
  restSeconds?: number;
  notes?: string;
}[] = [];

export async function createWorkoutFormAction(formData: FormData): Promise<void> {
  const vinculoId = String(formData.get("vinculoId") || "");
  const title = String(formData.get("title") || "Novo treino");
  const result = await createWorkoutAction(vinculoId, title, defaultWorkoutExercises);
  if (result?.success) {
    redirect(`/personal/treinos/${result.workoutId}`);
  }
}

export async function updateWorkoutFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const workoutId = String(formData.get("workoutId") || "");
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, vinculo: { personalId: session.id } },
    include: { exercises: true },
  });
  if (!workout) throw new Error("FORBIDDEN");

  const title = String(formData.get("title") || workout.title);
  const notes = String(formData.get("notes") || "") || null;

  const exercises: {
    id?: string;
    name: string;
    sets: number;
    reps: string;
    load?: string;
    restSeconds?: number;
    notes?: string;
  }[] = [];

  let index = 0;
  while (formData.has(`exercise_${index}_name`)) {
    const name = String(formData.get(`exercise_${index}_name`) || "").trim();
    if (name) {
      exercises.push({
        id: String(formData.get(`exercise_${index}_id`) || "") || undefined,
        name,
        sets: Number(formData.get(`exercise_${index}_sets`) || 3),
        reps: String(formData.get(`exercise_${index}_reps`) || "10"),
        load: String(formData.get(`exercise_${index}_load`) || "") || undefined,
        restSeconds: Number(formData.get(`exercise_${index}_rest`) || 0) || undefined,
        notes: String(formData.get(`exercise_${index}_notes`) || "") || undefined,
      });
    }
    index += 1;
  }

  await prisma.workout.update({
    where: { id: workoutId },
    data: { title, notes },
  });

  const keptIds = new Set(
    exercises.map((ex) => ex.id).filter((id): id is string => Boolean(id))
  );
  const toDelete = workout.exercises
    .map((ex) => ex.id)
    .filter((id) => !keptIds.has(id));

  if (toDelete.length) {
    await prisma.exercise.deleteMany({ where: { id: { in: toDelete } } });
  }

  for (let i = 0; i < exercises.length; i += 1) {
    const ex = exercises[i];
    if (ex.id && workout.exercises.some((existing) => existing.id === ex.id)) {
      await prisma.exercise.update({
        where: { id: ex.id },
        data: {
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          load: ex.load || null,
          restSeconds: ex.restSeconds || null,
          notes: ex.notes || null,
          orderIndex: i,
        },
      });
    } else {
      await prisma.exercise.create({
        data: {
          workoutId,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          load: ex.load || null,
          restSeconds: ex.restSeconds || null,
          notes: ex.notes || null,
          orderIndex: i,
          logs: { create: {} },
        },
      });
    }
  }

  revalidatePath("/personal/treinos");
  revalidatePath(`/personal/treinos/${workoutId}`);
  revalidatePath("/aluno/treino");
}

export async function deleteWorkoutFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const workoutId = String(formData.get("workoutId") || "");
  const redirectTo = String(formData.get("redirectTo") || "");
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, vinculo: { personalId: session.id } },
  });
  if (!workout) throw new Error("FORBIDDEN");

  await prisma.workout.delete({ where: { id: workoutId } });
  revalidatePath("/personal/treinos");
  revalidatePath("/aluno/treino");
  redirect(
    redirectTo || `/personal/treinos/aluno/${workout.vinculoId}`
  );
}

export async function completeExerciseAction(
  logId: string,
  data: {
    actualSets?: number;
    actualReps?: string;
    actualLoad?: string;
    studentNote?: string;
  }
) {
  const session = await getSession();
  if (!session || session.role !== "ALUNO") throw new Error("FORBIDDEN");

  await prisma.exerciseLog.update({
    where: { id: logId },
    data: {
      completed: true,
      completedAt: new Date(),
      ...data,
    },
  });

  revalidatePath("/aluno/treino");
  return { success: true };
}

export async function markNotificationReadAction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  await prisma.notification.updateMany({
    where: { id, userId: session.id, read: false },
    data: { read: true },
  });

  revalidateAll();
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  await prisma.notification.updateMany({
    where: { userId: session.id, read: false },
    data: { read: true },
  },

  );

  revalidateAll();
  return { success: true };
}

// ============================
// DESVINCULAR COM MOTIVO
// ============================

export async function desvincularAction(vinculoId: string, reason: string) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (!reason.trim()) return { error: "Motivo obrigatório." };

  const vinculo = await prisma.vinculo.findUnique({ where: { id: vinculoId } });
  if (!vinculo) return { error: "Vínculo não encontrado." };

  const isPersonal = session.role === "PERSONAL" && vinculo.personalId === session.id;
  const isAluno = session.role === "ALUNO" && vinculo.studentId === session.id;
  if (!isPersonal && !isAluno) return { error: "Sem permissão." };

  if (vinculo.status !== "ATIVO") return { error: "Vínculo não está ativo." };

  await prisma.vinculo.update({
    where: { id: vinculoId },
    data: {
      status: "ENCERRADO",
      endedAt: new Date(),
      endReason: reason.trim(),
      endedBy: session.id,
    },
  });

  const targetId = isPersonal ? vinculo.studentId : vinculo.personalId;
  await notify(
    targetId,
    "SYSTEM",
    "Vínculo encerrado",
    `O vínculo foi encerrado. Motivo: ${reason.trim()}`,
    isPersonal ? "/aluno" : "/personal/alunos"
  );

  revalidateAll();
  return { success: true };
}

export async function desvincularFormAction(formData: FormData): Promise<void> {
  const vinculoId = String(formData.get("vinculoId") || "");
  const reason = String(formData.get("reason") || "");
  await desvincularAction(vinculoId, reason);
  revalidateAll();
}

// ============================
// FOTO DE PERFIL (AVATAR)
// ============================

export async function updateAvatarAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  const file = formData.get("avatar") as File | null;
  if (!file) return { error: "Arquivo não enviado." };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/jpeg";
  const avatarUrl = `data:${mimeType};base64,${base64}`;

  await prisma.user.update({
    where: { id: session.id },
    data: { avatarUrl },
  });

  revalidateAll();
  return { success: true, avatarUrl };
}

// ============================
// PORTFÓLIO DE FOTOS
// ============================

export async function uploadPortfolioPhotoAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const profile = await prisma.personalProfile.findUnique({ where: { userId: session.id } });
  if (!profile) return { error: "Perfil não encontrado." };

  const file = formData.get("photo") as File | null;
  const categoryId = String(formData.get("categoryId") || "");
  const caption = String(formData.get("caption") || "").trim();

  if (!file) return { error: "Foto não enviada." };
  if (!categoryId) return { error: "Selecione uma categoria." };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/jpeg";
  const photoUrl = `data:${mimeType};base64,${base64}`;

  const existingCount = await prisma.portfolioPhoto.count({
    where: { personalId: profile.id, categoryId },
  });
  if (existingCount >= 5) return { error: "Máximo de 5 fotos por categoria." };

  await prisma.portfolioPhoto.create({
    data: {
      personalId: profile.id,
      categoryId,
      photoUrl,
      caption: caption || null,
      orderIndex: existingCount,
    },
  });

  revalidatePath("/personal/perfil");
  return { success: true };
}

export async function deletePortfolioPhotoAction(photoId: string) {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") throw new Error("FORBIDDEN");
  await assertPersonalCanWrite(session.id);

  const profile = await prisma.personalProfile.findUnique({ where: { userId: session.id } });
  if (!profile) return { error: "Perfil não encontrado." };

  const photo = await prisma.portfolioPhoto.findFirst({
    where: { id: photoId, personalId: profile.id },
  });
  if (!photo) return { error: "Foto não encontrada." };

  await prisma.portfolioPhoto.delete({ where: { id: photoId } });

  revalidatePath("/personal/perfil");
  return { success: true };
}

export async function deletePortfolioPhotoFormAction(formData: FormData): Promise<void> {
  const photoId = String(formData.get("photoId") || "");
  if (photoId) await deletePortfolioPhotoAction(photoId);
}

export async function uploadPortfolioPhotoFormAction(formData: FormData): Promise<void> {
  const result = await uploadPortfolioPhotoAction(formData);
  if (result?.error) {
    // Silently ignore for form action — errors handled by revalidation
  }
}

// ============================
// ADMIN: GERENCIAR VÍNCULOS
// ============================

export async function adminDesvincularAction(vinculoId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("FORBIDDEN");

  const vinculo = await prisma.vinculo.findUnique({ where: { id: vinculoId } });
  if (!vinculo) return { error: "Vínculo não encontrado." };

  await prisma.vinculo.update({
    where: { id: vinculoId },
    data: {
      status: "ENCERRADO",
      endedAt: new Date(),
      endReason: "Encerrado pelo administrador",
      endedBy: session.id,
    },
  });

  revalidateAll();
  return { success: true };
}

export async function adminDesvincularFormAction(formData: FormData): Promise<void> {
  const vinculoId = String(formData.get("vinculoId") || "");
  if (vinculoId) await adminDesvincularAction(vinculoId);
}

// ============================
// ADMIN: GERENCIAR LOCAIS
// ============================

export async function adminDeleteLocationAction(locationId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("FORBIDDEN");

  const location = await prisma.location.findUnique({ where: { id: locationId } });
  if (!location) return { error: "Local não encontrado." };

  const bookings = await prisma.booking.count({ where: { locationId } });
  if (bookings > 0) return { error: "Local possui agendamentos vinculados." };

  await prisma.location.delete({ where: { id: locationId } });

  revalidateAll();
  return { success: true };
}

export async function adminDeleteLocationFormAction(formData: FormData): Promise<void> {
  const locationId = String(formData.get("locationId") || "");
  if (locationId) await adminDeleteLocationAction(locationId);
}
