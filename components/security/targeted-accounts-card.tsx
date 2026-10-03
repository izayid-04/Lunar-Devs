"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchTargetedAccounts, type TargetedAccount } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { Lock, ShieldCheck } from "lucide-react";

// Partagé entre /agent et /admin : les deux rôles ont accès à
// GET /agent/security/targeted-accounts (F37).
export default function TargetedAccountsCard() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<TargetedAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    fetchTargetedAccounts(token)
      .then(setAccounts)
      .catch((err: Error) => setError(err.message));
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-4 text-destructive" />
          Sécurité — comptes ciblés (F37)
        </CardTitle>
        <CardDescription>
          Comptes ayant subi des tentatives de connexion infructueuses sur les dernières 24 heures.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && accounts === null && (
          <div className="flex justify-center py-6">
            <LoadingSpinner />
          </div>
        )}
        {!error && accounts?.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <ShieldCheck className="mx-auto mb-2 size-8 text-success" />
            Aucune anomalie ni tentative suspecte sur les dernières 24 heures.
          </div>
        )}
        {accounts && accounts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3">Email du compte</th>
                  <th className="p-3">Tentatives échouées</th>
                  <th className="p-3">Dernier échec</th>
                  <th className="p-3">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accounts.map((account) => (
                  <tr key={account.email} className="hover:bg-muted/20">
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
  );
}
