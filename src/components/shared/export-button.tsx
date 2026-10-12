"use client"

import * as React from "react"
import {
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { KELAS_LIST } from "@/lib/sidebar-utils"
import {
  gabungkanSiswaDanNilai,
  type StudentGradeRow,
} from "@/lib/hitung/nilai-siswa"
import {
  bentukDataEksporKelas,
  buatNamaFileEkspor,
  formatNamaGuruEkspor,
  type DataEksporKelas,
  type FormatFileEkspor,
} from "@/lib/ekspor/format-ekspor"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ExportButtonProps {
  kelas: number
  periodId: string | null
  namaPeriode: string
  namaSekolah?: string | null
  namaGuru?: string | null
  kkm?: number
  currentClassRows?: ReadonlyArray<StudentGradeRow>
  disabled?: boolean
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

export function ExportButton({
  kelas,
  periodId,
  namaPeriode,
  namaSekolah = null,
  namaGuru = null,
  kkm = 75,
  currentClassRows,
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false)

  const ambilNamaGuruAktif = async (): Promise<string> => {
    try {
      const supabase = createClient()
      if (supabase?.auth && typeof supabase.auth.getUser === "function") {
        const { data } = await supabase.auth.getUser()
        const meta = data?.user?.user_metadata
        const dariProfil = (meta?.nama_lengkap ||
          meta?.full_name ||
          meta?.name) as string | undefined
        if (dariProfil?.trim()) {
          return dariProfil.trim()
        }
      }
    } catch {
      // Gunakan fallback prop namaGuru jika gagal memuat sesi
    }
    return formatNamaGuruEkspor(namaGuru)
  }

  const muatDataEkspor = async (
    cakupan: "kelas" | "semua",
  ): Promise<DataEksporKelas[]> => {
    if (!periodId) {
      throw new Error("Periode belum dipilih")
    }

    if (cakupan === "kelas" && currentClassRows !== undefined) {
      return [bentukDataEksporKelas(kelas, currentClassRows)]
    }

    const supabase = createClient()

    if (cakupan === "kelas") {
      const [studentsRes, gradesRes] = await Promise.all([
        supabase
          .from("students")
          .select("*")
          .eq("kelas", kelas)
          .order("nama", { ascending: true }),
        supabase.from("grades").select("*").eq("period_id", periodId),
      ])

      if (studentsRes.error) throw new Error(studentsRes.error.message)
      if (gradesRes.error) throw new Error(gradesRes.error.message)

      const merged = gabungkanSiswaDanNilai(
        studentsRes.data ?? [],
        gradesRes.data ?? [],
        periodId,
      )
      return [bentukDataEksporKelas(kelas, merged)]
    }

    // Cakupan "semua": satu sheet/bagian per kelas (Kelas 1 s.d. Kelas 6)
    const [allStudentsRes, allGradesRes] = await Promise.all([
      supabase
        .from("students")
        .select("*")
        .order("nama", { ascending: true }),
      supabase.from("grades").select("*").eq("period_id", periodId),
    ])

    if (allStudentsRes.error) throw new Error(allStudentsRes.error.message)
    if (allGradesRes.error) throw new Error(allGradesRes.error.message)

    const allStudents = allStudentsRes.data ?? []
    const allGrades = allGradesRes.data ?? []

    return KELAS_LIST.map((nomorKelas) => {
      const siswaKelas = allStudents.filter((s) => s.kelas === nomorKelas)
      const merged = gabungkanSiswaDanNilai(siswaKelas, allGrades, periodId)
      return bentukDataEksporKelas(nomorKelas, merged)
    })
  }

  const handleExport = async (
    format: FormatFileEkspor,
    cakupan: "kelas" | "semua",
  ) => {
    if (isExporting || !periodId) return

    setIsExporting(true)
    try {
      const [daftarKelas, namaGuruTerbaru] = await Promise.all([
        muatDataEkspor(cakupan),
        ambilNamaGuruTerbaruAtauProp(),
      ])
      const namaFile = buatNamaFileEkspor({
        kelas: cakupan === "semua" ? "semua" : kelas,
        namaPeriode,
        format,
      })

      if (format === "xlsx") {
        // Dynamic import exceljs hanya saat dibutuhkan
        const { buatBufferExcelNilai } = await import(
          "@/lib/ekspor/ekspor-excel"
        )
        const buffer = await buatBufferExcelNilai({
          namaSekolah,
          namaGuru: namaGuruTerbaru,
          namaPeriode,
          kkm,
          daftarKelas,
        })
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        unduhBlobDiBrowser(blob, namaFile)
      } else {
        // Dynamic import jspdf + jspdf-autotable hanya saat dibutuhkan
        const { buatBlobPdfNilai } = await import("@/lib/ekspor/ekspor-pdf")
        const blob = await buatBlobPdfNilai({
          namaSekolah,
          namaGuru: namaGuruTerbaru,
          namaPeriode,
          kkm,
          daftarKelas,
        })
        unduhBlobDiBrowser(blob, namaFile)
      }

      toast.success(`Berhasil mengunduh ${namaFile}`)
    } catch (err) {
      const pesan =
        err instanceof Error ? err.message : "Gagal mengekspor nilai siswa"
      toast.error(`Ekspor gagal: ${pesan}`)
    } finally {
      setIsExporting(false)
    }
  }

  async function ambilNamaGuruTerbaruAtauProp(): Promise<string> {
    return ambilNamaGuruAktif()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isExporting || !periodId}
          aria-label="Ekspor rekap nilai siswa ke Excel atau PDF"
          className="gap-1.5 cursor-pointer"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Mengekspor…</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Ekspor</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Ekspor Kelas {kelas} ({namaPeriode})
        </DropdownMenuLabel>
        <DropdownMenuItem
          disabled={isExporting}
          onClick={() => void handleExport("xlsx", "kelas")}
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
          onClick={() => void handleExport("pdf", "kelas")}
          className="gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>PDF (.pdf) — Kelas {kelas}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
