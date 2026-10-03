"use client"

import { usePathname } from "next/navigation"
import { StackedCircularFooter } from "@/components/ui/stacked-circular-footer"

export default function PublicFooter() {
  const pathname = usePathname()

  const isConnectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/espace") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/admin")

  if (isConnectedRoute) {
    return null
  }

  return <StackedCircularFooter />
}
