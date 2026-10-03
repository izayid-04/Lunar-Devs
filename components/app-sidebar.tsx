"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth-context"
import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  OrbitIcon,
  CpuIcon,
  ShieldCheckIcon,
  ActivityIcon,
  CompassIcon,
  RadioIcon,
  WindIcon,
  ZapIcon
} from "lucide-react"

const districtSectors = [
  {
    name: "Dôme Alpha (Capitale)",
    logo: <OrbitIcon className="size-4" />,
    plan: "Cœur Administratif",
  },
  {
    name: "Secteur Solaria",
    logo: <ZapIcon className="size-4" />,
    plan: "Centrale Énergétique",
  },
  {
    name: "Biocentre Nova",
    logo: <WindIcon className="size-4" />,
    plan: "Atmosphère & Ravitaillement",
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const navMainItems = [
    {
      title: "Cockpit & Surveillance",
      url: "/dashboard",
      icon: <ActivityIcon className="size-4" />,
      isActive: true,
      items: [
        { title: "Statut des Systèmes", url: "/dashboard" },
        { title: "Dômes & Atmosphère", url: "/dashboard#domes" },
        { title: "Réseau Énergétique", url: "/dashboard#energy" },
      ],
    },
    {
      title: "Services Municipaux",
      url: "#",
      icon: <CompassIcon className="size-4" />,
      isActive: true,
      items: [
        { title: "Mon Espace Citoyen", url: "/espace" },
        { title: "Démarches & Requêtes", url: "/espace" },
        { title: "Transmissions & Avis", url: "/espace" },
      ],
    },
  ]

  if (user?.role === "agent" || user?.role === "admin") {
    navMainItems.push({
      title: "Poste d'Opérations (Agent)",
      url: "/agent",
      icon: <RadioIcon className="size-4" />,
      isActive: true,
      items: [
        { title: "Journal des Demandes", url: "/agent" },
        { title: "Signalements Prioritaires", url: "/agent" },
      ],
    })
  }

  if (user?.role === "admin") {
    navMainItems.push({
      title: "Console Conseil Suprême",
      url: "/admin",
      icon: <ShieldCheckIcon className="size-4" />,
      isActive: true,
      items: [
        { title: "Gouvernance & Comptes", url: "/admin" },
        { title: "Journal d'Audit Système", url: "/admin" },
      ],
    })
  }

  const projects = [
    {
      name: "Réseau Maglev Urbain",
      url: "/dashboard",
      icon: <CpuIcon className="size-4" />,
    },
    {
      name: "Générateurs à Fusion T-3",
      url: "/dashboard",
      icon: <ZapIcon className="size-4" />,
    },
    {
      name: "Bio-filtres Atmosphère",
      url: "/dashboard",
      icon: <WindIcon className="size-4" />,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={districtSectors} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-1">
          <a
            href="/"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <OrbitIcon className="size-3.5 text-primary" />
            <span className="truncate group-data-[collapsible=icon]:hidden">
              Portail Public Nova Terra ↗
            </span>
          </a>
        </div>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
