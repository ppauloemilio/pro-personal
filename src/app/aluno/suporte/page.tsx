import { getSession } from "@/lib/auth";
import { ensureAdminStudentConversation } from "@/lib/admin-chat";
import { prisma } from "@/lib/prisma";
import { ChatPanel } from "@/components/chat-panel";

export default async function AlunoSuportePage() {
  const session = await getSession();

  const conv = await ensureAdminStudentConversation(session!.id);
  const messages = await prisma.message.findMany({
    where: { conversationId: conv.id },
    include: { sender: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4">
      <p className="text-slate-400">
        Canal oficial com a administração Pro-Personal. Envie mensagens, fotos e
        arquivos.
      </p>
      <ChatPanel
        conversationId={conv.id}
        currentUserId={session!.id}
        messages={messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
