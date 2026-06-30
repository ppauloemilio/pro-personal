import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureAdminStudentConversation } from "@/lib/admin-chat";
import { ChatPanel } from "@/components/chat-panel";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminChatAlunoPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const session = await getSession();

  const student = await prisma.user.findFirst({
    where: { id: studentId, role: "ALUNO", status: "ATIVO" },
  });
  if (!student) {
    return <p className="text-slate-400">Aluno não encontrado.</p>;
  }

  const baseConv = await ensureAdminStudentConversation(studentId);
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
        Chat com {student.name}
        <span className="ml-2 text-sm font-normal text-slate-400">(Aluno)</span>
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
