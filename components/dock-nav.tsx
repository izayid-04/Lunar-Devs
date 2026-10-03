"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Info,
  LogIn,
  LogOut,
  LayoutDashboard,
  User,
  Satellite,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ModeToggle from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

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
        role="tooltip"
        className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 scale-90 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-sm transition-all duration-150 group-hover:scale-100 group-hover:opacity-100"
      >
        {item.label}
      </span>
    </span>
  );

  if (item.href) {
    return (
      <Link href={item.href} aria-label={item.label} className="group">
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={item.onClick}
      aria-label={item.label}
      className="group"
    >
      {content}
    </button>
  );
}

export default function DockNav() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  // On cache le dock du bas UNIQUEMENT quand on se trouve à l'intérieur du dashboard
  const isInsideDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/espace") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/admin");

  if (isInsideDashboard) {
    return null;
  }

  const items: Item[] = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/a-propos", label: "À propos", icon: Info },
  ];

  if (!loading) {
    if (user) {
      items.push({ href: "/dashboard", label: "Cockpit", icon: LayoutDashboard });
      items.push({ href: "/espace", label: "Mon espace", icon: User });
      if (user.role === "agent" || user.role === "admin") {
        items.push({ href: "/agent", label: "Agent", icon: Satellite });
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

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
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
        <ModeToggle />
      </div>
    </nav>
  );
}
