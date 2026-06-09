import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminChatUnreadState } from "@/lib/chat-unread";
import { ensureAdminPersonalConversation, ensureAdminStudentConversation } from "@/lib/admin-chat";
import { ChatPanel } from "@/components/chat-panel";
import { Card } from "@/components/ui/card";
import { ChatContactList } from "@/components/search/chat-contact-list";

export default async function AdminChatPage({
  searchParams,
}: {
  searchParams: Promise<{ personalId?: string; studentId?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;

  const [personals, students, chatUnread] = await Promise.all([
    prisma.user.findMany({
      where: { role: "PERSONAL", status: "ATIVO" },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ALUNO", status: "ATIVO" },
      orderBy: { name: "asc" },
    }),
    getAdminChatUnreadState(session!.id),
  ]);

  let selectedConv = null;
  let selectedContact: { name: string; type: "personal" | "student" } | null =
    null;

  if (params.personalId) {
    const personal = personals.find((p) => p.id === params.personalId);
    if (personal) {
      selectedConv = await ensureAdminPersonalConversation(personal.id);
      selectedContact = { name: personal.name, type: "personal" };
    }
  } else if (params.studentId) {
    const student = students.find((s) => s.id === params.studentId);
    if (student) {
      selectedConv = await ensureAdminStudentConversation(student.id);
      selectedContact = { name: student.name, type: "student" };
    }
  }

  if (selectedConv) {
    selectedConv = await prisma.conversation.findUnique({
      where: { id: selectedConv.id },
      include: {
        messages: {
          include: { sender: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  const personalContacts = personals.map((p) => ({
    id: p.id,
    name: p.name,
    href: `/admin/chat?personalId=${p.id}`,
    subtitle: p.email,
    searchFields: [p.email],
    hasUnread: (chatUnread.personalUnread[p.id] || 0) > 0,
  }));

  const studentContacts = students.map((s) => ({
    id: s.id,
    name: s.name,
    href: `/admin/chat?studentId=${s.id}`,
    subtitle: s.email,
    searchFields: [s.email],
    hasUnread: (chatUnread.studentUnread[s.id] || 0) > 0,
  }));

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-1">
        <ChatContactList
          title="Personais"
          contacts={personalContacts}
          selectedId={params.personalId}
          emptyMessage="Nenhum personal ativo disponível."
          noResultsMessage="Nenhum personal encontrado."
        />
        <ChatContactList
          title="Alunos"
          contacts={studentContacts}
          selectedId={params.studentId}
          emptyMessage="Nenhum aluno ativo disponível."
          noResultsMessage="Nenhum aluno encontrado."
        />
      </div>

      <div className="lg:col-span-2">
        {selectedConv && selectedContact ? (
          <>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Chat com {selectedContact.name}
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({selectedContact.type === "personal" ? "Personal" : "Aluno"})
              </span>
            </h2>
            <ChatPanel
              conversationId={selectedConv.id}
              currentUserId={session!.id}
              messages={selectedConv.messages.map((m) => ({
                ...m,
                createdAt: m.createdAt.toISOString(),
              }))}
            />
          </>
        ) : (
          <Card className="flex h-64 items-center justify-center text-slate-400">
            Selecione um personal ou aluno para conversar
          </Card>
        )}
      </div>
    </div>
  );
}
