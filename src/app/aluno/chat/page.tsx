import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getChatUnreadState } from "@/lib/chat-unread";
import { ChatContactList } from "@/components/search/chat-contact-list";

export default async function AlunoChatListPage() {
  const session = await getSession();

  const [vinculos, chatUnread] = await Promise.all([
    prisma.vinculo.findMany({
      where: { studentId: session!.id, status: "ATIVO" },
      include: {
        personal: true,
        conversation: {
          include: {
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { personal: { name: "asc" } },
    }),
    getChatUnreadState(session!.id, "ALUNO"),
  ]);

  const contacts = vinculos.map((v) => ({
    id: v.id,
    name: v.personal.name,
    href: `/aluno/chat/${v.id}`,
    subtitle: v.personal.email,
    searchFields: [v.personal.email, v.personal.name],
    hasUnread: (chatUnread.byContactId[v.id] || 0) > 0,
  }));

  return (
    <ChatContactList
      title="Meus Personais"
      contacts={contacts}
      selectedId={undefined}
      emptyMessage="Nenhum personal vinculado ainda."
      noResultsMessage="Nenhum personal encontrado."
    />
  );
}
