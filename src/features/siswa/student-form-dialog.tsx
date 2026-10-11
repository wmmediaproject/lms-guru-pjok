"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, UserCheck, UserPlus } from "lucide-react"
import { toast } from "sonner"

import type { Student } from "@/lib/supabase/types"
import { KELAS_LIST } from "@/lib/sidebar-utils"
import { STUDENTS_ROOT_KEY } from "@/hooks/use-students"
import {
  studentSchema,
  type StudentFormValues,
  type StudentValidatedInput,
} from "@/lib/validators/siswa"
import { tambahSiswaAction, ubahSiswaAction } from "./actions"
import { Button } from "@/components/ui/button"
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
  FormDescription,
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

const GENDER_NONE_VALUE = "__KOSONG__"

export interface StudentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultKelas?: number
  student?: Student | null
}

export function StudentFormDialog({
  open,
  onOpenChange,
  defaultKelas = 1,
  student = null,
}: StudentFormDialogProps) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = React.useTransition()
  const isEditing = Boolean(student)

  const form = useForm<StudentFormValues, unknown, StudentValidatedInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      nisn: student?.nisn ?? "",
      nama: student?.nama ?? "",
      kelas: student?.kelas ?? defaultKelas,
      jenis_kelamin: student?.jenis_kelamin ?? null,
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        nisn: student?.nisn ?? "",
        nama: student?.nama ?? "",
        kelas: student?.kelas ?? defaultKelas,
        jenis_kelamin: student?.jenis_kelamin ?? null,
      })
    }
  }, [open, student, defaultKelas, form])

  const onSubmit = (values: StudentValidatedInput) => {
    startTransition(async () => {
      const result = student
        ? await ubahSiswaAction(student.id, values)
        : await tambahSiswaAction(values)

      if (!result.success) {
        const errorMessage = result.error ?? "Gagal menyimpan data siswa"
        if (errorMessage.toLowerCase().includes("nisn")) {
          form.setError("nisn", { message: errorMessage })
        }
        toast.error(errorMessage)
        return
      }

      const pindahKelas =
        student && Number(student.kelas) !== Number(values.kelas)

      toast.success(
        pindahKelas
          ? `Data ${values.nama} berhasil diperbarui dan dipindahkan ke Kelas ${values.kelas}`
          : student
            ? `Data siswa ${values.nama} berhasil diperbarui`
            : `Siswa ${values.nama} berhasil ditambahkan ke Kelas ${values.kelas}`,
      )

      onOpenChange(false)
      await queryClient.invalidateQueries({ queryKey: STUDENTS_ROOT_KEY })
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            {isEditing ? (
              <>
                <UserCheck className="h-5 w-5 text-primary" />
                <span>Ubah Data Siswa</span>
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-primary" />
                <span>Tambah Siswa Baru</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui NISN, nama, jenis kelamin, atau pindahkan siswa ke kelas lain."
              : "Masukkan data siswa baru. Jenis kelamin boleh dikosongkan."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="nisn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NISN</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Contoh: 0012345678"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Hanya angka (angka nol di depan tetap disimpan).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap Siswa</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Masukkan nama lengkap siswa"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="kelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelas</FormLabel>
                    <Select
                      disabled={isPending}
                      value={String(field.value)}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Pilih kelas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {KELAS_LIST.map((k) => (
                          <SelectItem
                            key={k}
                            value={String(k)}
                            className="cursor-pointer"
                          >
                            Kelas {k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jenis_kelamin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kelamin</FormLabel>
                    <Select
                      disabled={isPending}
                      value={field.value ?? GENDER_NONE_VALUE}
                      onValueChange={(val) =>
                        field.onChange(
                          val === GENDER_NONE_VALUE
                            ? null
                            : (val as "L" | "P"),
                        )
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Belum diisi (Kosong)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem
                          value={GENDER_NONE_VALUE}
                          className="cursor-pointer"
                        >
                          Belum diisi (Kosong)
                        </SelectItem>
                        <SelectItem value="L" className="cursor-pointer">
                          Laki-laki (L)
                        </SelectItem>
                        <SelectItem value="P" className="cursor-pointer">
                          Perempuan (P)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
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
                  <Loader2
                    className="mr-1.5 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                <span>{isEditing ? "Simpan Perubahan" : "Tambah Siswa"}</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
