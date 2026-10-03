"use client";

import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, ArrowRight, Trash2 } from "lucide-react";
import TargetedAccountsCard from "@/components/security/targeted-accounts-card";

export default function AdminPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <DashboardLayout roles={["admin"]}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Administration</h1>
        <p className="text-sm text-muted-foreground">
          Fonctions réservées à l&apos;administrateur : sécurité des comptes et suppression définitive des alertes.
        </p>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Gestion des comptes
            </CardTitle>
            <CardDescription>
              Citoyens, agents et administrateurs : recherche, création, rôle et activation (D08, D09).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:border-primary/50 transition-colors"
            >
              <Users className="size-4 text-primary" />
              <span>Ouvrir la gestion des comptes</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <TargetedAccountsCard />
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trash2 className="size-4 text-destructive" />
              Suppression définitive des alertes
            </CardTitle>
            <CardDescription>
              Seul l&apos;administrateur peut supprimer une alerte du registre (DELETE /alerts/:id).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/agent/alertes"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:border-destructive/50 transition-colors"
            >
              <AlertTriangle className="size-4 text-destructive" />
              <span>Ouvrir le gestionnaire des alertes</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/agent"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:border-primary/50 transition-colors"
        >
          <Users className="size-4 text-primary" />
          <span>Journal des demandes citoyennes</span>
          <ArrowRight className="size-3.5 text-muted-foreground" />
        </Link>
      </div>
    </DashboardLayout>
  );
}
