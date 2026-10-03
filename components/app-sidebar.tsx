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
} from "lucide-react"

type NavItem = {
  title: string
  url: string
  icon?: React.ReactNode
  items?: { title: string; url: string }[]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const navMainItems: NavItem[] = [
    { title: "Vue d'ensemble", url: "/dashboard", icon: <LayoutDashboardIcon className="size-4" /> },
    { title: "Mon espace", url: "/espace", icon: <UserIcon className="size-4" /> },
    { title: "Services", url: "/districts", icon: <CompassIcon className="size-4" /> },
    { title: "Annonces", url: "/annonces", icon: <MegaphoneIcon className="size-4" /> },
  ]

  if (user?.role === "agent" || user?.role === "admin") {
    navMainItems.push({
      title: "Espace agent",
      url: "/agent",
      icon: <RadioIcon className="size-4" />,
      items: [
        { title: "Journal des demandes", url: "/agent" },
        { title: "Annonces municipales", url: "/agent/annonces" },
      ],
    })
  }

  if (user?.role === "admin") {
    navMainItems.push({ title: "Administration", url: "/admin", icon: <ShieldCheckIcon className="size-4" /> })
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <OrbitIcon className="size-4 text-primary" />
                <span className="font-semibold">Nova Terra</span>
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
