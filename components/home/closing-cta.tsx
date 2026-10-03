"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export default function ClosingCta() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      {user ? (
        <Button asChild>
          <Link href="/dashboard">Accéder au Cockpit Urbain</Link>
        </Button>
      ) : (
        <Button asChild>
          <Link href="/inscription">Créer mon compte</Link>
        </Button>
      )}
    </div>
  );
}
