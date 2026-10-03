"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  OrbitIcon,
  ShieldCheckIcon,
  LayoutDashboardIcon,
  UserIcon,
  CompassIcon,
  MegaphoneIcon,
  RadioIcon,
  AlertTriangleIcon,
  RocketIcon,
} from "lucide-react"

import { usePathname } from "next/navigation"

type NavItem = {
  title: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
  items?: { title: string; url: string; isActive?: boolean }[]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const pathname = usePathname()

  const isStaff = user?.role === "agent" || user?.role === "admin"

  const navMainItems: NavItem[] = isStaff
    ? [
        {
          title: "Vue d'ensemble",
          url: "/dashboard",
          icon: <LayoutDashboardIcon className="size-4" />,
          isActive: pathname === "/dashboard",
        },
        {
          title: "Espace agent",
          url: "/agent",
          icon: <RadioIcon className="size-4" />,
          isActive: pathname.startsWith("/agent"),
          items: [
            {
              title: "Journal des demandes",
              url: "/agent",
              isActive: pathname === "/agent",
            },
            {
              title: "Gestion des annonces",
              url: "/agent/annonces",
              isActive: pathname.startsWith("/agent/annonces"),
            },
            {
              title: "Gestion des alertes",
              url: "/agent/alertes",
              isActive: pathname.startsWith("/agent/alertes"),
            },
            {
              title: "Historique des actions",
              url: "/agent/audit-logs",
              isActive: pathname.startsWith("/agent/audit-logs"),
            },
            {
              title: "Demandes RGPD",
              url: "/agent/privacy",
              isActive: pathname.startsWith("/agent/privacy"),
            },
            {
              title: "Gestion des citoyens",
              url: "/agent/citizens",
              isActive: pathname.startsWith("/agent/citizens"),
            },
            {
              title: "Rendez-vous du service",
              url: "/agent/appointments",
              isActive: pathname.startsWith("/agent/appointments"),
            },
          ],
        },
        {
          title: "Mon profil citoyen",
          url: "/espace",
          icon: <UserIcon className="size-4" />,
          isActive: pathname === "/espace",
        },
        {
          title: "Annuaire des services",
          url: "/districts",
          icon: <CompassIcon className="size-4" />,
          isActive: pathname.startsWith("/districts") || pathname.startsWith("/services"),
        },
        {
          title: "Transports & Liaisons",
          url: "/agent/transports",
          icon: <RocketIcon className="size-4" />,
          isActive: pathname.startsWith("/agent/transports") || pathname === "/transports",
        },
        {
          title: "Portail des alertes",
          url: "/alertes",
          icon: <AlertTriangleIcon className="size-4" />,
          isActive: pathname.startsWith("/alertes"),
        },
      ]
    : [
        {
          title: "Vue d'ensemble",
          url: "/dashboard",
          icon: <LayoutDashboardIcon className="size-4" />,
          isActive: pathname === "/dashboard",
        },
        {
          title: "Mon espace citoyen",
          url: "/espace",
          icon: <UserIcon className="size-4" />,
          isActive: pathname === "/espace",
        },
        {
          title: "Services municipaux",
          url: "/districts",
          icon: <CompassIcon className="size-4" />,
          isActive: pathname.startsWith("/districts") || pathname.startsWith("/services"),
        },
        {
          title: "Transports en commun",
          url: "/transports",
          icon: <RocketIcon className="size-4" />,
          isActive: pathname.startsWith("/transports"),
        },
        {
          title: "Annonces",
          url: "/annonces",
          icon: <MegaphoneIcon className="size-4" />,
          isActive: pathname.startsWith("/annonces"),
        },
        {
          title: "Alertes",
          url: "/alertes",
          icon: <AlertTriangleIcon className="size-4" />,
          isActive: pathname.startsWith("/alertes"),
        },
      ]

  if (user?.role === "admin") {
    navMainItems.push({
      title: "Administration",
      url: "/admin",
      icon: <ShieldCheckIcon className="size-4" />,
      isActive: pathname.startsWith("/admin"),
    })
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="default" asChild tooltip="Nova Terra">
              <Link href="/" className="flex items-center gap-2">
                <OrbitIcon className="size-4 text-primary shrink-0" />
                <span className="font-semibold truncate group-data-[collapsible=icon]:hidden">Nova Terra</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-1">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <span className="truncate group-data-[collapsible=icon]:hidden">
              Portail public ↗
            </span>
          </Link>
        </div>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
