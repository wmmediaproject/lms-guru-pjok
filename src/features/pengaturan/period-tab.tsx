"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import type { Period } from "@/lib/supabase/types"
import { PERIODS_QUERY_KEY, usePeriods } from "@/hooks/use-periods"
import {
  namaPeriode,
  periodeBerikutnyaDariDaftar,
} from "@/lib/hitung/periode"
import { periodeSchema, type PeriodeInput } from "@/lib/validators/pengaturan"
import {
  buatPeriodeBerikutnyaAction,
  hapusPeriodeAction,
  jadikanPeriodeAktifAction,
  tambahPeriodeAction,
  ubahPeriodeAction,
} from "./actions"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface PeriodTabProps {
  initialPeriods?: Period[]
}

export function PeriodTab({ initialPeriods }: PeriodTabProps) {
  const queryClient = useQueryClient()
  const { data: periods = [] } = usePeriods(initialPeriods)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingPeriod, setEditingPeriod] = React.useState<Period | null>(null)
  const [deletingPeriod, setDeletingPeriod] = React.useState<Period | null>(
    null,
  )
  const [isPending, startTransition] = React.useTransition()

  const nextPeriodPreview = React.useMemo(
    () => periodeBerikutnyaDariDaftar(periods),
    [periods],
  )

  const form = useForm<PeriodeInput>({
    resolver: zodResolver(periodeSchema),
    defaultValues: {
      tahun_mulai: 2026,
      semester: "ganjil",
    },
  })

  const watchedTahun = useWatch({
    control: form.control,
    name: "tahun_mulai",
  })
  const watchedSemester = useWatch({
    control: form.control,
    name: "semester",
  })
  const previewNama =
    Number.isInteger(Number(watchedTahun)) && Number(watchedTahun) >= 2020
      ? namaPeriode(Number(watchedTahun), watchedSemester ?? "ganjil")
      : "-"

  const openAddDialog = () => {
    setEditingPeriod(null)
    form.reset({
      tahun_mulai: nextPeriodPreview.tahun_mulai,
      semester: nextPeriodPreview.semester,
    })
    setDialogOpen(true)
  }

  const openEditDialog = (period: Period) => {
    setEditingPeriod(period)
    form.reset({
      tahun_mulai: period.tahun_mulai,
      semester: period.semester,
    })
    setDialogOpen(true)
  }

  const invalidatePeriods = async () => {
    await queryClient.invalidateQueries({ queryKey: PERIODS_QUERY_KEY })
  }

  const handleSubmitForm = (values: PeriodeInput) => {
    startTransition(async () => {
      const result = editingPeriod
        ? await ubahPeriodeAction(editingPeriod.id, values)
        : await tambahPeriodeAction(values)

      if (!result.success) {
        toast.error(result.error ?? "Gagal menyimpan periode")
        return
      }

      toast.success(
        editingPeriod
          ? "Periode berhasil diperbarui"
          : "Periode baru berhasil ditambahkan",
      )
      setDialogOpen(false)
      await invalidatePeriods()
    })
  }

  const handleBuatBerikutnya = () => {
    startTransition(async () => {
      const result = await buatPeriodeBerikutnyaAction()
      if (!result.success) {
        toast.error(result.error ?? "Gagal membuat periode berikutnya")
        return
      }
      toast.success(
        `Berhasil membuat ${result.data?.nama ?? nextPeriodPreview.nama}`,
      )
      await invalidatePeriods()
    })
  }

  const handleJadikanAktif = (period: Period) => {
    startTransition(async () => {
      const result = await jadikanPeriodeAktifAction(period.id)
      if (!result.success) {
        toast.error(result.error ?? "Gagal mengubah periode aktif")
        return
      }
      toast.success(`${period.nama} ditetapkan sebagai periode aktif`)
      await invalidatePeriods()
    })
  }

  const handleKonfirmasiHapus = () => {
    if (!deletingPeriod) return
    const target = deletingPeriod
    startTransition(async () => {
      const result = await hapusPeriodeAction(target.id)
      if (!result.success) {
        toast.error(result.error ?? "Gagal menghapus periode")
        setDeletingPeriod(null)
        return
      }
      toast.success(`${target.nama} berhasil dihapus`)
      setDeletingPeriod(null)
      await invalidatePeriods()
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="font-heading text-xl font-bold uppercase tracking-wide">
            Daftar Periode Semester
          </CardTitle>
          <CardDescription>
            Hanya satu periode yang aktif pada satu waktu. Periode yang sudah
            memiliki nilai tidak dapat dihapus.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleBuatBerikutnya}
            className="gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Buat Periode Berikutnya ({nextPeriodPreview.nama})</span>
          </Button>

          <Button
            type="button"
            disabled={isPending}
            onClick={openAddDialog}
            className="gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Tambah Periode</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-md border border-border/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Periode</TableHead>
                <TableHead>Tahun Ajaran</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Belum ada data periode. Klik &ldquo;Buat Periode
                    Berikutnya&rdquo; atau &ldquo;Tambah Periode&rdquo;.
                  </TableCell>
                </TableRow>
              ) : (
                periods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">{period.nama}</TableCell>
                    <TableCell>
                      {period.tahun_mulai}-{period.tahun_mulai + 1}
                    </TableCell>
                    <TableCell className="capitalize">
                      {period.semester === "ganjil"
                        ? "Ganjil (Jul–Des)"
                        : "Genap (Jan–Jun)"}
                    </TableCell>
                    <TableCell>
                      {period.is_active ? (
                        <Badge className="gap-1 bg-primary text-primary-foreground">
                          <CheckCircle2
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          <span>Aktif</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Tidak Aktif</span>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {!period.is_active && (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            disabled={isPending}
                            onClick={() => handleJadikanAktif(period)}
                            className="cursor-pointer"
                          >
                            Jadikan Aktif
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={isPending}
                          onClick={() => openEditDialog(period)}
                          aria-label={`Ubah ${period.nama}`}
                          className="cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={isPending || period.is_active}
                          onClick={() => setDeletingPeriod(period)}
                          aria-label={`Hapus ${period.nama}`}
                          className="text-destructive hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Dialog Tambah / Ubah Periode */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold uppercase tracking-wide flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-primary" />
              {editingPeriod ? "Ubah Periode Semester" : "Tambah Periode Baru"}
            </DialogTitle>
            <DialogDescription>
              Tahun ajaran dimulai bulan Juli (Semester Ganjil: Juli–Desember,
              Semester Genap: Januari–Juni).
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmitForm)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="tahun_mulai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun Mulai Ajaran</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2020}
                        max={2100}
                        disabled={isPending}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? Number.NaN
                              : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <Select
                      disabled={isPending}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Pilih semester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ganjil">
                          Ganjil (Juli – Desember)
                        </SelectItem>
                        <SelectItem value="genap">
                          Genap (Januari – Juni)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                Pratinjau nama periode:{" "}
                <strong className="text-foreground">{previewNama}</strong>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isPending}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="cursor-pointer"
                >
                  {isPending && (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  )}
                  Simpan Periode
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Konfirmasi Hapus */}
      <AlertDialog
        open={Boolean(deletingPeriod)}
        onOpenChange={(open) => !open && setDeletingPeriod(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Periode Semester?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus{" "}
              <strong className="text-foreground">
                {deletingPeriod?.nama}
              </strong>
              . Periode hanya dapat dihapus apabila belum memiliki catatan nilai
              siswa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={handleKonfirmasiHapus}
              className="cursor-pointer"
            >
              {isPending ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
