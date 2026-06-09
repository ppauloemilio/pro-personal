import { getSession } from "@/lib/auth";
import { ensureAdminPersonalConversation } from "@/lib/admin-chat";
import { prisma } from "@/lib/prisma";
import { ChatPanel } from "@/components/chat-panel";

export default async function PersonalSuportePage() {
  const session = await getSession();

  const baseConv = await ensureAdminPersonalConversation(session!.id);
  const conv = await prisma.conversation.findUnique({
    where: { id: baseConv.id },
    include: {
      messages: {
        include: { sender: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!conv) return null;

  return (
    <div className="space-y-4">
      <p className="text-slate-400">
        Canal oficial com a equipe Pro-Personal. Envie mensagens, fotos e arquivos.
      </p>
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
