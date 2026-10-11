import type { DashboardKelasRow } from "@/lib/supabase/types"

/** Total semua siswa aktif dari semua kelas */
export function hitungTotalSiswa(rows: DashboardKelasRow[]): number {
  return rows.reduce((acc, r) => acc + r.total_aktif, 0)
}

/** Total siswa yang sudah nilai lengkap (semua komponen terisi) */
export function hitungTotalLengkap(rows: DashboardKelasRow[]): number {
  return rows.reduce((acc, r) => acc + r.jumlah_lengkap, 0)
}

/** Total siswa yang belum memiliki nilai lengkap */
export function hitungTotalBelum(rows: DashboardKelasRow[]): number {
  return rows.reduce((acc, r) => acc + r.jumlah_belum, 0)
}

/** Persentase kelengkapan nilai (0–100) */
export function hitungPersentaseLengkap(rows: DashboardKelasRow[]): number {
  const total = hitungTotalSiswa(rows)
  if (total === 0) return 0
  return Math.round((hitungTotalLengkap(rows) / total) * 100)
}

/** Kelas-kelas yang belum semua nilainya lengkap */
export function kelasBelumLengkap(rows: DashboardKelasRow[]): number[] {
  return rows
    .filter((r) => r.jumlah_belum > 0)
    .map((r) => r.kelas)
    .sort((a, b) => a - b)
}

/** Rata-rata nilai akhir seluruh kelas (dari baris yang ada data) */
export function hitungRataRataKeseluruhan(rows: DashboardKelasRow[]): number | null {
  const rowsWithData = rows.filter((r) => r.jumlah_lengkap > 0)
  if (rowsWithData.length === 0) return null
  const sum = rowsWithData.reduce((acc, r) => acc + r.avg_nilai_akhir, 0)
  return Math.round((sum / rowsWithData.length) * 100) / 100
}

export interface DataGrafikKomponen {
  kelas: string
  Praktek: number
  UH: number
  ASTS: number
  ASAS: number
}

/** Menyiapkan data untuk bar chart rata-rata komponen per kelas */
export function siapkanDataGrafikKomponen(
  rows: DashboardKelasRow[],
): DataGrafikKomponen[] {
  return rows.map((r) => ({
    kelas: `Kelas ${r.kelas}`,
    Praktek: r.jumlah_lengkap > 0 ? Number(r.avg_praktek.toFixed(1)) : 0,
    UH: r.jumlah_lengkap > 0 ? Number(r.avg_uh.toFixed(1)) : 0,
    ASTS: r.jumlah_lengkap > 0 ? Number(r.avg_asts.toFixed(1)) : 0,
    ASAS: r.jumlah_lengkap > 0 ? Number(r.avg_asas.toFixed(1)) : 0,
  }))
}

export interface DataGrafikKetuntasan {
  kelas: string
  Tuntas: number
  "Belum Tuntas": number
}

/** Menyiapkan data untuk bar chart Tuntas/Belum Tuntas per kelas */
export function siapkanDataGrafikKetuntasan(
  rows: DashboardKelasRow[],
): DataGrafikKetuntasan[] {
  return rows.map((r) => ({
    kelas: `Kelas ${r.kelas}`,
    Tuntas: r.jumlah_tuntas,
    "Belum Tuntas": r.jumlah_belum_tuntas,
  }))
}

export interface DataGrafikJenisKelamin {
  name: string
  value: number
}

/** Menyiapkan data untuk pie chart sebaran L/P */
export function siapkanDataGrafikJenisKelamin(
  rows: DashboardKelasRow[],
): DataGrafikJenisKelamin[] {
  const totalL = rows.reduce((acc, r) => acc + r.total_laki, 0)
  const totalP = rows.reduce((acc, r) => acc + r.total_perempuan, 0)
  return [
    { name: "Laki-laki", value: totalL },
    { name: "Perempuan", value: totalP },
  ]
}
