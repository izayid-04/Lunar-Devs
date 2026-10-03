"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShieldAlert,
  Radio,
  ArrowRight,
  ShieldCheck,
  Megaphone,
  AlertTriangle,
  FileText,
  UserCheck,
  Clock,
  CalendarClock,
} from "lucide-react"
import {
  fetchActiveAlerts,
  fetchAnnouncements,
  fetchMyAppointments,
  fetchMyMessages,
  type Alert,
  type Announcement,
  type Appointment,
  type CitizenMessage,
} from "@/lib/api"
import { SEVERITY_BADGE } from "@/lib/alerts"
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner"

export default function DashboardPage() {
  const { user, token } = useAuth()

  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [messages, setMessages] = useState<CitizenMessage[] | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    fetchActiveAlerts(token).then(setAlerts).catch(() => setAlerts([]));
    fetchAnnouncements().then(setAnnouncements).catch(() => setAnnouncements([]));
    if (user?.role === "citizen") {
      fetchMyMessages(token).then(setMessages).catch(() => setMessages([]));
      fetchMyAppointments(token).then(setAppointments).catch(() => setAppointments([]));
    }
  }, [token, user?.role]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  const ongoingCount = messages?.filter((m) => m.status !== "traite").length ?? null;
  const nextAppointment = appointments
    ?.filter((a) => a.status === "confirme" && new Date(a.startsAt) > new Date())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1>Vue d&apos;ensemble</h1>
            {user?.role && (
              <Badge
                variant="outline"
                className={
                  user.role === "admin"
                    ? "border-destructive/40 text-destructive bg-destructive/10 text-xs"
                    : user.role === "agent"
                    ? "border-primary/40 text-primary bg-primary/10 text-xs"
                    : "border-border text-muted-foreground text-xs"
                }
              >
                {user.role === "citizen" ? "Habitant" : user.role === "agent" ? "Agent municipal" : "Administrateur"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Bienvenue, <span className="font-semibold text-foreground">{user?.firstName} {user?.lastName}</span>.
          </p>
        </div>
      </div>

      {/* Raccourcis selon le rôle */}
      {user?.role === "admin" && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-destructive/20">
            <ShieldCheck className="size-5 text-destructive" />
            <h2 className="text-base font-bold text-foreground">Administration</h2>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/admin" className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/80 hover:border-destructive/60 transition-all group">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 text-destructive" />
                <span className="text-xs font-semibold">Administration</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/agent/alertes" className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/80 hover:border-destructive/60 transition-all group">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-4 text-destructive" />
                <span className="text-xs font-semibold">Gestion des alertes</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      )}

      {user?.role === "agent" && (
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-primary/20">
            <Radio className="size-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Poste agent</h2>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/agent" className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/80 hover:border-primary/60 transition-all group">
              <div className="flex items-center gap-2.5">
                <FileText className="size-4 text-primary" />
                <span className="text-xs font-semibold">Traiter les demandes</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/agent/annonces" className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/80 hover:border-primary/60 transition-all group">
              <div className="flex items-center gap-2.5">
                <Megaphone className="size-4 text-primary" />
                <span className="text-xs font-semibold">Créer une annonce</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/agent/alertes" className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/80 hover:border-primary/60 transition-all group">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-4 text-primary" />
                <span className="text-xs font-semibold">Diffuser une alerte</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      )}

      {user?.role === "citizen" && (
        <div className="mt-6 rounded-xl border border-border bg-card/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <UserCheck className="size-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Services aux citoyens</h2>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/espace" className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/60 transition-all group">
              <div className="flex items-center gap-2.5">
                <FileText className="size-4 text-primary" />
                <span className="text-xs font-semibold">Mes démarches</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/districts" className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/60 transition-all group">
              <div className="flex items-center gap-2.5">
                <Radio className="size-4 text-primary" />
                <span className="text-xs font-semibold">Services municipaux</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/alertes" className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/60 transition-all group">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-4 text-primary" />
                <span className="text-xs font-semibold">Alertes</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      )}

      {/* Données réelles : alertes actives, démarches, rendez-vous, annonces */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Alertes actives
            </CardTitle>
            <ShieldAlert className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts === null ? "…" : alerts.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Vous concernant actuellement.</p>
          </CardContent>
        </Card>

        {user?.role === "citizen" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Demandes en cours
              </CardTitle>
              <FileText className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ongoingCount === null ? "…" : ongoingCount}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                <Link href="/espace" className="underline hover:text-primary">Voir mes demandes</Link>
              </p>
            </CardContent>
          </Card>
        )}

        {user?.role === "citizen" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Prochain rendez-vous
              </CardTitle>
              <CalendarClock className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              {appointments === null ? (
                <div className="text-sm text-muted-foreground">…</div>
              ) : nextAppointment ? (
                <>
                  <div className="text-sm font-semibold">
                    {new Date(nextAppointment.startsAt).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(nextAppointment.startsAt).toLocaleTimeString("fr-FR", { timeStyle: "short" })}
                    {nextAppointment.service ? ` — ${nextAppointment.service.name}` : ""}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun rendez-vous prévu.</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Dernière annonce
            </CardTitle>
            <Megaphone className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            {announcements === null ? (
              <div className="text-sm text-muted-foreground">…</div>
            ) : announcements[0] ? (
              <Link href={`/annonces/${announcements[0].id}`} className="text-sm font-medium hover:text-primary line-clamp-2">
                {announcements[0].title}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune annonce.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-destructive" />
              Alertes actives
            </CardTitle>
            <CardDescription>Celles qui vous concernent, les plus récentes d&apos;abord.</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts === null && (
              <div className="flex justify-center py-6"><LoadingSpinner /></div>
            )}
            {alerts?.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucune alerte active.</p>
            )}
            <div className="space-y-2">
              {alerts?.slice(0, 4).map((a) => (
                <Link
                  key={a.id}
                  href={`/alertes/${a.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/80 p-3 hover:border-primary/40"
                >
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">{a.title}</p>
                    <p className="mt-1 text-muted-foreground line-clamp-1">{a.body}</p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-[10px] ${SEVERITY_BADGE[a.severity]}`}>
                    {a.severity}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="size-4 text-primary" />
              Dernières annonces
            </CardTitle>
            <CardDescription>Actualités de la mairie.</CardDescription>
          </CardHeader>
          <CardContent>
            {announcements === null && (
              <div className="flex justify-center py-6"><LoadingSpinner /></div>
            )}
            {announcements?.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucune annonce.</p>
            )}
            <div className="space-y-2">
              {announcements?.slice(0, 4).map((a) => (
                <Link
                  key={a.id}
                  href={`/annonces/${a.id}`}
                  className="flex items-start gap-3 rounded-lg border border-border/80 p-3 hover:border-primary/40"
                >
                  <Clock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">{a.title}</p>
                    <p className="mt-0.5 text-muted-foreground">
                      {new Date(a.publishedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </DashboardLayout>
  )
}
