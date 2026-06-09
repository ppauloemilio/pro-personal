import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";

export type ChatUnreadState = {
  menuHasUnread: boolean;
  byContactId: Record<string, number>;
};

export type AdminChatUnreadState = {
  menuHasUnread: boolean;
  personalUnread: Record<string, number>;
  studentUnread: Record<string, number>;
};

async function getConversationUnreadCount(
  userId: string,
  conversationId: string
) {
  const [msgCount, notifCount] = await Promise.all([
    prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
    }),
    prisma.notification.count({
      where: {
        userId,
        conversationId,
        read: false,
      },
    }),
  ]);

  return msgCount + notifCount;
}

export async function getChatUnreadState(
  userId: string,
  role: UserRole
): Promise<ChatUnreadState> {
  const byContactId: Record<string, number> = {};

  if (role === "ALUNO") {
    const vinculos = await prisma.vinculo.findMany({
      where: { studentId: userId, status: "ATIVO" },
      include: { conversation: true },
    });

    for (const vinculo of vinculos) {
      if (!vinculo.conversation) continue;
      const count = await getConversationUnreadCount(
        userId,
        vinculo.conversation.id
      );
      if (count > 0) byContactId[vinculo.id] = count;
    }
  } else if (role === "PERSONAL") {
    const vinculos = await prisma.vinculo.findMany({
      where: { personalId: userId, status: "ATIVO" },
      include: { conversation: true },
    });

    for (const vinculo of vinculos) {
      if (!vinculo.conversation) continue;
      const count = await getConversationUnreadCount(
        userId,
        vinculo.conversation.id
      );
      if (count > 0) byContactId[vinculo.id] = count;
    }
  }

  return {
    menuHasUnread: Object.keys(byContactId).length > 0,
    byContactId,
  };
}

export async function getStudentSupportUnread(studentId: string) {
  const conv = await prisma.conversation.findFirst({
    where: { type: "ADMIN_ALUNO", studentId },
  });
  if (!conv) return false;
  const count = await getConversationUnreadCount(studentId, conv.id);
  return count > 0;
}

export async function getPersonalSupportUnread(personalId: string) {
  const conv = await prisma.conversation.findFirst({
    where: { type: "ADMIN_PERSONAL", personalId },
  });
  if (!conv) return false;
  const count = await getConversationUnreadCount(personalId, conv.id);
  return count > 0;
}

export async function getAdminChatUnreadState(
  adminId: string
): Promise<AdminChatUnreadState> {
  const [personalConversations, studentConversations] = await Promise.all([
    prisma.conversation.findMany({
      where: { type: "ADMIN_PERSONAL", personalId: { not: null } },
    }),
    prisma.conversation.findMany({
      where: { type: "ADMIN_ALUNO", studentId: { not: null } },
    }),
  ]);

  const personalUnread: Record<string, number> = {};
  const studentUnread: Record<string, number> = {};

  for (const conversation of personalConversations) {
    if (!conversation.personalId) continue;
    const count = await getConversationUnreadCount(adminId, conversation.id);
    if (count > 0) personalUnread[conversation.personalId] = count;
  }

  for (const conversation of studentConversations) {
    if (!conversation.studentId) continue;
    const count = await getConversationUnreadCount(adminId, conversation.id);
    if (count > 0) studentUnread[conversation.studentId] = count;
  }

  return {
    personalUnread,
    studentUnread,
    menuHasUnread:
      Object.keys(personalUnread).length > 0 ||
      Object.keys(studentUnread).length > 0,
  };
}

export function getChatNavHref(role: UserRole) {
  if (role === "ALUNO") return "/aluno/chat";
  if (role === "PERSONAL") return "/personal/chat";
  return "/admin/chat";
}

export function getSupportNavHref(role: UserRole) {
  if (role === "ALUNO") return "/aluno/suporte";
  return "/personal/suporte";
}
