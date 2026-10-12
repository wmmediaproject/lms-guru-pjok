"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useActivePeriod } from "@/hooks/use-periods"
import { KELAS_LIST } from "@/lib/sidebar-utils"
import type { DashboardKelasRow, Grade, Period, Settings, Student } from "@/lib/supabase/types"
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

function hitungAgregasiKlien(
  students: Student[],
  grades: Grade[],
): DashboardKelasRow[] {
  const activeStudents = students.filter((s) => s.status !== "lulus")
  const gradeByStudentId = new Map<string, Grade>()
  for (const g of grades) {
    gradeByStudentId.set(g.student_id, g)
  }

  return KELAS_LIST.map((kelas) => {
    const siswaKelas = activeStudents.filter((s) => s.kelas === kelas)
    const total_aktif = siswaKelas.length
    const total_laki = siswaKelas.filter((s) => s.jenis_kelamin === "L").length
    const total_perempuan = siswaKelas.filter((s) => s.jenis_kelamin === "P").length

    let jumlah_lengkap = 0
    let sumPraktek = 0
    let countPraktek = 0
    let sumUh = 0
    let countUh = 0
    let sumAsts = 0
    let countAsts = 0
    let sumAsas = 0
    let countAsas = 0
    let sumNilaiAkhir = 0
    let countNilaiAkhir = 0
    let jumlah_tuntas = 0
    let jumlah_belum_tuntas = 0

    for (const s of siswaKelas) {
      const g = gradeByStudentId.get(s.id)
      if (g) {
        if (g.nilai_akhir !== null && g.nilai_akhir !== undefined) {
          jumlah_lengkap++
          sumNilaiAkhir += g.nilai_akhir
          countNilaiAkhir++
        }
        if (g.nilai_praktek !== null && g.nilai_praktek !== undefined) {
          sumPraktek += g.nilai_praktek
          countPraktek++
        }
        if (g.nilai_uh !== null && g.nilai_uh !== undefined) {
          sumUh += g.nilai_uh
          countUh++
        }
        if (g.nilai_asts !== null && g.nilai_asts !== undefined) {
          sumAsts += g.nilai_asts
          countAsts++
        }
        if (g.nilai_asas !== null && g.nilai_asas !== undefined) {
          sumAsas += g.nilai_asas
          countAsas++
        }
        if (g.predikat === "Tuntas") jumlah_tuntas++
        if (g.predikat === "Belum Tuntas") jumlah_belum_tuntas++
      }
    }

    return {
      kelas,
      total_aktif,
      total_laki,
      total_perempuan,
      jumlah_lengkap,
      jumlah_belum: total_aktif - jumlah_lengkap,
      avg_praktek:
        countPraktek > 0 ? Math.round((sumPraktek / countPraktek) * 100) / 100 : 0,
      avg_uh:
        countUh > 0 ? Math.round((sumUh / countUh) * 100) / 100 : 0,
      avg_asts:
        countAsts > 0 ? Math.round((sumAsts / countAsts) * 100) / 100 : 0,
      avg_asas:
        countAsas > 0 ? Math.round((sumAsas / countAsas) * 100) / 100 : 0,
      avg_nilai_akhir:
        countNilaiAkhir > 0
          ? Math.round((sumNilaiAkhir / countNilaiAkhir) * 100) / 100
          : 0,
      jumlah_tuntas,
      jumlah_belum_tuntas,
    }
  })
}

export function DashboardView({
  initialRows,
  initialPeriods,
  activePeriodId,
  settings,
}: DashboardViewProps) {
  const { selectedPeriod, selectedPeriodId } = useActivePeriod(initialPeriods)
  const effectivePeriodId = selectedPeriodId ?? activePeriodId

  const dashboardQuery = useQuery<DashboardKelasRow[]>({
    queryKey: ["dashboard-summary", effectivePeriodId],
    enabled: Boolean(effectivePeriodId),
    initialData:
      effectivePeriodId === activePeriodId ? initialRows : undefined,
    queryFn: async () => {
      if (!effectivePeriodId) return initialRows
      const supabase = createClient()
      const { data, error } = await supabase.rpc("get_dashboard_summary", {
        p_period_id: effectivePeriodId,
      })
      if (!error && data && data.length > 0) {
        return data
      }
      const [studentsRes, gradesRes] = await Promise.all([
        supabase.from("students").select("*"),
        supabase.from("grades").select("*").eq("period_id", effectivePeriodId),
      ])
      return hitungAgregasiKlien(
        studentsRes.data ?? [],
        gradesRes.data ?? [],
      )
    },
  })

  const rows = dashboardQuery.data ?? initialRows
  const isLoading = dashboardQuery.isLoading

  const namaPeriode =
    selectedPeriod?.nama ??
    initialPeriods.find((p) => p.id === effectivePeriodId)?.nama ??
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
      <KartuRingkasan rows={rows} isLoading={isLoading} />

      {/* Grafik & Daftar Perlu Dilengkapi */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Grafik kiri (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <GrafikRataRataKomponen rows={rows} isLoading={isLoading} />
          <GrafikKetuntasan rows={rows} isLoading={isLoading} />
        </div>

        {/* Panel kanan (1/3) */}
        <div className="space-y-6">
          <GrafikJenisKelamin rows={rows} isLoading={isLoading} />
          <DaftarPerluDilengkapi rows={rows} isLoading={isLoading} />
          <PintasanAksiCepat
            periodId={effectivePeriodId}
            namaPeriode={namaPeriode}
            namaSekolah={settings?.nama_sekolah}
            kkm={settings?.kkm}
          />
        </div>
      </div>
    </div>
  )
}

