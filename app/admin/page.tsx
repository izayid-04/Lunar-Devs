"use client";

import Protected from "@/components/protected";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";

function AdminContent() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold">Espace administrateur</h1>
      <p className="mt-1 text-muted-foreground">
        Bonjour {user.firstName}, cet espace est réservé aux
        administrateurs.
      </p>
      <Card className="mt-8">
        <CardContent className="text-sm text-muted-foreground">
          Les fonctions sensibles (gestion des comptes, des rôles, etc.)
          viendront ici.
        </CardContent>
      </Card>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Protected roles={["admin"]}>
      <AdminContent />
    </Protected>
  );
}
