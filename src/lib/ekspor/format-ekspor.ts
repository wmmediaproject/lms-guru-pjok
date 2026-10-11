import type { PredikatNilai } from "@/lib/hitung/nilai-akhir"
import type { StudentGradeRow } from "@/lib/hitung/nilai-siswa"

export type FormatFileEkspor = "xlsx" | "pdf"

export interface BarisEksporNilai {
  no: number
  nama: string
  nisn: string
  kelas: number
  nilai_praktek: number | null
  nilai_uh: number | null
  nilai_asts: number | null
  nilai_asas: number | null
  nilai_akhir: number | null
  predikat: PredikatNilai | null
  keterangan: string
}

export interface RingkasanEksporKelas {
  total_siswa: number
  rata_praktek: number | null
  rata_uh: number | null
  rata_asts: number | null
  rata_asas: number | null
  rata_nilai_akhir: number | null
  jumlah_tuntas: number
  jumlah_belum_tuntas: number
  jumlah_belum_lengkap: number
}

export interface DataEksporKelas {
  kelas: number
  namaSheet: string
  baris: BarisEksporNilai[]
  ringkasan: RingkasanEksporKelas
}

function hitungRataRata(values: ReadonlyArray<number | null>): number | null {
  const valid = values.filter(
    (v): v is number => typeof v === "number" && !Number.isNaN(v),
  )
  if (valid.length === 0) return null
  const sum = valid.reduce((acc, cur) => acc + cur, 0)
  return Math.round((sum / valid.length + 1e-9) * 100) / 100
}

/**
 * Mengubah nama periode (mis. "Semester Ganjil 2026-2027") menjadi string aman untuk nama file
 * (mis. "Ganjil_2026-2027").
 */
export function sanitizeNamaPeriodeUntukFile(namaPeriode: string): string {
  const tanpaSemester = namaPeriode
    .trim()
    .replace(/^semester\s+/i, "")
    .trim()

  const sumber = tanpaSemester.length > 0 ? tanpaSemester : namaPeriode.trim()

  return (
    sumber
      .replace(/[^a-zA-Z0-9-]+/g, "_")
      .replace(/^_+|_+$/g, "") || "Periode"
  )
}

/**
 * Membentuk nama file ekspor sesuai spesifikasi PRD §4.10 E-6 & ROADMAP §7A:
 * `Nilai_PJOK_Kelas{N}_{Periode}.xlsx` / `.pdf`
 */
export function buatNamaFileEkspor(params: {
  kelas: number | "semua"
  namaPeriode: string
  format: FormatFileEkspor
}): string {
  const { kelas, namaPeriode, format } = params
  const labelKelas = kelas === "semua" ? "Semua" : String(kelas)
  const periodeAman = sanitizeNamaPeriodeUntukFile(namaPeriode)
  return `Nilai_PJOK_Kelas${labelKelas}_${periodeAman}.${format}`
}

/**
 * Membentuk data baris ekspor beserta baris ringkasan (rata-rata & jumlah Tuntas/Belum Tuntas).
 * Sel nilai kosong tetap `null` (bukan 0) dan NISN selalu berupa string.
 */
export function bentukDataEksporKelas(
  kelas: number,
  rows: ReadonlyArray<StudentGradeRow>,
): DataEksporKelas {
  const baris: BarisEksporNilai[] = rows.map((row, idx) => ({
    no: idx + 1,
    nama: row.nama,
    nisn: String(row.nisn),
    kelas: row.kelas,
    nilai_praktek: row.nilai_praktek ?? null,
    nilai_uh: row.nilai_uh ?? null,
    nilai_asts: row.nilai_asts ?? null,
    nilai_asas: row.nilai_asas ?? null,
    nilai_akhir: row.nilai_akhir ?? null,
    predikat: row.predikat ?? null,
    keterangan: row.keterangan ?? "",
  }))

  let jumlah_tuntas = 0
  let jumlah_belum_tuntas = 0
  let jumlah_belum_lengkap = 0

  for (const b of baris) {
    if (b.predikat === "Tuntas") {
      jumlah_tuntas += 1
    } else if (b.predikat === "Belum Tuntas") {
      jumlah_belum_tuntas += 1
    } else {
      jumlah_belum_lengkap += 1
    }
  }

  const ringkasan: RingkasanEksporKelas = {
    total_siswa: baris.length,
    rata_praktek: hitungRataRata(baris.map((b) => b.nilai_praktek)),
    rata_uh: hitungRataRata(baris.map((b) => b.nilai_uh)),
    rata_asts: hitungRataRata(baris.map((b) => b.nilai_asts)),
    rata_asas: hitungRataRata(baris.map((b) => b.nilai_asas)),
    rata_nilai_akhir: hitungRataRata(baris.map((b) => b.nilai_akhir)),
    jumlah_tuntas,
    jumlah_belum_tuntas,
    jumlah_belum_lengkap,
  }

  return {
    kelas,
    namaSheet: `Kelas ${kelas}`,
    baris,
    ringkasan,
  }
}

/**
 * Memformat angka nilai untuk tampilan teks PDF (kosong -> "", bukan "0").
 */
export function formatSelNilaiEkspor(val: number | null): string {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return ""
  }
  return Number.isInteger(val) ? String(val) : val.toFixed(2)
}
