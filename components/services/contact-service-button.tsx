"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MessageSquare } from "lucide-react";
import type { Service } from "@/lib/api";

// Renvoie vers le formulaire "Nouveau message" de /espace, réservé aux
// citoyens côté API (POST /messages → 403 pour agent/admin) : le bouton
// ne s'affiche donc que pour ce rôle, comme la prise de rendez-vous.
export default function ContactServiceButton({ service }: { service: Service }) {
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

  if (service.availability !== "disponible") {
    return (
      <Button variant="outline" className="gap-2 border-destructive/30 text-destructive/80" disabled>
        <AlertTriangle className="size-4" />
        Démarches en ligne suspendues pour ce service
      </Button>
    );
  }

  return (
    <Button asChild variant="outline" className="gap-2">
      <Link href={`/espace?sujet=${encodeURIComponent(`Au sujet de : ${service.name}`)}`}>
        <MessageSquare className="size-4" />
        Contacter ce service
      </Link>
    </Button>
  );
}
