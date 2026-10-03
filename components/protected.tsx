"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/api";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";

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
      <div
        role="status"
        className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center"
      >
        <LoadingSpinner />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
