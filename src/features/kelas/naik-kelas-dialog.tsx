"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Loader2,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import {
  STUDENTS_ROOT_KEY,
  useClassSummaries,
  type ClassSummary,
} from "@/hooks/use-students"
import { SETTINGS_QUERY_KEY, useSettings } from "@/hooks/use-settings"
import {
  naikKelasMassalAction,
  type NaikKelasMassalResult,
} from "@/features/siswa/actions"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface NaikKelasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSummaries?: ClassSummary[]
}

export function NaikKelasDialog({
  open,
  onOpenChange,
  initialSummaries,
}: NaikKelasDialogProps) {
  const queryClient = useQueryClient()
  const { data: summaries = [] } = useClassSummaries(initialSummaries)
  const { data: settings } = useSettings()

  const [konfirmasiText, setKonfirmasiText] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [resultSummary, setResultSummary] =
    React.useState<NaikKelasMassalResult | null>(null)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return
    if (!nextOpen) {
      setKonfirmasiText("")
      setResultSummary(null)
      setErrorMsg(null)
    }
    onOpenChange(nextOpen)
  }

  const getCountForKelas = (kelas: number): number => {
    return summaries.find((s) => s.kelas === kelas)?.total ?? 0
  }

  const totalSiswaAktif = summaries.reduce((acc, s) => acc + s.total, 0)
  const isConfirmed = konfirmasiText.trim() === "NAIK KELAS"
  const lastPromotedAt = settings?.last_promoted_at ?? null

  const handleExecute = async () => {
    if (!isConfirmed || isSubmitting) return

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await naikKelasMassalAction(konfirmasiText)
      if (!res.success || !res.data) {
        const msg =
          res.error ??
          "Gagal menjalankan kenaikan kelas massal. Tidak ada data yang diubah."
        setErrorMsg(msg)
        toast.error(msg)
        return
      }

      setResultSummary(res.data)
      toast.success(
        `Naik kelas massal berhasil dijalankan (${res.data.total_affected} siswa diproses).`,
      )

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: STUDENTS_ROOT_KEY }),
        queryClient.invalidateQueries({ queryKey: ["nilai"] }),
        queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY }),
      ])
    } catch {
      const fallbackErr = "Terjadi kesalahan jaringan saat memproses kenaikan kelas"
      setErrorMsg(fallbackErr)
      toast.error(fallbackErr)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>
              {resultSummary
                ? "Ringkasan Hasil Naik Kelas Massal"
                : "Naik Kelas Massal (Akhir Tahun Ajaran)"}
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            {resultSummary
              ? "Proses kenaikan kelas massal telah selesai dalam satu transaksi. Seluruh riwayat nilai semester sebelumnya tetap tersimpan utuh."
              : "Pindahkan seluruh siswa aktif naik satu tingkat (Kelas 1→2 s.d. 5→6) dan tandai siswa Kelas 6 sebagai Lulus. Catatan nilai historis tidak akan berubah."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {resultSummary ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-accent/40 bg-accent/10 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2
                  className="h-4 w-4 text-accent shrink-0"
                  aria-hidden="true"
                />
                <span>
                  Total {resultSummary.total_affected} siswa berhasil diproses
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between rounded-md bg-background/80 px-2.5 py-1.5 border border-border/60">
                  <span>Kelas 1 → Kelas 2</span>
                  <Badge variant="secondary" className="font-mono">
                    {resultSummary.promoted_1_to_2} siswa
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-md bg-background/80 px-2.5 py-1.5 border border-border/60">
                  <span>Kelas 2 → Kelas 3</span>
                  <Badge variant="secondary" className="font-mono">
                    {resultSummary.promoted_2_to_3} siswa
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-md bg-background/80 px-2.5 py-1.5 border border-border/60">
                  <span>Kelas 3 → Kelas 4</span>
                  <Badge variant="secondary" className="font-mono">
                    {resultSummary.promoted_3_to_4} siswa
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-md bg-background/80 px-2.5 py-1.5 border border-border/60">
                  <span>Kelas 4 → Kelas 5</span>
                  <Badge variant="secondary" className="font-mono">
                    {resultSummary.promoted_4_to_5} siswa
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-md bg-background/80 px-2.5 py-1.5 border border-border/60">
                  <span>Kelas 5 → Kelas 6</span>
                  <Badge variant="secondary" className="font-mono">
                    {resultSummary.promoted_5_to_6} siswa
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-md bg-background/80 px-2.5 py-1.5 border border-border/60">
                  <span>Kelas 6 → Lulus</span>
                  <Badge variant="outline" className="font-mono">
                    {resultSummary.graduated_kelas_6} siswa
                  </Badge>
                </div>
              </div>
            </div>

            <AlertDialogFooter>
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="cursor-pointer"
              >
                Selesai
              </Button>
            </AlertDialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            {lastPromotedAt && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-foreground"
              >
                <AlertTriangle
                  className="h-4 w-4 text-destructive shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-0.5">
                  <p className="font-semibold text-destructive">
                    Peringatan Pengaman Eksekusi Ganda
                  </p>
                  <p className="text-muted-foreground">
                    Fitur Naik Kelas Massal tercatat terakhir dijalankan pada{" "}
                    <strong className="text-foreground">
                      {new Date(lastPromotedAt).toLocaleString("id-ID")}
                    </strong>
                    . Pastikan Anda tidak menjalankan kenaikan kelas dua kali
                    pada tahun ajaran yang sama.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pratinjau Pemindahan Siswa Aktif ({totalSiswaAktif} Siswa)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[1, 2, 3, 4, 5].map((kelasAsal) => (
                  <div
                    key={kelasAsal}
                    className="flex items-center justify-between rounded-md border border-border/70 bg-background px-2.5 py-1.5"
                  >
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <span>Kelas {kelasAsal}</span>
                      <ArrowRight
                        className="h-3 w-3 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span>Kelas {kelasAsal + 1}</span>
                    </span>
                    <Badge variant="secondary" className="font-mono text-[11px]">
                      {getCountForKelas(kelasAsal)} siswa
                    </Badge>
                  </div>
                ))}

                <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1.5">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <GraduationCap
                      className="h-3.5 w-3.5 text-primary"
                      aria-hidden="true"
                    />
                    <span>Kelas 6 → Lulus</span>
                  </span>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {getCountForKelas(6)} siswa
                  </Badge>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground pt-1">
                * Siswa Kelas 6 akan ditandai berstatus{" "}
                <strong className="text-foreground">Lulus</strong> (tidak
                dihapus) dan nilai historis semua kelas tetap menggunakan{" "}
                <code className="font-mono">kelas_saat_nilai</code>.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="konfirmasi-naik-kelas" className="text-xs">
                Ketik{" "}
                <span className="font-mono font-bold text-primary">
                  NAIK KELAS
                </span>{" "}
                untuk mengonfirmasi:
              </Label>
              <Input
                id="konfirmasi-naik-kelas"
                value={konfirmasiText}
                disabled={isSubmitting}
                onChange={(e) => setKonfirmasiText(e.target.value)}
                placeholder="NAIK KELAS"
                aria-label="Ketik NAIK KELAS untuk konfirmasi"
                className="font-mono text-sm"
              />
            </div>

            {errorMsg && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {errorMsg}
              </p>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Batal
              </AlertDialogCancel>
              <Button
                type="button"
                disabled={!isConfirmed || isSubmitting || totalSiswaAktif === 0}
                onClick={() => void handleExecute()}
                className="gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Memproses…</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                    <span>Jalankan Naik Kelas Massal</span>
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
