"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Users, KeyRound, Lock, AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import { fetchTargetedAccounts, type TargetedAccount } from "@/lib/api";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";

export default function AdminPage() {
  const { user, token } = useAuth();
  const [targetedAccounts, setTargetedAccounts] = useState<TargetedAccount[] | null>(null);
  const [loadingSecurity, setLoadingSecurity] = useState(true);
  const [securityError, setSecurityError] = useState<string | null>(null);

  const loadSecurity = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchTargetedAccounts(token);
      setTargetedAccounts(data);
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Erreur de chargement de l'audit.");
    } finally {
      setLoadingSecurity(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => loadSecurity());
  }, [loadSecurity]);

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
              Sécurité Authentification
            </CardTitle>
            <CardDescription>Audit des connexions 24h (F37)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {targetedAccounts?.length ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Comptes ciblés par des tentatives échouées récentes.
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

      {/* Table d'Audit de Sécurité F37 */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4 text-destructive" />
              Audit de Sécurité — Comptes Ciblés (F37)
            </CardTitle>
            <CardDescription>
              Comptes ayant subi des tentatives de connexion infructueuses sur les dernières 24 heures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSecurity && (
              <div className="flex justify-center py-6">
                <LoadingSpinner />
              </div>
            )}
            {securityError && (
              <p className="text-sm text-destructive">{securityError}</p>
            )}
            {!loadingSecurity && !securityError && targetedAccounts?.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <ShieldCheck className="size-8 text-success mx-auto mb-2" />
                Aucune anomalie ni tentative suspecte sur les dernières 24 heures.
              </div>
            )}
            {!loadingSecurity && targetedAccounts && targetedAccounts.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-3">Email du compte</th>
                      <th className="p-3">Tentatives échouées</th>
                      <th className="p-3">Dernier échec enregistré</th>
                      <th className="p-3">État</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {targetedAccounts.map((account, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="p-3 font-mono font-medium text-foreground">{account.email}</td>
                        <td className="p-3 font-bold text-destructive">{account.failedAttemptsCount}</td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(account.lastFailedAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="p-3">
                          <Badge variant="destructive" className="text-[10px]">
                            {account.failedAttemptsCount >= 5 ? "Verrouillé (15 min)" : "Surveillance"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
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
