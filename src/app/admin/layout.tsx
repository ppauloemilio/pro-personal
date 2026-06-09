import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell, adminNav } from "@/components/layout/app-shell";
import { getUnreadCount, getUserNotifications } from "@/lib/data";
import { getAdminChatUnreadState } from "@/lib/chat-unread";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const [unread, notifications, chatUnread] = await Promise.all([
    getUnreadCount(session.id),
    getUserNotifications(session.id),
    getAdminChatUnreadState(session.id),
  ]);

  return (
    <AppShell
      title="Admin"
      nav={adminNav}
      userName={session.name}
      unreadCount={unread}
      notifications={notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }))}
      navUnreadByHref={{
        "/admin/chat": chatUnread.menuHasUnread,
      }}
      badge="Administrador"
    >
      {children}
    </AppShell>
  );
}
