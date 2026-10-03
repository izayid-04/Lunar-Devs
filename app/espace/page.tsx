"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Award, FileText, CheckCircle2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  citizen: "Habitant",
  agent: "Agent municipal",
  admin: "Administrateur",
};

export default function EspacePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Espace Citoyen — {user.firstName} {user.lastName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez votre titre de résidence à Nova Terra, vos accès aux districts et vos démarches.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Identité Citoyen */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5 text-primary" />
                  Passeport Citoyen Nova Terra
                </CardTitle>
                <CardDescription>
                  Identifiant biométrique et données du registre municipal.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary">
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3.5">
                <span className="text-xs text-muted-foreground">Nom officiel</span>
                <p className="text-base font-semibold">{user.firstName} {user.lastName}</p>
              </div>

              <div className="rounded-lg border border-border p-3.5">
                <span className="text-xs text-muted-foreground">Canal de contact</span>
                <p className="text-base font-semibold">{user.email}</p>
              </div>

              <div className="rounded-lg border border-border p-3.5">
                <span className="text-xs text-muted-foreground">Secteur assigné</span>
                <p className="text-base font-semibold">Dôme Alpha — Quartier Résidentiel</p>
              </div>

              <div className="rounded-lg border border-border p-3.5">
                <span className="text-xs text-muted-foreground">Identifiant Unique (UUID)</span>
                <p className="font-mono text-xs text-muted-foreground truncate">{user.id}</p>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-border p-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-success" />
                <div>
                  <p className="text-sm font-medium">Statut de Résidence Valide</p>
                  <p className="text-xs text-muted-foreground">
                    Accès illimité aux sas de transit Maglev et au système de santé du Dôme Alpha.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accès Rapides */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="size-4 text-primary" />
                Quota Citoyen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Quota Énergie (Mensuel)</span>
                  <span className="font-semibold text-foreground">320 / 500 kWh</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-[64%] rounded-full bg-primary" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Crédits de Transport Maglev</span>
                  <span className="font-semibold text-foreground">45 / 50 trajets</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-[90%] rounded-full bg-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                Démarches Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-xs">
                Demander un permis de déplacement Dôme Beta
              </Button>
              <Button variant="outline" className="w-full justify-start text-xs">
                Déclarer un incident de pressurisation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
