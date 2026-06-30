import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminChatUnreadState } from "@/lib/chat-unread";
import { ChatContactList } from "@/components/search/chat-contact-list";

export default async function AdminChatListPage() {
  const session = await getSession();

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

  const personalContacts = personals.map((p) => ({
    id: p.id,
    name: p.name,
    href: `/admin/chat/personal/${p.id}`,
    subtitle: "Personal",
    searchFields: [p.email, p.name],
    hasUnread: (chatUnread.personalUnread[p.id] || 0) > 0,
  }));

  const studentContacts = students.map((s) => ({
    id: s.id,
    name: s.name,
    href: `/admin/chat/aluno/${s.id}`,
    subtitle: "Aluno",
    searchFields: [s.email, s.name],
    hasUnread: (chatUnread.studentUnread[s.id] || 0) > 0,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Chat</h1>
      <ChatContactList
        title="Personais"
        contacts={personalContacts}
        selectedId={undefined}
        emptyMessage="Nenhum personal ativo disponível."
        noResultsMessage="Nenhum personal encontrado."
      />
      <ChatContactList
        title="Alunos"
        contacts={studentContacts}
        selectedId={undefined}
        emptyMessage="Nenhum aluno ativo disponível."
        noResultsMessage="Nenhum aluno encontrado."
      />
    </div>
  );
}
