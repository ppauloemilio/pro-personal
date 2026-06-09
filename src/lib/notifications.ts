import { prisma } from "./prisma";
import type { NotificationType } from "@prisma/client";

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
  conversationId?: string
) {
  return prisma.notification.create({
    data: { userId, type, title, body, link, conversationId },
  });
}

export async function ensureVinculoConversationId(vinculoId: string) {
  let conv = await prisma.conversation.findUnique({
    where: { vinculoId },
  });
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { type: "VINCULO", vinculoId },
    });
  }
  return conv.id;
}

export async function notifyVinculo(
  userId: string,
  vinculoId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) {
  const conversationId = await ensureVinculoConversationId(vinculoId);
  return notify(userId, type, title, body, link, conversationId);
}

export async function sendVinculoChatMessage(
  vinculoId: string,
  senderId: string,
  content: string
) {
  let conv = await prisma.conversation.findUnique({
    where: { vinculoId },
  });
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { type: "VINCULO", vinculoId },
    });
  }

  return prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId,
      content,
      type: "TEXT",
    },
  });
}
