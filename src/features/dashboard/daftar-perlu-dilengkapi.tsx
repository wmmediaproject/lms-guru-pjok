"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, ChevronRight } from "lucide-react"
import type { DashboardKelasRow } from "@/lib/supabase/types"
import { kelasBelumLengkap } from "@/features/dashboard/hitung-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface DaftarPerluDilengkapiProps {
  rows: DashboardKelasRow[]
  isLoading?: boolean
}

export function DaftarPerluDilengkapi({
  rows,
  isLoading,
}: DaftarPerluDilengkapiProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const kelasBelum = kelasBelumLengkap(rows)
  const rowMap = new Map(rows.map((r) => [r.kelas, r]))

  if (kelasBelum.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-chart-2" aria-hidden="true" />
            Perlu Dilengkapi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="text-chart-2">✓</span>
            Semua nilai sudah lengkap untuk periode ini!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" aria-hidden="true" />
          Perlu Dilengkapi
          <Badge variant="destructive" className="ml-auto text-xs">
            {kelasBelum.length} kelas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {kelasBelum.map((kelas) => {
          const row = rowMap.get(kelas)
          const belum = row?.jumlah_belum ?? 0
          const total = row?.total_aktif ?? 0
          return (
            <div
              key={kelas}
              className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
            >
              <div className="text-sm">
                <span className="font-semibold">Kelas {kelas}</span>
                <span className="ml-2 text-muted-foreground text-xs">
                  {belum} dari {total} siswa belum diisi
                </span>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1 text-primary hover:text-primary h-7 text-xs"
              >
                <Link href={`/dashboard/nilai?kelas=${kelas}`}>
                  Isi Nilai
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
