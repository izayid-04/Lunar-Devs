"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

// Renvoie vers le formulaire "Nouveau message" de /espace, réservé aux
// citoyens côté API (POST /messages → 403 pour agent/admin) : le bouton
// ne s'affiche donc que pour ce rôle, comme la prise de rendez-vous.
export default function ContactServiceButton({ serviceName }: { serviceName: string }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <Button asChild variant="outline" className="gap-2">
        <Link href="/connexion">
          <MessageSquare className="size-4" />
          Se connecter pour contacter ce service
        </Link>
      </Button>
    );
  }

  if (user.role !== "citizen") return null;

  return (
    <Button asChild variant="outline" className="gap-2">
      <Link href={`/espace?sujet=${encodeURIComponent(`Au sujet de : ${serviceName}`)}`}>
        <MessageSquare className="size-4" />
        Contacter ce service
      </Link>
    </Button>
  );
}
