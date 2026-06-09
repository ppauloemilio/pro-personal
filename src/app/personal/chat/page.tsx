import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getChatUnreadState } from "@/lib/chat-unread";
import { PersonalChatContactList } from "@/components/search/personal-chat-contact-list";



export default async function PersonalChatListPage() {

  const session = await getSession();



  const [vinculos, chatUnread] = await Promise.all([
    prisma.vinculo.findMany({
    where: { personalId: session!.id, status: "ATIVO" },

    include: {

      student: true,

      conversation: {

        include: {

          messages: { orderBy: { createdAt: "desc" }, take: 1 },

        },

      },

    },

    orderBy: { student: { name: "asc" } },
  }),
    getChatUnreadState(session!.id, "PERSONAL"),
  ]);



  const contacts = vinculos.map((v) => ({

    id: v.id,

    name: v.student.name,

    email: v.student.email,

    href: `/personal/chat/${v.id}`,

    lastMessage: v.conversation?.messages[0]?.content,
    hasUnread: (chatUnread.byContactId[v.id] || 0) > 0,
  }));



  return <PersonalChatContactList contacts={contacts} />;

}

