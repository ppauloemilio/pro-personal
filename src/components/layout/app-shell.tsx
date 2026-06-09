"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Dumbbell,
  MessageCircle,
  User,
  CreditCard,
  Search,
  BookOpen,
  Shield,
  Tags,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions";
import type { NavItemConfig } from "./nav-config";
import { AppLogo } from "./app-logo";
import {
  NotificationBell,
  type NotificationItem,
} from "./notification-bell";

const icons: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  calendar: Calendar,
  dumbbell: Dumbbell,
  "message-circle": MessageCircle,
  user: User,
  "credit-card": CreditCard,
  search: Search,
  "book-open": BookOpen,
  shield: Shield,
  tags: Tags,
};

export function AppShell({
  title,
  nav,
  children,
  userName,
  unreadCount = 0,
  notifications = [],
  navUnreadByHref = {},
  badge,
}: {
  title: string;
  nav: NavItemConfig[];
  children: React.ReactNode;
  userName: string;
  unreadCount?: number;
  notifications?: NotificationItem[];
  navUnreadByHref?: Record<string, boolean>;
  badge?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-surface-border bg-surface/95 backdrop-blur-xl transition lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-start justify-between gap-2 border-b border-surface-border px-5 py-5">
          <div className="min-w-0">
            <AppLogo size="sm" nameClassName="text-brand-300" />
            {badge && (
              <p className="mt-1 text-xs text-brand-400">{badge}</p>
            )}
          </div>
          <button
            type="button"
            className="shrink-0 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = icons[item.icon] || LayoutDashboard;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-brand-500/15 text-brand-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {navUnreadByHref[item.href] && (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-400 ring-2 ring-surface"
                    aria-label="Novas mensagens ou notificações"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-surface-border p-4">
          <p className="truncate text-sm font-medium text-white">{userName}</p>
          <form action={logoutAction} className="mt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-surface-border/80 bg-surface/80 px-4 py-4 backdrop-blur-xl lg:px-8">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-lg font-semibold text-white lg:text-xl">{title}</h1>
          <NotificationBell
            initialNotifications={notifications}
            initialUnreadCount={unreadCount}
          />
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export { personalNav, alunoNav, adminNav } from "./nav-config";
