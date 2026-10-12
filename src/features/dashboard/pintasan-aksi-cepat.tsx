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
  namaGuru?: string | null
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
  namaGuru,
  kkm = 75,
}: PintasanAksiCepatProps) {
  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <span>Aksi Cepat</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {PINTASAN.map(({ label, href, icon: Icon, deskripsi }) => (
          <Button
            key={href}
            asChild
            variant="outline"
            className="w-full h-auto py-2.5 px-3 justify-start gap-3 whitespace-normal"
          >
            <Link href={href}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-sm font-semibold leading-snug text-foreground">
                  {label}
                </div>
                <div className="text-xs text-muted-foreground leading-snug mt-0.5">
                  {deskripsi}
                </div>
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
            namaGuru={namaGuru}
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
  namaGuru,
  kkm,
}: {
  periodId: string
  namaPeriode: string
  namaSekolah?: string | null
  namaGuru?: string | null
  kkm: number
}) {
  const [ExportButtonComp, setExportButtonComp] = React.useState<
    React.ComponentType<{
      kelas: number
      periodId: string | null
      namaPeriode: string
      namaSekolah?: string | null
      namaGuru?: string | null
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
        className="w-full h-9 px-3 justify-center gap-2"
        disabled
      >
        <Download className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium">Ekspor Nilai</span>
      </Button>
    )
  }

  return (
    <div className="w-full [&>button]:w-full [&>button]:h-9 [&>button]:px-3 [&>button]:justify-center">
      <ExportButtonComp
        kelas={1}
        periodId={periodId}
        namaPeriode={namaPeriode}
        namaSekolah={namaSekolah}
        namaGuru={namaGuru}
        kkm={kkm}
      />
    </div>
  )
}
