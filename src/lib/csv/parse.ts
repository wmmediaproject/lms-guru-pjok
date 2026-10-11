import Papa from "papaparse"
import {
  studentSchema,
  type StudentValidatedInput,
} from "@/lib/validators/siswa"

export const MAX_CSV_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
export const MAX_CSV_ROWS = 1000

export const CSV_TEMPLATE_CONTENT = [
  "nisn,nama,kelas,jenis_kelamin",
  "0012345678,Budi Santoso,1,L",
  "0012345679,Siti Aminah,1,P",
  "0012345680,Ahmad Fauzi,2,",
].join("\n")

export type CsvRowStatus = "valid" | "error" | "duplicate"

export interface CsvParsedRow {
  rowNumber: number
  rawNisn: string
  rawNama: string
  rawKelas: string
  rawJenisKelamin: string
  normalized: StudentValidatedInput | null
  status: CsvRowStatus
  errors: string[]
}

export interface CsvParseSummary {
  total: number
  valid: number
  error: number
  duplicate: number
}

export interface CsvParseResult {
  ok: boolean
  fatalError?: string
  rows: CsvParsedRow[]
  validRows: StudentValidatedInput[]
  failedRows: CsvParsedRow[]
  summary: CsvParseSummary
}

/**
 * Normalisasi NISN agar tetap berupa string dan mempertahankan angka nol di depan.
 * Menghapus spasi di awal/akhir serta tanda kutip tunggal awalan Excel ('00123...).
 */
export function normalisasiNisn(raw: unknown): string {
  if (raw === null || raw === undefined) return ""
  const str = String(raw).trim()
  return str.startsWith("'") ? str.slice(1).trim() : str
}

/**
 * Normalisasi jenis kelamin dari variasi input CSV:
 * - L, Laki-laki, Laki laki, Lakilaki -> 'L'
 * - P, Perempuan -> 'P'
 * - kosong / '-' -> null
 */
export function normalisasiJenisKelamin(
  raw: string | null | undefined,
):
  | { valid: true; value: "L" | "P" | null }
  | { valid: false; error: string } {
  if (raw === null || raw === undefined) {
    return { valid: true, value: null }
  }

  const clean = raw.trim().toLowerCase()
  if (clean === "" || clean === "-") {
    return { valid: true, value: null }
  }

  if (
    clean === "l" ||
    clean === "laki-laki" ||
    clean === "laki laki" ||
    clean === "lakilaki"
  ) {
    return { valid: true, value: "L" }
  }

  if (clean === "p" || clean === "perempuan") {
    return { valid: true, value: "P" }
  }

  return {
    valid: false,
    error:
      "Jenis kelamin tidak valid (gunakan L, P, Laki-laki, Perempuan, atau kosongkan)",
  }
}

function emptyResult(fatalError: string): CsvParseResult {
  return {
    ok: false,
    fatalError,
    rows: [],
    validRows: [],
    failedRows: [],
    summary: { total: 0, valid: 0, error: 0, duplicate: 0 },
  }
}

/**
 * Mem-parse teks CSV siswa dengan papaparse:
 * - Mendukung delimiter `,` dan `;`
 * - Menghapus UTF-8 BOM (`\uFEFF`)
 * - Header tidak peka huruf besar/kecil (`nisn`, `nama`, `kelas`, `jenis_kelamin`)
 * - Memvalidasi batas ukuran 2 MB dan maksimal 1.000 baris
 * - Mendeteksi error per baris dan duplikat NISN di dalam file
 */
