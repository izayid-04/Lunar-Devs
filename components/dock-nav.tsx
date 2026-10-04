"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Info,
  LogIn,
  LogOut,
  LayoutDashboard,
  Satellite,
  ShieldCheck,
  UserPlus,
  Compass,
  Megaphone,
  Siren,
  Building2,
  HeartHandshake,
  ChevronUp,
  ChevronDown,
  Menu,
  Orbit,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ModeToggle from "@/components/mode-toggle";
import AccessibilityPanel from "@/components/accessibility-panel";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type Item = {
  href?: string;
  label: string;
  icon: typeof Home;
  onClick?: () => void;
};

function DockItem({ item, active }: { item: Item; active: boolean }) {
  const content = (
    <span
      className={cn(
        "relative flex size-10 items-center justify-center rounded-full transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="size-[18px]" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 scale-90 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-sm transition-all duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
      >
        {item.label}
      </span>
    </span>
  );

  // F41 : focus clavier bien visible sur chaque entrée du dock ; le libellé
  // s'affiche aussi au focus (pas seulement au survol).
  const focusRing =
    "group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  if (item.href) {
    return (
      <Link
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        className={focusRing}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={item.onClick}
      aria-label={item.label}
      className={focusRing}
    >
      {content}
    </button>
  );
}

// Liste verticale des items de navigation, utilisée dans le volet mobile
// (Sheet) aussi bien hors tableau de bord que dans le tableau de bord —
// un menu horizontal de 9-10 icônes ne tient pas sur un écran de téléphone.
function MobileNavItems({ items, pathname }: { items: Item[]; pathname: string }) {
  return (
    <>
      {items.map((item) => {
        const active = !!item.href && pathname === item.href;
        const itemClassName = cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
        );
        return item.href ? (
          <SheetClose key={item.label} asChild>
            <Link href={item.href} className={itemClassName} aria-current={active ? "page" : undefined}>
              <item.icon className="size-[18px]" aria-hidden="true" />
              {item.label}
            </Link>
          </SheetClose>
        ) : (
          <SheetClose key={item.label} asChild>
            <button type="button" onClick={item.onClick} className={itemClassName}>
              <item.icon className="size-[18px]" aria-hidden="true" />
              {item.label}
            </button>
          </SheetClose>
        );
      })}
      <div className="mt-2 flex items-center gap-2 border-t border-border pt-3">
        <AccessibilityPanel />
        <ModeToggle />
      </div>
    </>
  );
}

export default function DockNav() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dans le dashboard, le dock est rétractable (minimisé par défaut pour laisser place à la sidebar)
  const isInsideDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/espace") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/admin");

  const [isExpandedInDashboard, setIsExpandedInDashboard] = useState(false);

  const items: Item[] = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/districts", label: "Services", icon: Compass },
    { href: "/projets", label: "Projets", icon: Building2 },
    { href: "/partenaires", label: "Partenaires", icon: HeartHandshake },
    { href: "/annonces", label: "Annonces", icon: Megaphone },
    { href: "/alertes", label: "Alertes", icon: Siren },
    { href: "/a-propos", label: "À propos", icon: Info },
  ];

  if (!loading) {
    if (user) {
      items.push({ href: "/espace", label: "Mon espace", icon: LayoutDashboard });
      if (user.role === "agent" || user.role === "admin") {
        items.push({ href: "/agent", label: "Espace agent", icon: Satellite });
      }
      if (user.role === "admin") {
        items.push({ href: "/admin", label: "Admin", icon: ShieldCheck });
      }
      items.push({
        label: "Déconnexion",
        icon: LogOut,
        onClick: () => logout(),
      });
    } else {
      items.push({ href: "/connexion", label: "Connexion", icon: LogIn });
      items.push({ href: "/inscription", label: "Inscription", icon: UserPlus });
    }
  }

  // CAS DASHBOARD : sur mobile, un bouton fixé en bas ouvre un volet
  // vertical (le dock horizontal de 9-10 icônes déborde sur un écran de
  // téléphone) ; sur tablette/desktop, mini-bouton rétractable habituel.
  if (isInsideDashboard) {
    return (
      <>
        {/* Mobile (< sm) : bouton en bas, volet vertical */}
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center sm:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-full border border-border/80 bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-md transition-all hover:bg-card hover:text-foreground hover:border-primary/50"
              >
                <Menu className="size-3.5 text-primary" aria-hidden="true" />
                <span>Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav aria-label="Navigation rapide" className="flex flex-col gap-1 px-4 pb-4">
                <MobileNavItems items={items} pathname={pathname} />
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Tablette/desktop (≥ sm) : mini-bouton rétractable avec flèche */}
        <aside
          aria-label="Navigation rapide"
          className="fixed inset-x-0 bottom-4 z-50 hidden flex-col items-center pointer-events-none sm:flex"
        >
          <AnimatePresence>
            {isExpandedInDashboard && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto mb-2 flex items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-md"
              >
                {items.map((item) => (
                  <DockItem
                    key={item.label}
                    item={item}
                    active={!!item.href && pathname === item.href}
                  />
                ))}
                <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
                <AccessibilityPanel />
                <ModeToggle />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bouton flèche flottant pour ouvrir / fermer le menu */}
          <button
            type="button"
            onClick={() => setIsExpandedInDashboard((prev) => !prev)}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border/80 bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-md transition-all hover:bg-card hover:text-foreground hover:border-primary/50 group"
            title={isExpandedInDashboard ? "Replier le menu" : "Afficher le menu de navigation"}
          >
            {isExpandedInDashboard ? (
              <>
                <ChevronDown className="size-3.5 text-primary transition-transform group-hover:translate-y-0.5" />
                <span>Masquer</span>
              </>
            ) : (
              <>
                <ChevronUp className="size-3.5 text-primary transition-transform group-hover:-translate-y-0.5" />
                <span>Menu</span>
              </>
            )}
          </button>
        </aside>
      </>
    );
  }

  // CAS HORS DASHBOARD (pages publiques) : dock flottant en bas sur
  // grand écran, menu en haut (bouton + volet) sur mobile — un dock de
  // 9 icônes ne tient pas sur un écran de téléphone sans défilement.
  return (
    <>
      {/* Mobile (< sm) : barre fixée en haut */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-[52px] items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md sm:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Nova Terra — Accueil"
        >
          <Orbit className="size-5 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold">Nova Terra</span>
        </Link>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="size-4" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <nav aria-label="Navigation principale" className="flex flex-col gap-1 px-4 pb-4">
              <MobileNavItems items={items} pathname={pathname} />
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop/tablette (≥ sm) : dock flottant en bas */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-4 z-50 hidden justify-center px-4 sm:flex"
      >
        <div className="flex items-center gap-1 rounded-full border border-border bg-card/90 p-1.5 shadow-lg backdrop-blur-md">
          {items.map((item) => (
            <DockItem
              key={item.label}
              item={item}
              active={!!item.href && pathname === item.href}
            />
          ))}
          <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
          <AccessibilityPanel />
          <ModeToggle />
        </div>
      </nav>
    </>
  );
}
