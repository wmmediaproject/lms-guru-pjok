import { z } from "zod"

export const MAX_KETERANGAN_LENGTH = 300

/**
 * Mengecek apakah angka memiliki maksimal 2 angka di belakang koma.
 */
export function hasAtMostTwoDecimals(val: number): boolean {
  if (!Number.isFinite(val)) return false
  const rounded = Math.round((val + Number.EPSILON) * 100) / 100
  return Math.abs(val - rounded) < 1e-6
}

export const nilaiKomponenSchema = z
  .number({
    message: "Nilai harus berupa angka",
  })
  .min(0, "Nilai tidak boleh kurang dari 0")
  .max(100, "Nilai tidak boleh lebih dari 100")
  .refine(hasAtMostTwoDecimals, {
    message: "Nilai maksimal memiliki 2 angka di belakang koma",
  })
  .nullable()

export const keteranganNilaiSchema = z
  .string()
  .max(
    MAX_KETERANGAN_LENGTH,
    `Keterangan maksimal ${MAX_KETERANGAN_LENGTH} karakter`,
  )
  .transform((val) => {
    const trimmed = val.trim()
    return trimmed.length === 0 ? null : trimmed
  })
  .nullable()

export const upsertGradeSchema = z.object({
  student_id: z.string().uuid("ID siswa tidak valid"),
  period_id: z.string().uuid("ID periode tidak valid"),
  kelas_saat_nilai: z
    .number({ message: "Kelas harus berupa angka" })
    .int("Kelas harus bilangan bulat")
    .min(1, "Kelas minimal Kelas 1")
    .max(6, "Kelas maksimal Kelas 6"),
  nilai_praktek: nilaiKomponenSchema,
  nilai_uh: nilaiKomponenSchema,
  nilai_asts: nilaiKomponenSchema,
  nilai_asas: nilaiKomponenSchema,
  keterangan: keteranganNilaiSchema,
})

export type UpsertGradeInput = z.infer<typeof upsertGradeSchema>

export type ParseGradeCellResult =
  | { valid: true; value: number | null }
  | { valid: false; error: string }

/**
 * Mem-parse input string dari sel nilai inline:
 * - String kosong ("") -> { valid: true, value: null } (bukan 0)
 * - Mendukung koma atau titik sebagai pemisah desimal (mis. "85,5" -> 85.5)
 * - Menolak angka di luar 0..100, bukan angka, atau > 2 desimal
 */
export function parseGradeCellInput(raw: string): ParseGradeCellResult {
  const trimmed = raw.trim()
  if (trimmed === "") {
    return { valid: true, value: null }
  }

  const normalized = trimmed.replace(",", ".")

  // Format angka desimal opsional (boleh bulat atau desimal)
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return {
      valid: false,
      error: "Nilai harus berupa angka antara 0 sampai 100",
    }
  }

  const num = Number(normalized)
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return {
      valid: false,
      error: "Nilai harus berupa angka yang valid",
    }
  }

  if (num < 0) {
    return {
      valid: false,
      error: "Nilai tidak boleh kurang dari 0",
    }
  }

  if (num > 100) {
    return {
      valid: false,
      error: "Nilai tidak boleh lebih dari 100",
    }
  }

  const decimalPart = normalized.split(".")[1]
  if (decimalPart && decimalPart.length > 2) {
    return {
      valid: false,
      error: "Nilai maksimal memiliki 2 angka di belakang koma",
    }
  }

  const validated = nilaiKomponenSchema.safeParse(num)
  if (!validated.success) {
    return {
      valid: false,
      error: validated.error.issues[0]?.message ?? "Nilai tidak valid",
    }
  }

  return { valid: true, value: validated.data }
}

/**
 * Memformat nilai angka (atau null) menjadi string untuk ditampilkan di input sel.
 */
export function formatGradeCellValue(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return ""
  }
  return String(val)
}
