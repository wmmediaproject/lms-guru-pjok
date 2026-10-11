"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, LogOut, School, Settings, User } from "lucide-react"

import { keluarAction } from "@/app/masuk/actions"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { getBreadcrumbItems } from "@/lib/sidebar-utils"

export interface DashboardHeaderProps {
  userEmail?: string | null
  namaSekolah?: string | null
  activePeriodName?: string | null
  periodSlot?: React.ReactNode
}

export function DashboardHeader({
  userEmail,
  namaSekolah,
  activePeriodName,
  periodSlot,
}: DashboardHeaderProps) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbItems(pathname)
  const [isLoggingOut, startTransition] = React.useTransition()

  const handleKeluar = () => {
    startTransition(async () => {
      await keluarAction()
    })
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-background/95 px-3 sm:px-6 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger
          aria-label="Alihkan bilah sisi"
          className="cursor-pointer"
        />
        <Separator
          orientation="vertical"
          className="mr-1 data-[orientation=vertical]:h-4"
        />

        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            {breadcrumbs.map((item, idx) => (
              <React.Fragment key={item.href}>
                {idx > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
                <BreadcrumbItem
                  className={
                    !item.isCurrent ? "hidden sm:inline-flex" : "inline-flex"
                  }
                >
                  {item.isCurrent ? (
                    <BreadcrumbPage className="truncate font-semibold">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {namaSekolah?.trim() && (
          <Badge
            variant="secondary"
            className="ml-2 hidden lg:inline-flex items-center gap-1.5 font-medium"
          >
            <School className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span className="max-w-48 truncate">{namaSekolah.trim()}</span>
          </Badge>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Slot Pemilih Periode (diisi komponen PeriodSelect pada Fase 3) */}
        <div data-slot="period-selector-slot" className="flex items-center">
          {periodSlot ?? (
            <Badge
              variant="outline"
              className="flex items-center gap-1.5 border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-foreground"
              aria-label="Periode aktif saat ini"
            >
              <CalendarDays
                className="h-3.5 w-3.5 text-primary shrink-0"
                aria-hidden="true"
              />
              <span className="max-w-36 sm:max-w-none truncate">
                {activePeriodName || "Semester Ganjil 2026-2027"}
              </span>
            </Badge>
          )}
        </div>

        <ThemeToggle />

        {/* Menu Pengguna + Keluar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Menu pengguna"
              className="cursor-pointer"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Menu Pengguna</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
                  Admin Guru PJOK
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {userEmail || "admin@sekolah.sch.id"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link
                href="/dashboard/pengaturan"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span>Pengaturan</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={isLoggingOut}
              onClick={handleKeluar}
              className="cursor-pointer"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
