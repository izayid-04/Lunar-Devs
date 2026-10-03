"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Users, KeyRound, Lock } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <DashboardLayout roles={["admin"]}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary/40 gap-1.5">
            <ShieldCheck className="size-3" />
            Haut Conseil de Nova Terra
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Console Administrateur Suprême
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestion des autorisations de niveau 3, cryptocésium et gouvernance municipale.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              <KeyRound className="size-4 text-primary" />
              Politique de Sécurité
            </CardTitle>
            <CardDescription>Chiffrement quantique RSA-4096</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">Actif</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tous les protocoles d&apos;authentification NestJS sont synchronisés.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              Audit & Journaux
            </CardTitle>
            <CardDescription>Traçabilité des accès</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0 Alerte</p>
            <p className="text-xs text-muted-foreground mt-1">
              Aucune tentative d&apos;intrusion non autorisée détectée.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
