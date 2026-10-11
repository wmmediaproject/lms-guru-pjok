import type { Metadata } from "next"
import { fetchDashboardData } from "@/features/dashboard/actions"
import { DashboardView } from "@/features/dashboard/dashboard-view"

export const metadata: Metadata = {
  title: "Dashboard — LMS Guru PJOK",
}

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { rows, activePeriodId, periods, settings } = await fetchDashboardData()

  return (
    <DashboardView
      initialRows={rows}
      initialPeriods={periods}
      activePeriodId={activePeriodId}
      settings={settings}
    />
  )
}
