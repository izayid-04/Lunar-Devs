"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { fetchNotifications, markNotificationAsRead, type AppNotification } from "@/lib/api";
import { notificationHref, notificationTypeLabel } from "@/lib/alerts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { Bell, Check, CheckCheck, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

function NotificationsContent() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    fetchNotifications(token)
      .then(setNotifications)
      .catch((err: Error) => setError(err.message));
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  async function handleMarkAsRead(id: number) {
    if (!token) return;
    setMarkingId(id);
    try {
      const updated = await markNotificationAsRead(token, id);
      setNotifications((prev) => prev?.map((n) => (n.id === id ? updated : n)) ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de marquer comme lu.");
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAllAsRead() {
    if (!token || !notifications) return;
    const unread = notifications.filter((n) => !n.readAt);
    if (unread.length === 0) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map((n) => markNotificationAsRead(token, n.id)));
      load();
      toast.success("Toutes les notifications ont été marquées comme lues.");
    } catch {
      toast.error("Certaines notifications n'ont pas pu être marquées comme lues.");
      load();
    } finally {
      setMarkingAll(false);
    }
  }

  const types = Array.from(new Set((notifications ?? []).map((n) => n.type)));

  const filtered = (notifications ?? []).filter((n) => {
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (readFilter === "unread" && n.readAt) return false;
    if (readFilter === "read" && !n.readAt) return false;
    return true;
  });

  const unreadCount = (notifications ?? []).filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1>Toutes mes notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alertes, annonces, rendez-vous et suivi de vos demandes.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
          >
            {markingAll ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Select value={readFilter} onValueChange={setReadFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="unread">Non lues{unreadCount > 0 ? ` (${unreadCount})` : ""}</SelectItem>
            <SelectItem value="read">Lues</SelectItem>
          </SelectContent>
        </Select>
        {types.length > 1 && (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {notificationTypeLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="mt-6">
        {error && (
          <p role="alert" className="text-center text-sm text-destructive">
            {error}
          </p>
        )}
        {!error && notifications === null && (
          <div role="status" className="flex justify-center py-12">
            <LoadingSpinner />
            <span className="sr-only">Chargement des notifications…</span>
          </div>
        )}
        {!error && notifications !== null && notifications.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto mb-2 size-8 opacity-40" />
            <p>Aucune notification reçue pour le moment.</p>
          </div>
        )}
        {!error && notifications !== null && notifications.length > 0 && filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Aucune notification ne correspond à ce filtre.
          </p>
        )}

        <div className="space-y-2">
          {filtered.map((n) => {
            const href = notificationHref(n.link);
            const isUnread = !n.readAt;
            return (
              <Card key={n.id} className={isUnread ? "border-primary/40 bg-primary/5" : undefined}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <Link href={href} className="min-w-0 flex-1 hover:underline">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {notificationTypeLabel(n.type)}
                      </Badge>
                      {isUnread && (
                        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                      )}
                    </div>
                    <p className={`mt-1 text-sm ${isUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString("fr-FR", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })}
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-1">
                    {isUnread && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        title="Marquer comme lu"
                        aria-label={`Marquer comme lu : ${n.title}`}
                        disabled={markingId === n.id}
                        onClick={() => handleMarkAsRead(n.id)}
                      >
                        {markingId === n.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                      </Button>
                    )}
                    <Button asChild size="icon" variant="ghost" className="size-8">
                      <Link href={href} aria-label={`Accéder à la ressource : ${n.title}`}>
                        <ExternalLink className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <NotificationsContent />
    </DashboardLayout>
  );
}
