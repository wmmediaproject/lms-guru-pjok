export type PredikatNilai = "Tuntas" | "Belum Tuntas"

export interface KomponenNilai {
  nilai_praktek: number | null | undefined
  nilai_uh: number | null | undefined
  nilai_asts: number | null | undefined
  nilai_asas: number | null | undefined
}

export interface BobotPenilaian {
  bobot_praktek: number
  bobot_uh: number
  bobot_asts: number
  bobot_asas: number
}

export const DEFAULT_BOBOT: BobotPenilaian = {
  bobot_praktek: 25,
  bobot_uh: 25,
  bobot_asts: 25,
  bobot_asas: 25,
}

export const DEFAULT_KKM = 75

function isValidScore(val: number | null | undefined): val is number {
  return typeof val === "number" && !Number.isNaN(val) && Number.isFinite(val)
}

/**
 * Menghitung Nilai Akhir dari 4 komponen nilai dan bobotnya (dalam persen, total 100).
 * Aturan PRD §5.3 & CLAUDE.md:
 * - Nilai kosong (null/undefined) != 0.
 * - Nilai Akhir HANYA dihitung jika keempat komponen (Praktek, UH, ASTS, ASAS) terisi.
 * - Dibulatkan 2 desimal (half-up, identik dengan PostgreSQL numeric `round(val, 2)`).
 */
export function hitungNilaiAkhir(
  nilai: KomponenNilai,
  bobot: BobotPenilaian = DEFAULT_BOBOT,
): number | null {
  const { nilai_praktek, nilai_uh, nilai_asts, nilai_asas } = nilai

  if (
    !isValidScore(nilai_praktek) ||
    !isValidScore(nilai_uh) ||
    !isValidScore(nilai_asts) ||
    !isValidScore(nilai_asas)
  ) {
    return null
  }

  const totalTertimbang =
    nilai_praktek * bobot.bobot_praktek +
    nilai_uh * bobot.bobot_uh +
    nilai_asts * bobot.bobot_asts +
    nilai_asas * bobot.bobot_asas

  const nilaiMentah = totalTertimbang / 100
  return Math.round((nilaiMentah + 1e-9) * 100) / 100
}

/**
 * Menentukan predikat ketuntasan berdasarkan Nilai Akhir dan KKM:
 * - Null jika Nilai Akhir masih null/kosong.
 * - 'Tuntas' jika Nilai Akhir >= KKM.
 * - 'Belum Tuntas' jika Nilai Akhir < KKM.
 */
export function tentukanPredikat(
  nilaiAkhir: number | null | undefined,
  kkm: number = DEFAULT_KKM,
): PredikatNilai | null {
  if (!isValidScore(nilaiAkhir)) {
    return null
  }

  return nilaiAkhir >= kkm ? "Tuntas" : "Belum Tuntas"
}

/**
 * Helper gabungan untuk menghitung nilai_akhir sekaligus predikat.
 */
export function hitungNilaiDanPredikat(
  nilai: KomponenNilai,
  bobot: BobotPenilaian = DEFAULT_BOBOT,
  kkm: number = DEFAULT_KKM,
): { nilai_akhir: number | null; predikat: PredikatNilai | null } {
  const nilai_akhir = hitungNilaiAkhir(nilai, bobot)
  const predikat = tentukanPredikat(nilai_akhir, kkm)
  return { nilai_akhir, predikat }
}
