"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import type { DashboardKelasRow } from "@/lib/supabase/types"
import {
  siapkanDataGrafikKomponen,
  siapkanDataGrafikJenisKelamin,
  siapkanDataGrafikKetuntasan,
} from "@/features/dashboard/hitung-dashboard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// ---------------------------------------------------------------------------
// Warna chart dari CSS tokens (hardcode OKLCH fallback hex untuk recharts)
// ---------------------------------------------------------------------------
const CHART_COLORS = {
  chart1: "var(--color-chart-1)",
  chart2: "var(--color-chart-2)",
  chart3: "var(--color-chart-3)",
  chart4: "var(--color-chart-4)",
  chart5: "var(--color-chart-5)",
}

const KOMPONEN_BARS = [
  { key: "Praktek", color: CHART_COLORS.chart1 },
  { key: "UH", color: CHART_COLORS.chart3 },
  { key: "ASTS", color: CHART_COLORS.chart2 },
  { key: "ASAS", color: CHART_COLORS.chart4 },
] as const

const KETUNTASAN_BARS = [
  { key: "Tuntas", color: CHART_COLORS.chart2 },
  { key: "Belum Tuntas", color: CHART_COLORS.chart1 },
] as const

const PIE_COLORS = [CHART_COLORS.chart3, CHART_COLORS.chart5]

interface GrafikProps {
  rows: DashboardKelasRow[]
  isLoading?: boolean
}

function ChartSkeleton({ title, desc }: { title: string; desc: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-56 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Bar chart: rata-rata komponen nilai per kelas
// ---------------------------------------------------------------------------
export function GrafikRataRataKomponen({ rows, isLoading }: GrafikProps) {
  if (isLoading) {
    return (
      <ChartSkeleton
        title="Rata-rata Komponen Nilai per Kelas"
        desc="Praktek, UH, ASTS, ASAS"
      />
    )
  }

  const data = siapkanDataGrafikKomponen(rows)
  const isEmpty = data.every(
    (d) => d.Praktek === 0 && d.UH === 0 && d.ASTS === 0 && d.ASAS === 0,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rata-rata Komponen Nilai per Kelas</CardTitle>
        <CardDescription>Nilai 0–100 untuk setiap komponen penilaian</CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            Belum ada data nilai untuk periode ini
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="kelas"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border, 0 0% 89.8%))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {KOMPONEN_BARS.map(({ key, color }) => (
                <Bar key={key} dataKey={key} fill={color} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Pie chart: sebaran Laki-laki / Perempuan
// ---------------------------------------------------------------------------
export function GrafikJenisKelamin({ rows, isLoading }: GrafikProps) {
  if (isLoading) {
    return (
      <ChartSkeleton title="Sebaran Jenis Kelamin" desc="Seluruh kelas aktif" />
    )
  }

  const data = siapkanDataGrafikJenisKelamin(rows)
  const total = data.reduce((acc, d) => acc + d.value, 0)
  const isEmpty = total === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sebaran Jenis Kelamin</CardTitle>
        <CardDescription>Seluruh siswa aktif semua kelas</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {isEmpty ? (
          <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            Belum ada data siswa
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={192}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-6 text-sm">
              {data.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{d.name}:</span>
                  <span className="font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Bar chart: Tuntas vs Belum Tuntas per kelas
// ---------------------------------------------------------------------------
export function GrafikKetuntasan({ rows, isLoading }: GrafikProps) {
  if (isLoading) {
    return (
      <ChartSkeleton
        title="Ketuntasan per Kelas"
        desc="Jumlah siswa Tuntas dan Belum Tuntas"
      />
    )
  }

  const data = siapkanDataGrafikKetuntasan(rows)
  const isEmpty = data.every((d) => d.Tuntas === 0 && d["Belum Tuntas"] === 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ketuntasan per Kelas</CardTitle>
        <CardDescription>Jumlah siswa Tuntas dan Belum Tuntas berdasarkan KKM</CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            Belum ada data penilaian lengkap untuk periode ini
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="kelas"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border, 0 0% 89.8%))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {KETUNTASAN_BARS.map(({ key, color }) => (
                <Bar key={key} dataKey={key} fill={color} radius={[3, 3, 0, 0]} stackId="stack" />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
