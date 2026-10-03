"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bell, Check, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  fetchNotifications,
  markNotificationAsRead,
  type AppNotification,
} from "@/lib/api";
import { notificationHref } from "@/lib/alerts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NotificationBell() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchNotifications(token);
      setNotifications(data);
    } catch {
      // Ignorer l'erreur réseau en arrière-plan pour éviter de bloquer l'UI
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let isCancelled = false;
    fetchNotifications(token)
      .then((data) => {
        if (!isCancelled) setNotifications(data);
      })
      .catch(() => {});

    const interval = window.setInterval(loadNotifications, 60_000);
    return () => {
      isCancelled = true;
      window.clearInterval(interval);
    };
  }, [token, loadNotifications]);

  if (!user || !token) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  async function handleMarkAsRead(e: React.MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    if (!token || markingId) return;
    setMarkingId(id);
    try {
      const updated = await markNotificationAsRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? updated : n))
      );
    } catch {
      // Erreur silencieuse
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative size-9 rounded-full"
          aria-label={
            unreadCount > 0
              ? `Notifications : ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
              : "Notifications : aucune non lue"
          }
        >
          <Bell className="size-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
              <span className="sr-only">notifications non lues</span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={loadNotifications}
          >
            Actualiser
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Aucune notification reçue pour le moment.
            </div>
          ) : (
            notifications.map((n) => {
              const href = notificationHref(n.link);
              const isUnread = !n.readAt;

              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 transition-colors hover:bg-muted/50 ${
                    isUnread ? "bg-primary/5 font-medium" : "text-muted-foreground"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={href}
                      className="block hover:underline"
                    >
                      <p className="text-xs text-foreground line-clamp-2">
                        {n.title}
                      </p>
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </Link>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {isUnread && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 text-muted-foreground hover:text-foreground"
                        onClick={(e) => handleMarkAsRead(e, n.id)}
                        disabled={markingId === n.id}
                        title="Marquer comme lu"
                        aria-label={`Marquer comme lu : ${n.title}`}
                      >
                        {markingId === n.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Check className="size-3" />
                        )}
                      </Button>
                    )}
                    <Link
                      href={href}
                      className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                      aria-label={`Accéder à la ressource : ${n.title}`}
                    >
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
