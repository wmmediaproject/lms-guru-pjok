import type { Student } from "@/lib/supabase/types"
import { KELAS_LIST } from "@/lib/sidebar-utils"

export interface StudentWithGradesCount extends Student {
  grades_count: number
}

export interface ClassSummary {
  kelas: number
  total: number
  laki_laki: number
  perempuan: number
  belum_diisi: number
}

/**
 * Pure helper to calculate class summary counts (total, L, P, null) for Kelas 1-6.
 * Safe to invoke from both Server Components and Client Components.
 */
export function hitungRingkasanKelas(
  students: ReadonlyArray<Pick<Student, "kelas" | "jenis_kelamin">>,
): ClassSummary[] {
  return KELAS_LIST.map((kelas) => {
    const siswaKelas = students.filter((s) => Number(s.kelas) === kelas)
    let laki_laki = 0
    let perempuan = 0
    let belum_diisi = 0

    for (const s of siswaKelas) {
      if (s.jenis_kelamin === "L") laki_laki += 1
      else if (s.jenis_kelamin === "P") perempuan += 1
      else belum_diisi += 1
    }

    return {
      kelas,
      total: siswaKelas.length,
      laki_laki,
      perempuan,
      belum_diisi,
    }
  })
}
