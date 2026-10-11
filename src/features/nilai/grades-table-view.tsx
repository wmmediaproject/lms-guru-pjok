"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import type { Grade, Period, Settings, Student } from "@/lib/supabase/types"
import { useActivePeriod } from "@/hooks/use-periods"
import { useSettings } from "@/hooks/use-settings"
import { getGradesQueryKey, useGrades } from "@/hooks/use-grades"
import {
  GRADE_COMPONENT_KEYS,
  apakahBelumAdaNilai,
  hitungTampilanNilaiAkhir,
  type GradeComponentKey,
  type StudentGradeRow,
} from "@/lib/hitung/nilai-siswa"
import {
  MAX_KETERANGAN_LENGTH,
  formatGradeCellValue,
  parseGradeCellInput,
} from "@/lib/validators/nilai"
import { simpanNilaiSiswaAction } from "@/features/nilai/actions"
import { GradeCell } from "@/features/nilai/grade-cell"
import { KeteranganCell } from "@/features/nilai/keterangan-cell"
import { ClassSelect } from "@/components/shared/class-select"
import { EmptyState } from "@/components/shared/empty-state"
import { ExportButton } from "@/components/shared/export-button"
import { PageHeader } from "@/components/shared/page-header"
import { PeriodSelect } from "@/components/shared/period-select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export const GRADE_AUTOSAVE_DEBOUNCE_MS = 800

export type RowSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error"

export interface RowDraftState {
  rawScores: Record<GradeComponentKey, string>
  parsedScores: Record<GradeComponentKey, number | null>
  fieldErrors: Partial<Record<GradeComponentKey | "keterangan", string>>
  keterangan: string
  isDirty: boolean
  status: RowSaveStatus
  saveError?: string | null
  dbNilaiAkhir: number | null
  dbPredikat: "Tuntas" | "Belum Tuntas" | null
  hasExistingGrade: boolean
}

function createDraftFromRow(row: StudentGradeRow): RowDraftState {
  return {
    rawScores: {
      nilai_praktek: formatGradeCellValue(row.nilai_praktek),
      nilai_uh: formatGradeCellValue(row.nilai_uh),
      nilai_asts: formatGradeCellValue(row.nilai_asts),
      nilai_asas: formatGradeCellValue(row.nilai_asas),
    },
    parsedScores: {
      nilai_praktek: row.nilai_praktek,
      nilai_uh: row.nilai_uh,
      nilai_asts: row.nilai_asts,
      nilai_asas: row.nilai_asas,
    },
    fieldErrors: {},
    keterangan: row.keterangan ?? "",
    isDirty: false,
    status: row.grade_id ? "saved" : "idle",
    saveError: null,
    dbNilaiAkhir: row.nilai_akhir,
    dbPredikat: row.predikat,
    hasExistingGrade: Boolean(row.grade_id),
  }
}

export interface GradesTableViewProps {
  initialKelas?: number
  initialPeriods?: Period[]
  initialSettings?: Settings | null
  initialStudents?: Student[]
  initialGrades?: Grade[]
}

