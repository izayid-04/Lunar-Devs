"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Bell, Check, ExternalLink, Loader2, BellRing } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  fetchNotifications,
  markNotificationAsRead,
  type AppNotification,
} from "@/lib/api";
import { notificationHref, notificationTypeLabel } from "@/lib/alerts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Rafraîchissement silencieux : assez rapide pour que le badge et la
// liste reflètent une nouvelle notification sans que l'utilisateur ait
// à recharger la page, sans pour autant appeler l'API en continu.
const POLL_INTERVAL_MS = 20_000;

export default function NotificationBell() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [markingId, setMarkingId] = useState<number | null>(null);
  // Id le plus élevé déjà vu, pour détecter l'arrivée d'une notification
  // réellement nouvelle (et non un simple re-fetch du même contenu).
  const seenMaxId = useRef<number | null>(null);

  const loadNotifications = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!token) return;
      try {
        const data = await fetchNotifications(token);
        setNotifications(data);

        const maxId = data.reduce((max, n) => Math.max(max, n.id), 0);
        if (opts?.silent && seenMaxId.current !== null) {
          const freshOnes = data.filter((n) => n.id > (seenMaxId.current ?? 0) && !n.readAt);
          for (const n of freshOnes.slice(0, 3)) {
            toast(n.title, {
              icon: <BellRing className="size-4" />,
              description: notificationTypeLabel(n.type),
            });
          }
        }
        seenMaxId.current = maxId > 0 ? maxId : seenMaxId.current;
      } catch {
        // Erreur réseau en arrière-plan : on n'interrompt pas l'UI pour ça.
      }
    },
    [token]
  );

  // Changement de compte (déconnexion/reconnexion avec un autre utilisateur
  // dans le même onglet) : on vide immédiatement la liste affichée plutôt
  // que de laisser transparaître les notifications du compte précédent le
  // temps que le nouvel appel réponde.
  useEffect(() => {
    Promise.resolve().then(() => setNotifications([]));
    seenMaxId.current = null;
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let isCancelled = false;

    fetchNotifications(token)
      .then((data) => {
        if (isCancelled) return;
        setNotifications(data);
        seenMaxId.current = data.reduce((max, n) => Math.max(max, n.id), 0);
      })
      .catch(() => {});

    const interval = window.setInterval(() => loadNotifications({ silent: true }), POLL_INTERVAL_MS);
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
            onClick={() => loadNotifications()}
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
            notifications.slice(0, 8).map((n) => {
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
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-primary">
                        {notificationTypeLabel(n.type)}
                      </span>
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

        {notifications.length > 0 && (
          <div className="border-t border-border p-2">
            <Button asChild variant="ghost" size="sm" className="w-full text-xs">
              <Link href="/notifications">Voir toutes mes notifications</Link>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
