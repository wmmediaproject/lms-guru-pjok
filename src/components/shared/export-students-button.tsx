"use client"

import * as React from "react"
import {
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Layers,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useSettings } from "@/hooks/use-settings"
import { KELAS_LIST } from "@/lib/sidebar-utils"
import type { Student } from "@/lib/supabase/types"
import {
  bentukDataEksporSiswaKelas,
  buatNamaFileEksporSiswa,
  type DataEksporSiswaKelas,
  type FormatEksporSiswa,
} from "@/lib/ekspor/ekspor-siswa"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface ExportStudentsButtonProps {
  kelas?: number
  currentClassStudents?: ReadonlyArray<
    Pick<Student, "nisn" | "nama" | "kelas" | "jenis_kelamin" | "status">
  >
  disabled?: boolean
  className?: string
  label?: string
}

function unduhBlobDiBrowser(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ExportStudentsButton({
  kelas,
  currentClassStudents,
  disabled = false,
  className,
  label = "Ekspor Siswa",
}: ExportStudentsButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false)
  const { data: settings } = useSettings()
  const namaSekolah = settings?.nama_sekolah ?? null

  const muatDataSiswa = async (
    target: number | "semua",
  ): Promise<DataEksporSiswaKelas[]> => {
    if (
      typeof target === "number" &&
      target === kelas &&
      currentClassStudents !== undefined
    ) {
      const aktif = currentClassStudents.filter((s) => s.status !== "lulus")
      return [bentukDataEksporSiswaKelas(target, aktif)]
    }

    const supabase = createClient()

    if (typeof target === "number") {
      const { data, error } = await supabase
        .from("students")
        .select("nisn, nama, kelas, jenis_kelamin, status")
        .eq("kelas", target)
        .order("nama", { ascending: true })

      if (error) throw new Error(error.message)
      const aktif = (data ?? []).filter((s) => s.status !== "lulus")
      return [bentukDataEksporSiswaKelas(target, aktif)]
    }

    const { data, error } = await supabase
      .from("students")
      .select("nisn, nama, kelas, jenis_kelamin, status")
      .order("nama", { ascending: true })

    if (error) throw new Error(error.message)
    const aktif = (data ?? []).filter((s) => s.status !== "lulus")

    return KELAS_LIST.map((nomorKelas) => {
      const siswaKelas = aktif.filter((s) => s.kelas === nomorKelas)
      return bentukDataEksporSiswaKelas(nomorKelas, siswaKelas)
    })
  }

  const handleExport = async (
    format: FormatEksporSiswa,
    target: number | "semua",
  ) => {
    if (isExporting) return

    setIsExporting(true)
    try {
      const daftarKelas = await muatDataSiswa(target)
      const namaFile = buatNamaFileEksporSiswa({ kelas: target, format })

      if (format === "xlsx") {
        const { buatBufferExcelSiswa } = await import(
          "@/lib/ekspor/ekspor-siswa"
        )
        const buffer = await buatBufferExcelSiswa({
          namaSekolah,
          daftarKelas,
        })
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        unduhBlobDiBrowser(blob, namaFile)
      } else if (format === "pdf") {
        const { buatBlobPdfSiswa } = await import("@/lib/ekspor/ekspor-siswa")
        const blob = await buatBlobPdfSiswa({
          namaSekolah,
          daftarKelas,
        })
        unduhBlobDiBrowser(blob, namaFile)
      } else {
        const { buatCsvDataSiswa } = await import("@/lib/ekspor/ekspor-siswa")
        const csvContent = buatCsvDataSiswa(daftarKelas)
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        })
        unduhBlobDiBrowser(blob, namaFile)
      }

      toast.success(`Berhasil mengunduh ${namaFile}`)
    } catch (err) {
      const pesan =
        err instanceof Error ? err.message : "Gagal mengekspor data siswa"
      toast.error(`Ekspor gagal: ${pesan}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isExporting}
          aria-label="Ekspor data siswa ke Excel, PDF, atau CSV"
          className={cn("gap-1.5 cursor-pointer", className)}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Mengekspor…</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{label}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {typeof kelas === "number" && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Ekspor Data Siswa Kelas {kelas}
            </DropdownMenuLabel>
            <DropdownMenuItem
              disabled={isExporting}
              onClick={() => void handleExport("xlsx", kelas)}
              className="gap-2 cursor-pointer"
            >
              <FileSpreadsheet
                className="h-4 w-4 text-accent"
                aria-hidden="true"
              />
              <span>Excel (.xlsx) — Kelas {kelas}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isExporting}
              onClick={() => void handleExport("pdf", kelas)}
              className="gap-2 cursor-pointer"
            >
              <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>PDF (.pdf) — Kelas {kelas}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isExporting}
              onClick={() => void handleExport("csv", kelas)}
              className="gap-2 cursor-pointer"
            >
              <FileCode2
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span>CSV (.csv) — Kelas {kelas}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Ekspor Semua Kelas (Kelas 1–6)
        </DropdownMenuLabel>
        <DropdownMenuItem
          disabled={isExporting}
          onClick={() => void handleExport("xlsx", "semua")}
          className="gap-2 cursor-pointer"
        >
          <Layers className="h-4 w-4 text-accent" aria-hidden="true" />
          <span>Excel (.xlsx) — Semua Kelas</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isExporting}
          onClick={() => void handleExport("pdf", "semua")}
          className="gap-2 cursor-pointer"
        >
          <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>PDF (.pdf) — Semua Kelas</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isExporting}
          onClick={() => void handleExport("csv", "semua")}
          className="gap-2 cursor-pointer"
        >
          <FileCode2
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span>CSV (.csv) — Semua Kelas</span>
        </DropdownMenuItem>

        {kelas === undefined && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Ekspor Excel Per Kelas
            </DropdownMenuLabel>
            <div className="grid grid-cols-2 gap-1 px-1 pb-1">
              {KELAS_LIST.map((nomorKelas) => (
                <DropdownMenuItem
                  key={nomorKelas}
                  disabled={isExporting}
                  onClick={() => void handleExport("xlsx", nomorKelas)}
                  className="gap-1.5 text-xs justify-center border border-border/60 rounded-md py-1.5 cursor-pointer"
                >
                  <FileSpreadsheet
                    className="h-3.5 w-3.5 text-accent shrink-0"
                    aria-hidden="true"
                  />
                  <span>Kelas {nomorKelas}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
