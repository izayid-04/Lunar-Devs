"use client";

import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Users, AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import TargetedAccountsCard from "@/components/security/targeted-accounts-card";

export default function AdminPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <DashboardLayout roles={["admin"]}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-destructive border-destructive/40 bg-destructive/5 gap-1.5">
              <ShieldCheck className="size-3" />
              Privilèges Administrateur Suprême (Niveau 3)
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl mt-1">
            Console d&apos;Administration Municipale
          </h1>
          <p className="text-sm text-muted-foreground">
            Surveillance d&apos;intégrité, audit des tentatives d&apos;intrusion et autorisations exclusives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            HODI-NODE-SOL04 • ACTIF
          </Badge>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Registre des Comptes
            </CardTitle>
            <CardDescription>Citoyens & Agents déclarés</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1 248</p>
            <p className="text-xs text-muted-foreground mt-1">
              Contrôle des privilèges d&apos;accès aux districts spatiaux.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="size-4 text-destructive" />
              Privilèges Exclusifs
            </CardTitle>
            <CardDescription>Droit de suppression d&apos;alertes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">Autorisé</p>
            <p className="text-xs text-muted-foreground mt-1">
              L&apos;admin peut supprimer définitivement des alertes du registre.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <TargetedAccountsCard />
      </div>

      {/* Raccourcis Administratifs */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/agent/alertes"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:border-destructive/50 transition-colors"
        >
          <AlertTriangle className="size-4 text-destructive" />
          <span>Gestionnaire des Alertes</span>
          <ArrowRight className="size-3.5 text-muted-foreground" />
        </Link>
        <Link
          href="/agent"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:border-primary/50 transition-colors"
        >
          <Users className="size-4 text-primary" />
          <span>Journal des Demandes Citoyennes</span>
          <ArrowRight className="size-3.5 text-muted-foreground" />
        </Link>
      </div>
    </DashboardLayout>
  );
}
