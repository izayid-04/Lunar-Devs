"use client"

import React, { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Zap,
  Wind,
  ShieldAlert,
  Users,
  Radio,
  ArrowUpRight,
  RefreshCw,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react"
import AccessibleTerm from "@/components/ui/accessible-term"

export default function DashboardPage() {
  const { user } = useAuth()
  const [purifying, setPurifying] = useState(false)
  const [purifyCount, setPurifyCount] = useState(99.4)

  const handlePurify = () => {
    setPurifying(true)
    setTimeout(() => {
      setPurifying(false)
      setPurifyCount(99.9)
    }, 1200)
  }

  return (
    <DashboardLayout>
      {/* Salutation & Status header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Console de Contrôle — Nova Terra
            </h1>
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
                {user.role === "citizen"
                  ? "Habitant"
                  : user.role === "agent"
                  ? "Agent Municipal"
                  : "Administrateur"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Bienvenue, <span className="font-semibold text-foreground">{user?.firstName} {user?.lastName}</span>. Surveillance orbitale et gestion municipale en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-3 py-1 font-mono text-xs">
            <span className="size-2 rounded-full bg-primary animate-ping" />
            CYCLE SOLAIRE 14.8
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePurify}
            disabled={purifying}
            className="gap-2"
          >
            <RefreshCw className={`size-3.5 ${purifying ? "animate-spin" : ""}`} />
            Recalibrer capteurs
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Qualité Atmosphérique
            </CardTitle>
            <Wind className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purifyCount}%</div>
            <p className="mt-1 flex items-center text-xs text-success">
              <ArrowUpRight className="mr-1 size-3.5" />
              +0.3% O₂ recyclé via biogerme
            </p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${purifyCount}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Réseau Électrique Fusion
            </CardTitle>
            <Zap className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.28 GW</div>
            <p className="mt-1 flex items-center text-xs text-muted-foreground">
              Capacité totale: 5.00 GW (85% charge)
            </p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 w-[85%] rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Dôme et Bouclier Défensif
            </CardTitle>
            <ShieldAlert className="size-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100% Intègre</div>
            <p className="mt-1 flex items-center text-xs text-success">
              <CheckCircle2 className="mr-1 size-3.5" />
              0 brèche micrométéorite
            </p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 w-full rounded-full bg-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Citoyens Enregistrés
            </CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48 920</div>
            <p className="mt-1 flex items-center text-xs text-muted-foreground">
              +142 nouveaux arrivants ce cycle
            </p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 w-[76%] rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Districts & Live Communications */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* District Status Card (Span 2) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Secteurs Urbains & Surveillance des Dômes</CardTitle>
                <CardDescription>
                  Télémétrie en temps réel des infrastructures modulaires de Nova Terra.
                </CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                <Sparkles className="size-3" />
                Dômes Actifs
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-primary/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Dôme Alpha</span>
                  <Badge className="bg-success text-success-foreground text-[10px] px-1.5 py-0">Nominal</Badge>
                </div>
                <div className="mt-2 text-lg font-bold">Cœur Urbain</div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Pression: 1013 hPa</span>
                  <span>Pop: 24.1k</span>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-primary/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Dôme Beta</span>
                  <Badge className="bg-success text-success-foreground text-[10px] px-1.5 py-0">Nominal</Badge>
                </div>
                <div className="mt-2 text-lg font-bold">Bio-Agri & Serres</div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Hydro: 78%</span>
                  <span>Pop: 8.4k</span>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-primary/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Dôme Gamma</span>
                  <Badge variant="secondary" className="text-primary text-[10px] px-1.5 py-0">Maintenance</Badge>
                </div>
                <div className="mt-2 text-lg font-bold">Port Spatial & Fret</div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Sas: Calibré</span>
                  <span>Pop: 16.4k</span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Distribution de la Grille d&apos;Énergie Solaire</span>
                <span className="text-xs font-mono text-muted-foreground">Rendement : 94.2%</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>
                      Secteur Résidentiel (<AccessibleTerm term="Dôme" definition="Structure pressurisée transparente abritant un quartier de la colonie." /> Alpha)
                    </span>
                    <span>42%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 w-[42%] rounded-full bg-primary" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Systèmes de Support de Vie (Atmosphère & Eau)</span>
                    <span>38%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 w-[38%] rounded-full bg-primary/70" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>
                      <AccessibleTerm term="Maglev" definition="Train à sustentation magnétique reliant les quartiers à grande vitesse." /> & Propulseurs Portuaires
                    </span>
                    <span>14%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 w-[14%] rounded-full bg-primary/40" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live municipal transmissions & alerts */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Radio className="size-4 text-primary" />
                Annonces et alertes municipales
              </CardTitle>
              <Badge variant="secondary" className="text-xs">Direct</Badge>
            </div>
            <CardDescription>
              Flux des informations prioritaires diffusées par les services.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-border/80 p-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Flame className="size-4" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Éruptions Solaires détectées</span>
                  <span className="text-[10px] text-muted-foreground">Il y a 4m</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Bouclier magnétique commuté en mode haute densité. Aucune interruption Maglev.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/80 p-3">
              <div className="rounded-full bg-success/10 p-2 text-success">
                <CheckCircle2 className="size-4" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Sas Nord réouvert</span>
                  <span className="text-[10px] text-muted-foreground">Il y a 18m</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Cycle de dépressurisation terminé avec succès au terminal fret Alpha.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/80 p-3">
              <div className="rounded-full bg-muted p-2 text-muted-foreground">
                <Clock className="size-4" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Recalibrage Nocturne</span>
                  <span className="text-[10px] text-muted-foreground">Prévu 22:00</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Ajustement des cycles de photopériode dans les serres hydroponiques.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="outline" className="w-full text-xs" asChild>
                <a href="/espace">Accéder à mes démarches citoyennes</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
