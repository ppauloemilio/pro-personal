"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setItems(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }, [initialNotifications, initialUnreadCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleOpen() {
    setOpen((current) => !current);
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0 || busy) return;
    setBusy(true);
    const res = await markAllNotificationsReadAction();
    if (res.success) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
    setBusy(false);
  }

  async function handleNotificationClick(notification: NotificationItem) {
    if (!notification.read) {
      const res = await markNotificationReadAction(notification.id);
      if (res.success) {
        setItems((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }

    setOpen(false);
    if (notification.link) router.push(notification.link);
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition",
          unreadCount > 0
            ? "bg-brand-500/20 text-brand-300 hover:bg-brand-500/30"
            : "text-slate-400 hover:bg-white/5 hover:text-white"
        )}
        aria-label="Notificações"
        aria-expanded={open}
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && <span>{unreadCount}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-surface-border bg-surface-card shadow-card">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <p className="text-sm font-medium text-white">Notificações</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={busy}
                className="text-xs text-brand-400 hover:text-brand-300 disabled:opacity-50"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                Nenhuma notificação.
              </p>
            ) : (
              items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "block w-full border-b border-surface-border/60 px-4 py-3 text-left transition last:border-b-0 hover:bg-white/5",
                    !notification.read && "bg-brand-500/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!notification.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                    )}
                    <div className={cn("min-w-0 flex-1", notification.read && "pl-4")}>
                      <p
                        className={cn(
                          "text-sm",
                          notification.read
                            ? "text-slate-300"
                            : "font-medium text-white"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                        {notification.body}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {format(new Date(notification.createdAt), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
