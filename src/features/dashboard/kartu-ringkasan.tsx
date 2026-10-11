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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon
          className={`h-4 w-4 shrink-0 ${warna ?? "text-muted-foreground"}`}
          aria-hidden="true"
        />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-heading font-extrabold tracking-tight">
          {nilai}
        </div>
        {deskripsi && (
          <p className="text-xs text-muted-foreground mt-1">{deskripsi}</p>
        )}
      </CardContent>
    </Card>
  )
}

function KartuSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24 mb-1" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  )
}

export function KartuRingkasan({ rows, isLoading }: KartuRingkasanProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progres kelengkapan pengisian nilai</span>
          <span className="font-semibold text-foreground">{persen}%</span>
        </div>
        <Progress value={persen} className="h-2" aria-label={`${persen}% nilai telah diisi`} />
      </div>
    </div>
  )
}
