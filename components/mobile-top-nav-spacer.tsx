"use client";

import { usePathname } from "next/navigation";

// Réserve la hauteur de la barre de navigation mobile fixée en haut
// (components/dock-nav.tsx) sur les pages publiques, pour que le contenu
// ne démarre pas sous la barre. Les pages du tableau de bord ont déjà
// leur propre en-tête dans le flux normal (components/dashboard-layout.tsx) :
// pas de barre mobile supplémentaire là-bas, donc pas d'espace à réserver.
export default function MobileTopNavSpacer() {
  const pathname = usePathname();
  const isInsideDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/espace") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/admin");

  if (isInsideDashboard) return null;

  return <div className="h-[52px] sm:hidden" aria-hidden="true" />;
}
