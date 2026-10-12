"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  CheckCircle2,
  CopyX,
  Download,
  FileSpreadsheet,
  FileWarning,
  Loader2,
  RotateCcw,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { GRADES_ROOT_KEY } from "@/hooks/use-grades"
import { STUDENTS_ROOT_KEY } from "@/hooks/use-students"
import {
  CSV_TEMPLATE_CONTENT,
  MAX_CSV_SIZE_BYTES,
  buatCsvBarisGagal,
  parseStudentCsvText,
  type CsvParseResult,
} from "@/lib/csv/parse"
import {
  imporSiswaCsvAction,
  type CsvImportSummaryResult,
} from "./actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function triggerCsvDownload(filename: string, content: string) {
  const bom = "\uFEFF"
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CsvImportDialog({ open, onOpenChange }: CsvImportDialogProps) {
  const queryClient = useQueryClient()
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const [fileName, setFileName] = React.useState<string | null>(null)
  const [parseResult, setParseResult] = React.useState<CsvParseResult | null>(
    null,
  )
  const [importResult, setImportResult] =
    React.useState<CsvImportSummaryResult | null>(null)
  const [isImporting, startImportTransition] = React.useTransition()

  const resetState = () => {
    setFileName(null)
    setParseResult(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState()
    }
    onOpenChange(nextOpen)
  }

  const handleDownloadTemplate = () => {
    triggerCsvDownload("template_impor_siswa_pjok.csv", CSV_TEMPLATE_CONTENT)
  }

  const handleDownloadFailedRows = () => {
    if (!parseResult || parseResult.failedRows.length === 0) return
    const csvGagal = buatCsvBarisGagal(parseResult.failedRows)
    triggerCsvDownload("baris_gagal_impor_siswa.csv", csvGagal)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setImportResult(null)

    if (file.size > MAX_CSV_SIZE_BYTES) {
      setParseResult({
        ok: false,
        fatalError: "Ukuran file CSV melebihi batas maksimal 2 MB",
        rows: [],
        validRows: [],
        failedRows: [],
        summary: { total: 0, valid: 0, error: 0, duplicate: 0 },
      })
      return
    }

    try {
      const text = await file.text()
      const parsed = parseStudentCsvText(text, file.size)
      setParseResult(parsed)
    } catch {
      setParseResult({
        ok: false,
        fatalError: "Gagal membaca file CSV. Pastikan file tidak rusak.",
        rows: [],
        validRows: [],
        failedRows: [],
        summary: { total: 0, valid: 0, error: 0, duplicate: 0 },
      })
    }
  }

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.validRows.length === 0) return

    startImportTransition(async () => {
      const result = await imporSiswaCsvAction(
        parseResult.validRows,
        parseResult.failedRows.length,
      )

      if (!result.success || !result.data) {
        toast.error(result.error ?? "Gagal mengimpor data siswa")
        return
      }

      setImportResult(result.data)
      toast.success(
        `Impor CSV selesai: ${result.data.ditambah} ditambah, ${result.data.diperbarui} diperbarui, ${result.data.dilewati} dilewati`,
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: STUDENTS_ROOT_KEY }),
        queryClient.invalidateQueries({ queryKey: GRADES_ROOT_KEY }),
      ])
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90dvh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <span>Impor Data Siswa via CSV</span>
          </DialogTitle>
          <DialogDescription>
            Unggah file CSV dengan kolom <code>nisn, nama, kelas, jenis_kelamin</code>{" "}
            (maksimal 2 MB dan 1.000 baris). Siswa dengan NISN yang sudah ada
            akan diperbarui otomatis (upsert).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {/* Baris Unduh Template & Pilih File */}
          <div className="flex flex-col gap-3 rounded-md border border-border/80 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Belum punya format file yang sesuai?
              </p>
              <p className="text-xs text-muted-foreground">
                Unduh template CSV resmi (mendukung pemisah koma <code>,</code>{" "}
                maupun titik koma <code>;</code>).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Unduh Template CSV</span>
            </Button>
          </div>

          {!importResult && (
            <div className="space-y-2">
              <label
                htmlFor="csv-upload-input"
                className="block text-sm font-medium text-foreground"
              >
                Pilih File CSV (.csv)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="csv-upload-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  disabled={isImporting}
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {fileName && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isImporting}
                    onClick={resetState}
                    className="gap-1 shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Ganti File</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Error Fatal File */}
          {parseResult && !parseResult.ok && (
            <div
              role="alert"
              className="flex items-center gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{parseResult.fatalError}</span>
            </div>
          )}

          {/* Pratinjau & Validasi Per Baris */}
          {parseResult && parseResult.ok && !importResult && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Pratinjau Validasi ({parseResult.summary.total} Baris)
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className="gap-1 bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{parseResult.summary.valid} Valid</span>
                  </Badge>
                  {parseResult.summary.duplicate > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <CopyX className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{parseResult.summary.duplicate} Duplikat NISN</span>
                    </Badge>
                  )}
                  {parseResult.summary.error > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{parseResult.summary.error} Error</span>
                    </Badge>
                  )}
                </div>
              </div>

              <div className="max-h-64 overflow-auto rounded-md border border-border/80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Baris</TableHead>
                      <TableHead>NISN</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>JK</TableHead>
                      <TableHead>Status Validasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseResult.rows.map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell className="text-xs text-muted-foreground">
                          #{row.rowNumber}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.rawNisn || "-"}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {row.rawNama || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.rawKelas || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.normalized?.jenis_kelamin ??
                            (row.rawJenisKelamin || "-")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.status === "valid" ? (
                            <span className="inline-flex items-center gap-1 font-medium text-primary">
                              <CheckCircle2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              <span>Valid</span>
                            </span>
                          ) : row.status === "duplicate" ? (
                            <span className="inline-flex items-center gap-1 font-medium text-destructive">
                              <CopyX
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden="true"
                              />
                              <span>{row.errors.join(", ")}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-destructive">
                              <AlertCircle
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden="true"
                              />
                              <span>{row.errors.join(", ")}</span>
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Ringkasan Hasil Impor */}
          {importResult && (
            <div className="space-y-4 rounded-md border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                <h3 className="font-heading text-lg font-bold uppercase tracking-wide">
                  Ringkasan Hasil Impor CSV
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-md border border-border/80 bg-card p-3">
                  <p className="text-xs text-muted-foreground">
                    Siswa Ditambah
                  </p>
                  <p className="font-heading text-2xl font-extrabold text-foreground">
                    {importResult.ditambah}
                  </p>
                </div>
                <div className="rounded-md border border-border/80 bg-card p-3">
                  <p className="text-xs text-muted-foreground">
                    Siswa Diperbarui
                  </p>
                  <p className="font-heading text-2xl font-extrabold text-foreground">
                    {importResult.diperbarui}
                  </p>
                </div>
                <div className="rounded-md border border-border/80 bg-card p-3">
                  <p className="text-xs text-muted-foreground">
                    Baris Dilewati
                  </p>
                  <p className="font-heading text-2xl font-extrabold text-destructive">
                    {importResult.dilewati}
                  </p>
                </div>
              </div>

              {parseResult && parseResult.failedRows.length > 0 && (
                <div className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <FileWarning
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      Terdapat {parseResult.failedRows.length} baris yang gagal
                      atau duplikat dan dilewati saat impor.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleDownloadFailedRows}
                    className="gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Unduh Daftar Baris Gagal (.csv)</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          {importResult ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={resetState}
                className="cursor-pointer"
              >
                Impor File Lain
              </Button>
              <Button
                type="button"
                onClick={() => handleDialogOpenChange(false)}
                className="cursor-pointer"
              >
                Selesai
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isImporting}
                onClick={() => handleDialogOpenChange(false)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={
                  isImporting ||
                  !parseResult?.ok ||
                  parseResult.validRows.length === 0
                }
                onClick={handleConfirmImport}
                className="gap-1.5 cursor-pointer"
              >
                {isImporting ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Upload className="h-4 w-4" aria-hidden="true" />
                )}
                <span>
                  {isImporting
                    ? "Menyimpan..."
                    : `Simpan & Impor (${parseResult?.validRows.length ?? 0} Siswa)`}
                </span>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
