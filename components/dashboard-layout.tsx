"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Protected from "@/components/protected"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import ModeToggle from "@/components/mode-toggle"
import AccessibilityPanel from "@/components/accessibility-panel"

const SEGMENT_LABEL: Record<string, string> = {
  dashboard: "Vue d'ensemble",
  espace: "Mon espace",
  agent: "Agent",
  annonces: "Annonces",
  admin: "Administration",
}

function useBreadcrumbSegments(): { href: string; label: string }[] {
  const pathname = usePathname()
  const parts = pathname.split("/").filter(Boolean)
  return parts.map((part, i) => ({
    href: `/${parts.slice(0, i + 1).join("/")}`,
    label: SEGMENT_LABEL[part] ?? part,
  }))
}

export default function DashboardLayout({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: ("citizen" | "agent" | "admin")[]
}) {
  const segments = useBreadcrumbSegments()

  return (
    <Protected roles={roles}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-background">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/">Nova Terra</BreadcrumbLink>
                  </BreadcrumbItem>
                  {segments.map((segment, i) => (
                    <React.Fragment key={segment.href}>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        {i === segments.length - 1 ? (
                          <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={segment.href}>{segment.label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-1">
              <AccessibilityPanel />
              <ModeToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </Protected>
  )
}
