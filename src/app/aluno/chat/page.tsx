import { getSession } from "@/lib/auth";
import { getStudentContext } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ChatPanel } from "@/components/chat-panel";

export default async function AlunoChatPage() {
  const session = await getSession();
  const ctx = await getStudentContext(session!.id);
  const vinculo = ctx.activeVinculo || ctx.vinculos.find((v) => v.status === "ATIVO");
  if (!vinculo) redirect("/aluno");

  let conv = await prisma.conversation.findUnique({
    where: { vinculoId: vinculo.id },
    include: {
      messages: {
        include: { sender: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conv) {
    conv = await prisma.conversation.create({
      data: { type: "VINCULO", vinculoId: vinculo.id },
      include: {
        messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
      },
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Chat com {vinculo.personal.name}
      </h2>
      <ChatPanel
        conversationId={conv.id}
        currentUserId={session!.id}
        messages={conv.messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
