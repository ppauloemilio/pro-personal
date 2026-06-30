import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatPanel } from "@/components/chat-panel";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AlunoChatConversationPage({
  params,
}: {
  params: Promise<{ vinculoId: string }>;
}) {
  const { vinculoId } = await params;
  const session = await getSession();

  const vinculo = await prisma.vinculo.findFirst({
    where: { id: vinculoId, studentId: session!.id },
    include: {
      personal: true,
      conversation: {
        include: {
          messages: {
            include: { sender: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!vinculo) {
    return <p className="text-slate-400">Vínculo não encontrado.</p>;
  }

  let conv = vinculo.conversation;
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { type: "VINCULO", vinculoId },
      include: {
        messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
      },
    });
  }

  return (
    <div className="space-y-4">
      <Link href="/aluno/chat">
        <Button variant="ghost" size="sm">
          ← Voltar
        </Button>
      </Link>
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
