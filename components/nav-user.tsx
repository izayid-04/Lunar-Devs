"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, BadgeCheckIcon, BellIcon, LogOutIcon, ShieldIcon } from "lucide-react"

export function NavUser({
  user: initialUser,
}: {
  user?: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { user, logout } = useAuth()
  const router = useRouter()

  const displayName = user ? `${user.firstName} ${user.lastName}` : (initialUser?.name ?? "Habitant")
  const displayEmail = user?.email ?? initialUser?.email ?? "citoyen@novaterra.sol"
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "NT"

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={initialUser?.avatar || ""} alt={displayName} />
                <AvatarFallback className="rounded-lg bg-primary/20 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={initialUser?.avatar || ""} alt={displayName} />
                  <AvatarFallback className="rounded-lg bg-primary/20 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/espace")}>
                <BadgeCheckIcon className="size-4" />
                Mon Profil Citoyen
              </DropdownMenuItem>
              {user?.role && user.role !== "citizen" && (
                <DropdownMenuItem onClick={() => router.push(`/${user.role}`)}>
                  <ShieldIcon className="size-4" />
                  Console {user.role === "admin" ? "Admin" : "Agent"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <BellIcon className="size-4" />
                Transmissions
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOutIcon className="size-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
