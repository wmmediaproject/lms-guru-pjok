"use client"

import * as React from "react"
import type { DashboardKelasRow, Period, Settings } from "@/lib/supabase/types"
import { KartuRingkasan } from "@/features/dashboard/kartu-ringkasan"
import {
  GrafikRataRataKomponen,
  GrafikJenisKelamin,
  GrafikKetuntasan,
} from "@/features/dashboard/grafik-dashboard"
import { DaftarPerluDilengkapi } from "@/features/dashboard/daftar-perlu-dilengkapi"
import { PintasanAksiCepat } from "@/features/dashboard/pintasan-aksi-cepat"
import { PageHeader } from "@/components/shared/page-header"
import { PeriodSelect } from "@/components/shared/period-select"

export interface DashboardViewProps {
  initialRows: DashboardKelasRow[]
  initialPeriods: Period[]
  activePeriodId: string | null
  settings: Settings | null
}

export function DashboardView({
  initialRows,
  initialPeriods,
  activePeriodId,
  settings,
}: DashboardViewProps) {
  // Periode select is display-only here; changing period reloads via server action
  // For now we show the server-rendered data directly (SSR) and let users navigate
  // to /dashboard with ?period=... for period filtering.
  const namaPeriode =
    initialPeriods.find((p) => p.id === activePeriodId)?.nama ??
    "—"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan statistik siswa, ketuntasan nilai, dan kelengkapan pengisian nilai PJOK."
        actions={
          <PeriodSelect
            initialPeriods={initialPeriods}
            fallbackName={namaPeriode}
          />
        }
      />

      {/* Kartu Ringkasan */}
      <KartuRingkasan rows={initialRows} />

      {/* Grafik & Daftar Perlu Dilengkapi */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Grafik kiri (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <GrafikRataRataKomponen rows={initialRows} />
          <GrafikKetuntasan rows={initialRows} />
        </div>

        {/* Panel kanan (1/3) */}
        <div className="space-y-6">
          <GrafikJenisKelamin rows={initialRows} />
          <DaftarPerluDilengkapi rows={initialRows} />
          <PintasanAksiCepat
            periodId={activePeriodId}
            namaPeriode={namaPeriode}
            namaSekolah={settings?.nama_sekolah}
            kkm={settings?.kkm}
          />
        </div>
      </div>
    </div>
  )
}
