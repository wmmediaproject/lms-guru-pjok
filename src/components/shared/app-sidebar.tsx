"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  Award,
  ChevronDown,
  GraduationCap,
  Home,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { KELAS_LIST, SIDEBAR_STORAGE_KEY } from "@/lib/sidebar-utils"

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  namaSekolah?: string | null
  hasServerCookie?: boolean
}

export function AppSidebar({
  namaSekolah,
  hasServerCookie = true,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const { open, setOpen, isMobile, setOpenMobile } = useSidebar()
  const [kelasExpanded, setKelasExpanded] = React.useState(false)

  const didMountRef = React.useRef(false)

  // Restore from localStorage fallback on mount if server cookie was not present,
  // and sync sidebar open state to localStorage on every change
  React.useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      if (!hasServerCookie) {
        try {
          const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
          if (stored === "false" || stored === "true") {
            const restoredOpen = stored === "true"
            if (restoredOpen !== open) {
              setOpen(restoredOpen)
              return
            }
          }
        } catch {
          // Ignore storage errors in restricted environments
        }
      }
    }

    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open))
    } catch {
      // Ignore storage errors
    }
  }, [hasServerCookie, open, setOpen])

  const isHomeActive = pathname === "/"
  const isDashboardActive = pathname === "/dashboard"
  const isKelasActive = pathname.startsWith("/dashboard/kelas")
  const isNilaiActive = pathname.startsWith("/dashboard/nilai")
  const isPengaturanActive = pathname.startsWith("/dashboard/pengaturan")

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/80 py-3 in-data-[mobile=true]:px-3 in-data-[mobile=true]:py-3.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="LMS Guru PJOK"
              className="hover:bg-sidebar-accent in-data-[mobile=true]:h-12 in-data-[mobile=true]:px-2.5"
            >
              <Link href="/dashboard" onClick={handleLinkClick}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
                  <Activity className="size-4" aria-hidden="true" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-heading text-base font-extrabold uppercase tracking-wide">
                    LMS GURU PJOK
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {namaSekolah?.trim() || "Sekolah Dasar (Kelas 1–6)"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground in-data-[mobile=true]:mb-1">
            Menu Utama
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* 0. Beranda */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isHomeActive}
                  tooltip="Beranda"
                  className={cn(
                    isHomeActive &&
                      "bg-primary/15 text-primary font-semibold hover:bg-primary/20 hover:text-primary",
                  )}
                >
                  <Link href="/" onClick={handleLinkClick}>
                    <Home aria-hidden="true" />
                    <span>Beranda</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* 1. Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isDashboardActive}
                  tooltip="Dashboard"
                  className={cn(
                    isDashboardActive &&
                      "bg-primary/15 text-primary font-semibold hover:bg-primary/20 hover:text-primary",
                  )}
                >
                  <Link href="/dashboard" onClick={handleLinkClick}>
                    <LayoutDashboard aria-hidden="true" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* 2. Kelola Kelas + Submenu Kelas 1-6 */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isKelasActive}
                  tooltip="Kelola Kelas"
                  className={cn(
                    isKelasActive &&
                      "bg-primary/15 text-primary font-semibold hover:bg-primary/20 hover:text-primary",
                  )}
                >
                  <Link href="/dashboard/kelas" onClick={handleLinkClick}>
                    <Users aria-hidden="true" />
                    <span>Kelola Kelas</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuAction
                  onClick={() => setKelasExpanded((prev) => !prev)}
                  aria-label={
                    kelasExpanded
                      ? "Sembunyikan daftar kelas"
                      : "Tampilkan daftar kelas"
                  }
                  aria-expanded={kelasExpanded}
                  className="cursor-pointer"
                >
                  <ChevronDown
                    className={cn(
                      "transition-transform duration-200",
                      !kelasExpanded && "-rotate-90",
                    )}
                    aria-hidden="true"
                  />
                </SidebarMenuAction>

                {kelasExpanded && (
                  <SidebarMenuSub>
                    {KELAS_LIST.map((kelas) => {
                      const href = `/dashboard/kelas/${kelas}`
                      const isSubActive = pathname === href
                      return (
                        <SidebarMenuSubItem key={kelas}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubActive}
                            className={cn(
                              isSubActive &&
                                "bg-primary/15 text-primary font-semibold",
                            )}
                          >
                            <Link href={href} onClick={handleLinkClick}>
                              <GraduationCap
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              <span>Kelas {kelas}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {/* 3. Nilai Siswa */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isNilaiActive}
                  tooltip="Nilai Siswa"
                  className={cn(
                    isNilaiActive &&
                      "bg-primary/15 text-primary font-semibold hover:bg-primary/20 hover:text-primary",
                  )}
                >
                  <Link href="/dashboard/nilai" onClick={handleLinkClick}>
                    <Award aria-hidden="true" />
                    <span>Nilai Siswa</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* 4. Pengaturan */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isPengaturanActive}
                  tooltip="Pengaturan"
                  className={cn(
                    isPengaturanActive &&
                      "bg-primary/15 text-primary font-semibold hover:bg-primary/20 hover:text-primary",
                  )}
                >
                  <Link href="/dashboard/pengaturan" onClick={handleLinkClick}>
                    <Settings aria-hidden="true" />
                    <span>Pengaturan</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/80 py-2 in-data-[mobile=true]:px-3 in-data-[mobile=true]:py-2.5">
        <div className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden in-data-[mobile=true]:px-2.5">
          <p className="font-medium text-sidebar-foreground">Panel Guru PJOK</p>
          <p className="truncate text-[11px]">Tahun Ajaran 2026–2027</p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