export function GradesTableView({
  initialKelas = 1,
  initialPeriods,
  initialSettings,
  initialStudents,
  initialGrades,
}: GradesTableViewProps) {
  const queryClient = useQueryClient()
  const [selectedKelas, setSelectedKelas] = React.useState<number>(initialKelas)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [onlyIncomplete, setOnlyIncomplete] = React.useState(false)
  const [pendingClassChange, setPendingClassChange] = React.useState<number | null>(
    null,
  )

  const { selectedPeriod, selectedPeriodId } = useActivePeriod(initialPeriods)
  const { data: settings } = useSettings(initialSettings)

  const isInitialContext =
    selectedKelas === initialKelas &&
    selectedPeriodId === (initialPeriods?.find((p) => p.is_active)?.id ?? initialPeriods?.[0]?.id ?? null)

  const gradesQuery = useGrades({
    kelas: selectedKelas,
    periodId: selectedPeriodId,
    initialStudents: isInitialContext ? initialStudents : undefined,
    initialGrades: isInitialContext ? initialGrades : undefined,
  })

  const serverRows = React.useMemo(
    () => gradesQuery.data ?? [],
    [gradesQuery.data],
  )

  const [draftsByRowKey, setDraftsByRowKey] = React.useState<
    Record<string, RowDraftState>
  >({})

  const getRowKey = React.useCallback((row: Pick<StudentGradeRow, "period_id" | "student_id">) => {
    return `${row.period_id}:${row.student_id}`
  }, [])

  const debounceTimersRef = React.useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map())

  const latestDraftsRef = React.useRef(draftsByRowKey)
  React.useEffect(() => {
    latestDraftsRef.current = draftsByRowKey
  }, [draftsByRowKey])

  // Bersihkan semua timer saat unmount
  React.useEffect(() => {
    const timers = debounceTimersRef.current
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer)
      }
      timers.clear()
    }
  }, [])

  const hasUnsavedChanges = React.useMemo(() => {
    return Object.values(draftsByRowKey).some(
      (draft) =>
        draft.isDirty ||
        draft.status === "saving" ||
        draft.status === "error" ||
        Object.keys(draft.fieldErrors).length > 0,
    )
  }, [draftsByRowKey])

  // Peringatan keluar halaman (beforeunload) bila masih ada perubahan belum tersimpan
  React.useEffect(() => {
    if (!hasUnsavedChanges) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue =
        "Masih ada perubahan nilai yang belum tersimpan. Yakin ingin meninggalkan halaman?"
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  const executeRowSave = React.useCallback(
    async (studentRow: StudentGradeRow) => {
      if (!selectedPeriodId) return

      const rowKey = getRowKey(studentRow)
      const currentDraft = latestDraftsRef.current[rowKey]
      if (!currentDraft) return

      // Jangan simpan jika masih ada error validasi pada sel
      if (Object.keys(currentDraft.fieldErrors).length > 0) {
        return
      }

      setDraftsByRowKey((prev) => {
        const d = prev[rowKey]
        if (!d) return prev
        return {
          ...prev,
          [rowKey]: {
            ...d,
            status: "saving",
            saveError: null,
          },
        }
      })

      const payload = {
        student_id: studentRow.student_id,
        period_id: selectedPeriodId,
        kelas_saat_nilai: studentRow.kelas,
        nilai_praktek: currentDraft.parsedScores.nilai_praktek,
        nilai_uh: currentDraft.parsedScores.nilai_uh,
        nilai_asts: currentDraft.parsedScores.nilai_asts,
        nilai_asas: currentDraft.parsedScores.nilai_asas,
        keterangan:
          currentDraft.keterangan.trim() === ""
            ? null
            : currentDraft.keterangan.trim(),
      }

      const result = await simpanNilaiSiswaAction(payload)

      if (!result.success || !result.data) {
        const errorMsg =
          result.error ?? `Gagal menyimpan nilai ${studentRow.nama}`
        toast.error(`Gagal menyimpan nilai ${studentRow.nama}: ${errorMsg}`)

        setDraftsByRowKey((prev) => {
          const d = prev[rowKey]
          if (!d) return prev
          return {
            ...prev,
            [rowKey]: {
              ...d,
              isDirty: true,
              status: "error",
              saveError: errorMsg,
            },
          }
        })
        return
      }

      const savedGrade = result.data

      setDraftsByRowKey((prev) => {
        const d = prev[rowKey]
        if (!d) return prev
        return {
          ...prev,
          [rowKey]: {
            ...d,
            isDirty: false,
            status: "saved",
            saveError: null,
            dbNilaiAkhir: savedGrade.nilai_akhir,
            dbPredikat: savedGrade.predikat,
            hasExistingGrade: true,
          },
        }
      })

      // Perbarui cache TanStack Query agar hasil DB tetap sinkron
      queryClient.setQueryData<StudentGradeRow[]>(
        getGradesQueryKey(selectedKelas, selectedPeriodId),
        (oldRows) => {
          if (!oldRows) return oldRows
          return oldRows.map((r) =>
            r.student_id === studentRow.student_id
              ? {
                  ...r,
                  grade_id: savedGrade.id,
                  kelas_saat_nilai: savedGrade.kelas_saat_nilai,
                  nilai_praktek: savedGrade.nilai_praktek,
                  nilai_uh: savedGrade.nilai_uh,
                  nilai_asts: savedGrade.nilai_asts,
                  nilai_asas: savedGrade.nilai_asas,
                  nilai_akhir: savedGrade.nilai_akhir,
                  predikat: savedGrade.predikat,
                  keterangan: savedGrade.keterangan,
                  updated_at: savedGrade.updated_at,
                }
              : r,
          )
        },
      )
    },
    [getRowKey, queryClient, selectedKelas, selectedPeriodId],
  )

  const scheduleDebouncedSave = React.useCallback(
    (studentRow: StudentGradeRow) => {
      const rowKey = getRowKey(studentRow)
      const existingTimer = debounceTimersRef.current.get(rowKey)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(() => {
        debounceTimersRef.current.delete(rowKey)
        void executeRowSave(studentRow)
      }, GRADE_AUTOSAVE_DEBOUNCE_MS)

      debounceTimersRef.current.set(rowKey, timer)
    },
    [executeRowSave, getRowKey],
  )

  const handleScoreChange = React.useCallback(
    (
      studentRow: StudentGradeRow,
      componentKey: GradeComponentKey,
      nextRaw: string,
    ) => {
      const parsed = parseGradeCellInput(nextRaw)
      const rowKey = getRowKey(studentRow)

      setDraftsByRowKey((prev) => {
        const current = prev[rowKey] ?? createDraftFromRow(studentRow)
        const nextRawScores = {
          ...current.rawScores,
          [componentKey]: nextRaw,
        }
        const nextParsedScores = {
          ...current.parsedScores,
          [componentKey]: parsed.valid
            ? parsed.value
            : current.parsedScores[componentKey],
        }
        const nextFieldErrors = { ...current.fieldErrors }

        if (!parsed.valid) {
          nextFieldErrors[componentKey] = parsed.error
        } else {
          delete nextFieldErrors[componentKey]
        }

        const updatedDraft: RowDraftState = {
          ...current,
          rawScores: nextRawScores,
          parsedScores: nextParsedScores,
          fieldErrors: nextFieldErrors,
          isDirty: true,
          status: "dirty",
          saveError: null,
        }

        latestDraftsRef.current = {
          ...latestDraftsRef.current,
          [rowKey]: updatedDraft,
        }

        return {
          ...prev,
          [rowKey]: updatedDraft,
        }
      })

      if (!parsed.valid) {
        const existingTimer = debounceTimersRef.current.get(rowKey)
        if (existingTimer) {
          clearTimeout(existingTimer)
          debounceTimersRef.current.delete(rowKey)
        }
        return
      }

      scheduleDebouncedSave(studentRow)
    },
    [getRowKey, scheduleDebouncedSave],
  )

  const handleKeteranganChange = React.useCallback(
    (studentRow: StudentGradeRow, nextKeterangan: string) => {
      const isTooLong = nextKeterangan.length > MAX_KETERANGAN_LENGTH
      const rowKey = getRowKey(studentRow)

      setDraftsByRowKey((prev) => {
        const current = prev[rowKey] ?? createDraftFromRow(studentRow)
        const nextFieldErrors = { ...current.fieldErrors }

        if (isTooLong) {
          nextFieldErrors.keterangan = `Keterangan maksimal ${MAX_KETERANGAN_LENGTH} karakter`
        } else {
          delete nextFieldErrors.keterangan
        }

        const updatedDraft: RowDraftState = {
          ...current,
          keterangan: nextKeterangan,
          fieldErrors: nextFieldErrors,
          isDirty: true,
          status: "dirty",
          saveError: null,
        }

        latestDraftsRef.current = {
          ...latestDraftsRef.current,
          [rowKey]: updatedDraft,
        }

        return {
          ...prev,
          [rowKey]: updatedDraft,
        }
      })

      if (isTooLong) {
        const existingTimer = debounceTimersRef.current.get(rowKey)
        if (existingTimer) {
          clearTimeout(existingTimer)
          debounceTimersRef.current.delete(rowKey)
        }
        return
      }

      scheduleDebouncedSave(studentRow)
    },
    [getRowKey, scheduleDebouncedSave],
  )

  const handleNavigateCell = React.useCallback(
    (targetRow: number, targetCol: number) => {
      const selector = `input[data-grade-row="${targetRow}"][data-grade-col="${targetCol}"]`
      const targetInput = document.querySelector<HTMLInputElement>(selector)
      if (targetInput) {
        targetInput.focus()
        targetInput.select()
      }
    },
    [],
  )

  const bobotAktif = React.useMemo(
    () => ({
      bobot_praktek: Number(settings?.bobot_praktek ?? 25),
      bobot_uh: Number(settings?.bobot_uh ?? 25),
      bobot_asts: Number(settings?.bobot_asts ?? 25),
      bobot_asas: Number(settings?.bobot_asas ?? 25),
    }),
    [settings],
  )

  const kkmAktif = Number(settings?.kkm ?? 75)

  const incompleteCount = React.useMemo(() => {
    return serverRows.filter((row) => {
      const draft = draftsByRowKey[getRowKey(row)]
      const scores = draft ? draft.parsedScores : row
      return apakahBelumAdaNilai(scores)
    }).length
  }, [serverRows, draftsByRowKey, getRowKey])

  const filteredRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return serverRows.filter((row) => {
      const draft = draftsByRowKey[getRowKey(row)]
      const scores = draft ? draft.parsedScores : row

      if (onlyIncomplete && !apakahBelumAdaNilai(scores)) {
        return false
      }

      if (query.length > 0) {
        const matchNama = row.nama.toLowerCase().includes(query)
        const matchNisn = row.nisn.toLowerCase().includes(query)
        return matchNama || matchNisn
      }

      return true
    })
  }, [serverRows, draftsByRowKey, getRowKey, onlyIncomplete, searchQuery])

  const handleSelectKelas = (nextKelas: number | "semua") => {
    if (typeof nextKelas !== "number" || nextKelas === selectedKelas) return
    if (hasUnsavedChanges) {
      setPendingClassChange(nextKelas)
      return
    }
    setSelectedKelas(nextKelas)
  }

  const confirmDiscardAndSwitchClass = () => {
    if (pendingClassChange === null) return
    for (const timer of debounceTimersRef.current.values()) {
      clearTimeout(timer)
    }
    debounceTimersRef.current.clear()
    setDraftsByRowKey({})
    setSelectedKelas(pendingClassChange)
    setPendingClassChange(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nilai Siswa"
        description={`Input dan kelola nilai PJOK Kelas ${selectedKelas} pada ${selectedPeriod?.nama ?? "periode aktif"}. Tersimpan otomatis.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ClassSelect
              value={selectedKelas}
              onValueChange={handleSelectKelas}
              ariaLabel="Pilih kelas nilai siswa"
            />
            <PeriodSelect initialPeriods={initialPeriods} />
            <ExportButton
              kelas={selectedKelas}
              periodId={selectedPeriodId}
              namaPeriode={selectedPeriod?.nama ?? "Semester_Ganjil_2026-2027"}
              namaSekolah={settings?.nama_sekolah ?? null}
              kkm={kkmAktif}
              currentClassRows={serverRows}
            />
          </div>
        }
      />

      {hasUnsavedChanges && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2.5 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-medium text-foreground"
        >
          <ShieldAlert
            className="h-4 w-4 text-primary shrink-0"
            aria-hidden="true"
          />
          <span>
            Ada perubahan nilai yang sedang disimpan atau belum tersimpan. Jangan
            menutup halaman sebelum semua baris berstatus{" "}
            <strong>Tersimpan ✓</strong>.
          </span>
        </div>
      )}

      <Card className="border-border/80">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau NISN siswa..."
                  aria-label="Cari nama atau NISN siswa"
                  className="pl-8 h-9 text-sm"
                />
              </div>

              <Button
                type="button"
                variant={onlyIncomplete ? "default" : "outline"}
                size="sm"
                onClick={() => setOnlyIncomplete((prev) => !prev)}
                aria-pressed={onlyIncomplete}
                className="gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Belum ada nilai</span>
                <Badge
                  variant={onlyIncomplete ? "secondary" : "outline"}
                  className="ml-0.5 px-1.5 py-0 text-[11px] font-mono"
                >
                  {incompleteCount}
                </Badge>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="font-mono text-[11px]">
                Praktek {bobotAktif.bobot_praktek}% · UH {bobotAktif.bobot_uh}%
                · ASTS {bobotAktif.bobot_asts}% · ASAS {bobotAktif.bobot_asas}%
              </Badge>
              <Badge variant="secondary" className="font-mono text-[11px]">
                KKM: {kkmAktif}
              </Badge>
            </div>
          </div>

          {gradesQuery.isLoading ? (
            <div className="space-y-2" aria-label="Memuat daftar nilai siswa">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : serverRows.length === 0 ? (
            <EmptyState
              icon={Award}
              title={`Belum Ada Siswa di Kelas ${selectedKelas}`}
              description={`Tambahkan data siswa di menu Kelola Kelas ${selectedKelas} terlebih dahulu untuk mulai menginput nilai PJOK.`}
            />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Siswa Tidak Ditemukan"
              description={
                onlyIncomplete
                  ? "Semua siswa yang cocok sudah memiliki nilai lengkap pada periode ini."
                  : "Tidak ada siswa yang cocok dengan kata kunci pencarian."
              }
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setOnlyIncomplete(false)
                  }}
                  className="cursor-pointer"
                >
                  Reset Filter
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="sticky left-0 z-20 bg-muted/95 backdrop-blur-xs min-w-44 font-semibold">
                      Nama
                    </TableHead>
                    <TableHead className="w-20 text-center font-semibold">
                      Kelas
                    </TableHead>
                    <TableHead className="w-24 text-center font-semibold">
                      Praktek
                    </TableHead>
                    <TableHead className="w-24 text-center font-semibold">
                      UH
                    </TableHead>
                    <TableHead className="w-24 text-center font-semibold">
                      ASTS
                    </TableHead>
                    <TableHead className="w-24 text-center font-semibold">
                      ASAS
                    </TableHead>
                    <TableHead className="w-28 text-center font-semibold">
                      Nilai Akhir
                    </TableHead>
                    <TableHead className="w-32 text-center font-semibold">
                      Predikat
                    </TableHead>
                    <TableHead className="min-w-56 font-semibold">
                      Keterangan
                    </TableHead>
                    <TableHead className="w-36 text-right font-semibold">
                      Status Simpan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row, rowIndex) => {
                    const draft =
                      draftsByRowKey[getRowKey(row)] ??
                      createDraftFromRow(row)

                    const { nilai_akhir, predikat } = hitungTampilanNilaiAkhir({
                      nilai: draft.parsedScores,
                      dbNilaiAkhir: draft.dbNilaiAkhir,
                      dbPredikat: draft.dbPredikat,
                      isDirty: draft.isDirty,
                      bobot: bobotAktif,
                      kkm: kkmAktif,
                    })

                    const COMPONENT_LABELS: Record<GradeComponentKey, string> =
                      {
                        nilai_praktek: "Praktek",
                        nilai_uh: "UH",
                        nilai_asts: "ASTS",
                        nilai_asas: "ASAS",
                      }

                    return (
                      <TableRow
                        key={row.student_id}
                        className="group align-top"
                      >
                        <TableCell className="sticky left-0 z-10 bg-background group-hover:bg-muted/40 transition-colors font-medium min-w-44 border-r border-border/50">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {row.nama}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              NISN: {row.nisn}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center align-middle">
                          <Badge variant="outline" className="font-mono text-xs">
                            Kelas {row.kelas}
                          </Badge>
                        </TableCell>

                        {GRADE_COMPONENT_KEYS.map((compKey, colIndex) => (
                          <TableCell
                            key={compKey}
                            className="text-center align-top py-2.5"
                          >
                            <div className="flex justify-center">
                              <GradeCell
                                studentName={row.nama}
                                componentLabel={COMPONENT_LABELS[compKey]}
                                rowIndex={rowIndex}
                                colIndex={colIndex}
                                rawValue={draft.rawScores[compKey]}
                                error={draft.fieldErrors[compKey] ?? null}
                                onRawChange={(nextRaw) =>
                                  handleScoreChange(row, compKey, nextRaw)
                                }
                                onNavigateCell={handleNavigateCell}
                              />
                            </div>
                          </TableCell>
                        ))}

                        <TableCell
                          data-testid={`nilai-akhir-${row.student_id}`}
                          className="text-center align-middle font-mono text-sm font-semibold tabular-nums"
                        >
                          {nilai_akhir !== null ? (
                            <span className="text-foreground">
                              {nilai_akhir.toFixed(2)}
                            </span>
                          ) : (
                            <span
                              className="text-muted-foreground"
                              aria-label="Nilai akhir belum tersedia karena komponen nilai belum lengkap"
                            >
                              —
                            </span>
                          )}
                        </TableCell>

                        <TableCell
                          data-testid={`predikat-${row.student_id}`}
                          className="text-center align-middle"
                        >
                          {predikat === "Tuntas" ? (
                            <Badge
                              variant="outline"
                              className="gap-1 border-accent/40 bg-accent/15 text-foreground font-semibold"
                            >
                              <CheckCircle2
                                className="h-3.5 w-3.5 text-accent"
                                aria-hidden="true"
                              />
                              <span>Tuntas</span>
                            </Badge>
                          ) : predikat === "Belum Tuntas" ? (
                            <Badge
                              variant="destructive"
                              className="gap-1 font-semibold"
                            >
                              <XCircle
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              <span>Belum Tuntas</span>
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="align-top py-2.5">
                          <KeteranganCell
                            studentName={row.nama}
                            value={draft.keterangan}
                            error={draft.fieldErrors.keterangan ?? null}
                            onChange={(nextVal) =>
                              handleKeteranganChange(row, nextVal)
                            }
                          />
                        </TableCell>

                        <TableCell
                          data-testid={`status-simpan-${row.student_id}`}
                          className="text-right align-middle"
                        >
                          {draft.status === "saving" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Loader2
                                className="h-3.5 w-3.5 animate-spin text-primary"
                                aria-hidden="true"
                              />
                              <span>Menyimpan…</span>
                            </span>
                          ) : draft.status === "error" ? (
                            <div className="inline-flex flex-col items-end gap-1">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                                <AlertCircle
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                <span>Gagal</span>
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => void executeRowSave(row)}
                                aria-label={`Coba ulang simpan nilai ${row.nama}`}
                                className="h-6 px-2 text-[11px] gap-1 cursor-pointer"
                              >
                                <RotateCcw
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                                <span>Coba Ulang</span>
                              </Button>
                            </div>
                          ) : draft.status === "dirty" ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs font-medium",
                                Object.keys(draft.fieldErrors).length > 0
                                  ? "text-destructive"
                                  : "text-muted-foreground",
                              )}
                            >
                              <Clock
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              <span>Belum tersimpan</span>
                            </span>
                          ) : draft.status === "saved" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                              <CheckCircle2
                                className="h-3.5 w-3.5 text-accent"
                                aria-hidden="true"
                              />
                              <span>Tersimpan ✓</span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Belum diisi
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingClassChange !== null}
        onOpenChange={(open) => {
          if (!open) setPendingClassChange(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Perubahan Nilai Belum Tersimpan</AlertDialogTitle>
            <AlertDialogDescription>
              Masih ada perubahan nilai siswa yang sedang disimpan atau belum
              tersimpan. Jika Anda berpindah ke Kelas {pendingClassChange}{" "}
              sekarang, perubahan yang belum tersimpan akan dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Tetap di Halaman Ini
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscardAndSwitchClass}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Buang Perubahan & Pindah Kelas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