export function parseStudentCsvText(
  csvContent: string,
  byteSize?: number,
): CsvParseResult {
  const actualByteSize =
    byteSize ?? new TextEncoder().encode(csvContent).byteLength

  if (actualByteSize > MAX_CSV_SIZE_BYTES) {
    return emptyResult("Ukuran file CSV melebihi batas maksimal 2 MB")
  }

  const strippedBom = csvContent.replace(/^\uFEFF/, "")
  if (strippedBom.trim().length === 0) {
    return emptyResult("File CSV kosong atau tidak memiliki data")
  }

  const parsed = Papa.parse<Record<string, string>>(strippedBom, {
    header: true,
    skipEmptyLines: "greedy",
    delimitersToGuess: [",", ";"],
    dynamicTyping: false,
    transformHeader: (header) =>
      header.replace(/^\uFEFF/, "").trim().toLowerCase(),
  })

  const fields = parsed.meta.fields ?? []
  const requiredHeaders = ["nisn", "nama", "kelas"]
  const missingHeaders = requiredHeaders.filter((h) => !fields.includes(h))

  if (missingHeaders.length > 0) {
    return emptyResult(
      `Header kolom CSV tidak sesuai. Kolom wajib yang belum ada: ${missingHeaders.join(", ")}`,
    )
  }

  const rawRows = parsed.data ?? []

  if (rawRows.length === 0) {
    return emptyResult("Tidak ada baris data siswa di dalam file CSV")
  }

  if (rawRows.length > MAX_CSV_ROWS) {
    return emptyResult(
      `Jumlah baris (${rawRows.length}) melebihi batas maksimal ${MAX_CSV_ROWS} baris per impor`,
    )
  }

  const seenNisn = new Map<string, number>()
  const rows: CsvParsedRow[] = []
  const validRows: StudentValidatedInput[] = []
  const failedRows: CsvParsedRow[] = []

  let validCount = 0
  let errorCount = 0
  let duplicateCount = 0

  rawRows.forEach((rawRow, idx) => {
    const rowNumber = idx + 2 // Baris 1 adalah header
    const rawNisn = normalisasiNisn(rawRow.nisn)
    const rawNama = (rawRow.nama ?? "").trim()
    const rawKelas = (rawRow.kelas ?? "").trim()
    const rawJenisKelamin = (rawRow.jenis_kelamin ?? "").trim()

    const rowErrors: string[] = []

    const jkResult = normalisasiJenisKelamin(rawJenisKelamin)
    if (!jkResult.valid) {
      rowErrors.push(jkResult.error)
    }

    const kelasNum = rawKelas === "" ? Number.NaN : Number(rawKelas)
    const zodResult = studentSchema.safeParse({
      nisn: rawNisn,
      nama: rawNama,
      kelas: kelasNum,
      jenis_kelamin: jkResult.valid ? jkResult.value : null,
    })

    if (!zodResult.success) {
      for (const issue of zodResult.error.issues) {
        if (!rowErrors.includes(issue.message)) {
          rowErrors.push(issue.message)
        }
      }
    }

    // Cek duplikat NISN di dalam file CSV yang sama
    let isDuplicate = false
    if (rawNisn !== "" && /^[0-9]+$/.test(rawNisn)) {
      const firstSeenRow = seenNisn.get(rawNisn)
      if (firstSeenRow !== undefined) {
        isDuplicate = true
        rowErrors.push(
          `Duplikat NISN di dalam file CSV (sama dengan baris #${firstSeenRow})`,
        )
      } else {
        seenNisn.set(rawNisn, rowNumber)
      }
    }

    if (rowErrors.length > 0) {
      const status: CsvRowStatus = isDuplicate ? "duplicate" : "error"
      if (status === "duplicate") duplicateCount += 1
      else errorCount += 1

      const failedEntry: CsvParsedRow = {
        rowNumber,
        rawNisn,
        rawNama,
        rawKelas,
        rawJenisKelamin,
        normalized: null,
        status,
        errors: rowErrors,
      }
      rows.push(failedEntry)
      failedRows.push(failedEntry)
    } else if (zodResult.success) {
      validCount += 1
      const validEntry: CsvParsedRow = {
        rowNumber,
        rawNisn,
        rawNama,
        rawKelas,
        rawJenisKelamin,
        normalized: zodResult.data,
        status: "valid",
        errors: [],
      }
      rows.push(validEntry)
      validRows.push(zodResult.data)
    }
  })

  return {
    ok: true,
    rows,
    validRows,
    failedRows,
    summary: {
      total: rows.length,
      valid: validCount,
      error: errorCount,
      duplicate: duplicateCount,
    },
  }
}

/**
 * Menghasilkan konten CSV berisi daftar baris yang gagal/dilewati beserta alasan gagalnya.
 */
export function buatCsvBarisGagal(failedRows: ReadonlyArray<CsvParsedRow>): string {
  const data = failedRows.map((row) => ({
    baris: row.rowNumber,
    nisn: row.rawNisn,
    nama: row.rawNama,
    kelas: row.rawKelas,
    jenis_kelamin: row.rawJenisKelamin,
    alasan_gagal: row.errors.join("; "),
  }))

  return Papa.unparse(data, {
    quotes: true,
  })
}
