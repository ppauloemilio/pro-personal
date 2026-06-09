import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell, personalNav } from "@/components/layout/app-shell";
import { getUnreadCount, getUserNotifications } from "@/lib/data";
import { getChatUnreadState, getPersonalSupportUnread } from "@/lib/chat-unread";

export default async function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "PERSONAL") redirect("/login");

  let unread = 0;
  let notifications: Awaited<ReturnType<typeof getUserNotifications>> = [];
  let navUnreadByHref: Record<string, boolean> = {};
  try {
    const [unreadCount, notifList, chatUnread, suporteUnread] =
      await Promise.all([
        getUnreadCount(session.id),
        getUserNotifications(session.id),
        getChatUnreadState(session.id, session.role),
        getPersonalSupportUnread(session.id),
      ]);
    unread = unreadCount;
    notifications = notifList;
    navUnreadByHref = {
      "/personal/chat": chatUnread.menuHasUnread,
      "/personal/suporte": suporteUnread,
    };
  } catch {
    unread = 0;
  }

  return (
    <AppShell
      title="Pro-Personal"
      nav={personalNav}
      userName={session.name}
      unreadCount={unread}
      notifications={notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }))}
      navUnreadByHref={navUnreadByHref}
      badge="Personal"
    >
      {children}
    </AppShell>
  );
}
