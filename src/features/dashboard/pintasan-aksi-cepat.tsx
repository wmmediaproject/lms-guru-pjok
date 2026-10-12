"use client"

import * as React from "react"
import Link from "next/link"
import { Users, BookOpen, Settings, BarChart2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PintasanAksiCepatProps {
  periodId?: string | null
  namaPeriode?: string | null
  namaSekolah?: string | null
  kkm?: number
}

const PINTASAN = [
  {
    label: "Kelola Kelas & Siswa",
    href: "/dashboard/kelas",
    icon: Users,
    deskripsi: "Kelola data siswa Kelas 1–6 & impor CSV",
  },
  {
    label: "Input Nilai Siswa",
    href: "/dashboard/nilai",
    icon: BookOpen,
    deskripsi: "Isi nilai PJOK per kelas & semester",
  },
  {
    label: "Pengaturan",
    href: "/dashboard/pengaturan",
    icon: Settings,
    deskripsi: "Periode semester, KKM, & bobot nilai",
  },
] as const

export function PintasanAksiCepat({
  periodId,
  namaPeriode,
  namaSekolah,
  kkm = 75,
}: PintasanAksiCepatProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary" aria-hidden="true" />
          Aksi Cepat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {PINTASAN.map(({ label, href, icon: Icon, deskripsi }) => (
          <Button
            key={href}
            asChild
            variant="outline"
            className="w-full justify-start gap-3 h-10"
          >
            <Link href={href}>
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <div className="text-left">
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{deskripsi}</div>
              </div>
            </Link>
          </Button>
        ))}

        {/* Ekspor langsung dari dashboard (semua kelas) */}
        {periodId && namaPeriode && (
          <ExportAllButton
            periodId={periodId}
            namaPeriode={namaPeriode}
            namaSekolah={namaSekolah}
            kkm={kkm}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Ekspor tombol (lazy load ExportButton untuk menghindari impor berat di server)
// ---------------------------------------------------------------------------
function ExportAllButton({
  periodId,
  namaPeriode,
  namaSekolah,
  kkm,
}: {
  periodId: string
  namaPeriode: string
  namaSekolah?: string | null
  kkm: number
}) {
  // Dynamically resolve the current kelas — for quick export we use kelas 1
  // (the full ExportButton component handles "semua" option internally)
  const [ExportButtonComp, setExportButtonComp] = React.useState<
    React.ComponentType<{
      kelas: number
      periodId: string | null
      namaPeriode: string
      namaSekolah?: string | null
      kkm?: number
      disabled?: boolean
    }> | null
  >(null)

  React.useEffect(() => {
    import("@/components/shared/export-button").then((mod) => {
      setExportButtonComp(() => mod.ExportButton)
    })
  }, [])

  if (!ExportButtonComp) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start gap-3 h-10"
        disabled
      >
        <Download className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
        <div className="text-left">
          <div className="text-sm font-medium">Ekspor Nilai</div>
          <div className="text-xs text-muted-foreground">Excel / PDF semua kelas</div>
        </div>
      </Button>
    )
  }

  return (
    <div className="w-full [&>button]:w-full [&>button]:justify-start [&>button]:gap-3 [&>button]:h-10">
      <ExportButtonComp
        kelas={1}
        periodId={periodId}
        namaPeriode={namaPeriode}
        namaSekolah={namaSekolah}
        kkm={kkm}
      />
    </div>
  )
}
