export type SemesterType = "ganjil" | "genap"

export interface PeriodeRingkas {
  tahun_mulai: number
  semester: SemesterType
}

export interface HasilPeriodeBerikutnya {
  tahun_mulai: number
  semester: SemesterType
  nama: string
}

/**
 * Membentuk nama periode sesuai format standar kalender pendidikan:
 * `Semester {Ganjil|Genap} {TahunMulai}-{TahunSelesai}`
 * Contoh: (2026, 'ganjil') -> "Semester Ganjil 2026-2027"
 */
export function namaPeriode(
  tahunMulai: number,
  semester: SemesterType,
): string {
  const labelSemester = semester === "ganjil" ? "Ganjil" : "Genap"
  const tahunSelesai = tahunMulai + 1
  return `Semester ${labelSemester} ${tahunMulai}-${tahunSelesai}`
}

/**
 * Menghitung periode semester berikutnya sesuai kalender pendidikan pemerintah:
 * - Ganjil (Jul–Des) pada tahun T -> Genap (Jan–Jun) pada tahun ajaran T-(T+1)
 * - Genap (Jan–Jun) pada tahun ajaran T-(T+1) -> Ganjil (Jul–Des) pada tahun ajaran (T+1)-(T+2)
 */
export function periodeBerikutnya(
  periodeSaatIni: PeriodeRingkas,
): HasilPeriodeBerikutnya {
  if (periodeSaatIni.semester === "ganjil") {
    return {
      tahun_mulai: periodeSaatIni.tahun_mulai,
      semester: "genap",
      nama: namaPeriode(periodeSaatIni.tahun_mulai, "genap"),
    }
  }

  const tahunBerikutnya = periodeSaatIni.tahun_mulai + 1
  return {
    tahun_mulai: tahunBerikutnya,
    semester: "ganjil",
    nama: namaPeriode(tahunBerikutnya, "ganjil"),
  }
}

/**
 * Membandingkan dua periode secara kronologis (Ganjil T < Genap T < Ganjil T+1).
 */
export function bandingkanPeriode(
  a: PeriodeRingkas,
  b: PeriodeRingkas,
): number {
  if (a.tahun_mulai !== b.tahun_mulai) {
    return a.tahun_mulai - b.tahun_mulai
  }
  if (a.semester === b.semester) return 0
  return a.semester === "ganjil" ? -1 : 1
}

/**
 * Menentukan periode berikutnya dari daftar periode yang sudah ada
 * berdasarkan periode paling akhir secara kronologis.
 */
export function periodeBerikutnyaDariDaftar(
  daftarPeriode: ReadonlyArray<PeriodeRingkas>,
): HasilPeriodeBerikutnya {
  if (daftarPeriode.length === 0) {
    return {
      tahun_mulai: 2026,
      semester: "ganjil",
      nama: namaPeriode(2026, "ganjil"),
    }
  }

  const terurut = [...daftarPeriode].sort(bandingkanPeriode)
  const terakhir = terurut[terurut.length - 1]!
  return periodeBerikutnya(terakhir)
}
