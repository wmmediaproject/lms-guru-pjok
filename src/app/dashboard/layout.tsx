import * as React from "react"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { ensureAdminProfile } from "@/lib/supabase/sync-admin-profile"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/shared/app-sidebar"
import { DashboardHeader } from "@/components/shared/dashboard-header"
import { SIDEBAR_STORAGE_KEY, parseSidebarCookie } from "@/lib/sidebar-utils"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get(SIDEBAR_STORAGE_KEY)?.value
  const hasServerCookie = sidebarCookie !== undefined
  const defaultOpen = parseSidebarCookie(sidebarCookie)

  let userEmail: string | null = null
  let namaSekolah: string | null = null
  let activePeriodName: string | null = null

  try {
    const supabase = await createClient()
    await ensureAdminProfile(supabase)

    const [userRes, settingsRes, periodRes] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("settings").select("nama_sekolah").limit(1).maybeSingle(),
      supabase
        .from("periods")
        .select("nama")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ])

    userEmail = userRes.data.user?.email ?? null
    namaSekolah = settingsRes.data?.nama_sekolah ?? null
    activePeriodName = periodRes.data?.nama ?? null
  } catch {
    // Fallback gracefully if database is unreachable or not yet seeded
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        namaSekolah={namaSekolah}
        hasServerCookie={hasServerCookie}
      />
      <SidebarInset>
        <DashboardHeader
          userEmail={userEmail}
          namaSekolah={namaSekolah}
          activePeriodName={activePeriodName}
        />
        <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
