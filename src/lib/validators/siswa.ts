import { z } from "zod"

export const studentSchema = z.object({
  nisn: z
    .string()
    .trim()
    .min(1, "NISN wajib diisi")
    .regex(/^[0-9]+$/, "NISN hanya boleh berisi angka")
    .max(20, "NISN maksimal 20 digit"),
  nama: z
    .string()
    .trim()
    .min(1, "Nama siswa wajib diisi")
    .max(120, "Nama siswa maksimal 120 karakter"),
  kelas: z
    .number({
      error: "Kelas wajib dipilih",
    })
    .int("Kelas harus bilangan bulat")
    .min(1, "Kelas minimal Kelas 1")
    .max(6, "Kelas maksimal Kelas 6"),
  jenis_kelamin: z
    .enum(["L", "P"], {
      error: "Jenis kelamin harus Laki-laki (L) atau Perempuan (P)",
    })
    .nullable()
    .optional()
    .transform((val) => val ?? null),
})

export type StudentFormValues = z.input<typeof studentSchema>
export type StudentValidatedInput = z.output<typeof studentSchema>

export function isValidKelasNumber(val: unknown): val is number {
  return (
    typeof val === "number" &&
    Number.isInteger(val) &&
    val >= 1 &&
    val <= 6
  )
}
