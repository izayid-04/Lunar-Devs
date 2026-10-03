"use client";

import Protected from "@/components/protected";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ROLE_LABELS: Record<string, string> = {
  citizen: "Habitant",
  agent: "Agent municipal",
  admin: "Administrateur",
};

function EspaceContent() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1>Bonjour {user.firstName} 👋</h1>
      <p className="mt-1 text-muted-foreground">
        Voici votre espace personnel sur la plateforme de Nova Terra.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Mon profil</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Nom</dt>
            <dd>
              {user.firstName} {user.lastName}
            </dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user.email}</dd>
            <dt className="text-muted-foreground">Profil</dt>
            <dd>
              <Badge variant="secondary">
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
            </dd>
          </dl>
        </CardContent>
      </Card>
    </main>
  );
}

export default function EspacePage() {
  return (
    <Protected>
      <EspaceContent />
    </Protected>
  );
}
