import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell, alunoNav } from "@/components/layout/app-shell";
import { getUnreadCount, getStudentContext, getUserNotifications } from "@/lib/data";
import {
  getChatUnreadState,
  getStudentSupportUnread,
} from "@/lib/chat-unread";
import { VinculoSwitcher } from "@/components/vinculo-switcher";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "ALUNO") redirect("/login");

  let unread = 0;
  let notifications: Awaited<ReturnType<typeof getUserNotifications>> = [];
  let navUnreadByHref: Record<string, boolean> = {};
  let vinculos: Awaited<ReturnType<typeof getStudentContext>>["vinculos"] = [];
  let activeVinculoId: string | undefined;

  try {
    const [unreadCount, notifList, chatUnread, suporteUnread, ctx] =
      await Promise.all([
        getUnreadCount(session.id),
        getUserNotifications(session.id),
        getChatUnreadState(session.id, session.role),
        getStudentSupportUnread(session.id),
        getStudentContext(session.id),
      ]);
    unread = unreadCount;
    notifications = notifList;
    navUnreadByHref = {
      "/aluno/chat": chatUnread.menuHasUnread,
      "/aluno/suporte": suporteUnread,
    };
    vinculos = ctx.vinculos;
    activeVinculoId = ctx.activeVinculo?.id;
  } catch {
    /* banco indisponível */
  }

  const hasActive = vinculos.some((v) => v.status === "ATIVO");

  return (
    <AppShell
      title="Pro-Personal"
      nav={alunoNav}
      userName={session.name}
      unreadCount={unread}
      notifications={notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }))}
      navUnreadByHref={navUnreadByHref}
      badge="Aluno"
    >
      {hasActive && vinculos.length > 1 && (
        <VinculoSwitcher
          vinculos={vinculos.map((v) => ({
            id: v.id,
            status: v.status,
            personalName: v.personal.name,
            categories:
              v.personal.personalProfile?.categories
                .map((c) => c.category.name)
                .join(", ") || "",
          }))}
          activeId={activeVinculoId}
        />
      )}
      {children}
    </AppShell>
  );
}
