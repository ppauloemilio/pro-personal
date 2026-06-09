import { prisma } from "./prisma";

export async function ensureAdminStudentConversation(studentId: string) {
  let conv = await prisma.conversation.findFirst({
    where: { type: "ADMIN_ALUNO", studentId },
  });
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { type: "ADMIN_ALUNO", studentId },
    });
  }
  return conv;
}

export async function ensureAdminPersonalConversation(personalId: string) {
  let conv = await prisma.conversation.findFirst({
    where: { type: "ADMIN_PERSONAL", personalId },
  });
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { type: "ADMIN_PERSONAL", personalId },
    });
  }
  return conv;
}
