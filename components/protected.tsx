"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/api";

// Expérience uniquement : redirige si pas connecté / mauvais rôle.
// La vraie protection (403/401) est assurée par l'API, pas par ce composant.
export default function Protected({
  roles,
  children,
}: {
  roles?: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = !!user && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/connexion?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace("/espace");
    }
  }, [loading, user, roles, router, pathname]);

  if (loading) {
    return (
      <p className="text-muted-foreground px-6 py-16 text-center">
        Chargement…
      </p>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
