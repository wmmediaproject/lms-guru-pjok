"use client"

import * as React from "react"
import { Users, BookOpen, CheckCircle2, TrendingUp } from "lucide-react"
import type { DashboardKelasRow } from "@/lib/supabase/types"
import {
  hitungTotalSiswa,
  hitungTotalLengkap,
  hitungTotalBelum,
  hitungPersentaseLengkap,
  hitungRataRataKeseluruhan,
} from "@/features/dashboard/hitung-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

interface KartuRingkasanProps {
  rows: DashboardKelasRow[]
  isLoading?: boolean
}

function KartuItem({
  icon: Icon,
  label,
  nilai,
  deskripsi,
  warna,
}: {
  icon: React.ElementType
  label: string
  nilai: string | number
  deskripsi?: string
  warna?: string
}) {
  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-1.5 space-y-0">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-snug">
          {label}
        </CardTitle>
        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted/60 shrink-0">
          <Icon
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${warna ?? "text-muted-foreground"}`}
            aria-hidden="true"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-foreground">
          {nilai}
        </div>
        {deskripsi && (
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
            {deskripsi}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function KartuSkeleton() {
  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
        <Skeleton className="h-4 w-24 sm:w-32" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 sm:h-8 w-16 sm:w-24 mb-1" />
        <Skeleton className="h-3 w-28 sm:w-36" />
      </CardContent>
    </Card>
  )
}

export function KartuRingkasan({ rows, isLoading }: KartuRingkasanProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KartuSkeleton key={i} />
        ))}
      </div>
    )
  }

  const totalSiswa = hitungTotalSiswa(rows)
  const totalLengkap = hitungTotalLengkap(rows)
  const totalBelum = hitungTotalBelum(rows)
  const persen = hitungPersentaseLengkap(rows)
  const rataRata = hitungRataRataKeseluruhan(rows)

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KartuItem
          icon={Users}
          label="Total Siswa Aktif"
          nilai={totalSiswa}
          deskripsi={`${rows.length} kelas terdaftar`}
          warna="text-chart-3"
        />
        <KartuItem
          icon={CheckCircle2}
          label="Nilai Lengkap"
          nilai={totalLengkap}
          deskripsi={`${totalBelum} siswa belum diisi`}
          warna="text-chart-2"
        />
        <KartuItem
          icon={BookOpen}
          label="Kelengkapan Nilai"
          nilai={`${persen}%`}
          deskripsi="Semua komponen terisi"
          warna="text-primary"
        />
        <KartuItem
          icon={TrendingUp}
          label="Rata-rata Nilai Akhir"
          nilai={rataRata !== null ? rataRata.toFixed(1) : "—"}
          deskripsi="Rata-rata seluruh kelas"
          warna="text-chart-4"
        />
      </div>

      {/* Progress bar kelengkapan */}
      <div className="rounded-xl border border-border/80 bg-card px-3.5 py-2.5 sm:px-4 sm:py-3 space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Progres kelengkapan pengisian nilai</span>
          <span className="font-mono font-semibold text-foreground">{persen}%</span>
        </div>
        <Progress
          value={persen}
          className="h-2"
          aria-label={`${persen}% nilai telah diisi`}
        />
      </div>
    </div>
  )
}
