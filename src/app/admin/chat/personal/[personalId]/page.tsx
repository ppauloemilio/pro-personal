import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureAdminPersonalConversation } from "@/lib/admin-chat";
import { ChatPanel } from "@/components/chat-panel";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminChatPersonalPage({
  params,
}: {
  params: Promise<{ personalId: string }>;
}) {
  const { personalId } = await params;
  const session = await getSession();

  const personal = await prisma.user.findFirst({
    where: { id: personalId, role: "PERSONAL", status: "ATIVO" },
  });
  if (!personal) {
    return <p className="text-slate-400">Personal não encontrado.</p>;
  }

  const baseConv = await ensureAdminPersonalConversation(personalId);
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
      <Link href="/admin/chat">
        <Button variant="ghost" size="sm">
          ← Voltar
        </Button>
      </Link>
      <h2 className="text-lg font-semibold text-white">
        Chat com {personal.name}
        <span className="ml-2 text-sm font-normal text-slate-400">(Personal)</span>
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
