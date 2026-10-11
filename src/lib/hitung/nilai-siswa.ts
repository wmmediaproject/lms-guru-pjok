import type { Grade, Student } from "@/lib/supabase/types"
import {
  DEFAULT_BOBOT,
  DEFAULT_KKM,
  hitungNilaiDanPredikat,
  type BobotPenilaian,
  type KomponenNilai,
  type PredikatNilai,
} from "@/lib/hitung/nilai-akhir"

export type GradeComponentKey =
  | "nilai_praktek"
  | "nilai_uh"
  | "nilai_asts"
  | "nilai_asas"

export const GRADE_COMPONENT_KEYS: readonly GradeComponentKey[] = [
  "nilai_praktek",
  "nilai_uh",
  "nilai_asts",
  "nilai_asas",
] as const

export interface StudentGradeRow {
  student_id: string
  nisn: string
  nama: string
  kelas: number
  jenis_kelamin: "L" | "P" | null
  grade_id: string | null
  period_id: string
  kelas_saat_nilai: number
  nilai_praktek: number | null
  nilai_uh: number | null
  nilai_asts: number | null
  nilai_asas: number | null
  nilai_akhir: number | null
  predikat: PredikatNilai | null
  keterangan: string | null
  updated_at: string | null
}

/**
 * Menggabungkan daftar siswa suatu kelas dengan daftar catatan nilai pada periode tertentu (LEFT JOIN).
 * Siswa yang belum memiliki baris di `grades` tetap disertakan dengan seluruh nilai bernilai `null` (bukan 0).
 */
export function gabungkanSiswaDanNilai(
  students: ReadonlyArray<Student>,
  grades: ReadonlyArray<Grade>,
  periodId: string,
): StudentGradeRow[] {
  const gradeByStudentId = new Map<string, Grade>()
  for (const g of grades) {
    if (g.period_id === periodId) {
      gradeByStudentId.set(g.student_id, g)
    }
  }

  const sortedStudents = students
    .filter((s) => s.status !== "lulus")
    .sort((a, b) => a.nama.localeCompare(b.nama, "id-ID"))

  return sortedStudents.map((student) => {
    const grade = gradeByStudentId.get(student.id)
    return {
      student_id: student.id,
      nisn: student.nisn,
      nama: student.nama,
      kelas: student.kelas,
      jenis_kelamin: student.jenis_kelamin,
      grade_id: grade?.id ?? null,
      period_id: periodId,
      kelas_saat_nilai: grade?.kelas_saat_nilai ?? student.kelas,
      nilai_praktek: grade?.nilai_praktek ?? null,
      nilai_uh: grade?.nilai_uh ?? null,
      nilai_asts: grade?.nilai_asts ?? null,
      nilai_asas: grade?.nilai_asas ?? null,
      nilai_akhir: grade?.nilai_akhir ?? null,
      predikat: grade?.predikat ?? null,
      keterangan: grade?.keterangan ?? null,
      updated_at: grade?.updated_at ?? null,
    }
  })
}

/**
 * Mengecek apakah siswa belum memiliki nilai lengkap (salah satu dari 4 komponen masih kosong/null).
 */
export function apakahBelumAdaNilai(nilai: KomponenNilai): boolean {
  return (
    nilai.nilai_praktek === null ||
    nilai.nilai_praktek === undefined ||
    nilai.nilai_uh === null ||
    nilai.nilai_uh === undefined ||
    nilai.nilai_asts === null ||
    nilai.nilai_asts === undefined ||
    nilai.nilai_asas === null ||
    nilai.nilai_asas === undefined
  )
}

/**
 * Menentukan Nilai Akhir & Predikat yang ditampilkan di tabel:
 * - Bila baris sedang diedit (isDirty), gunakan pratinjau instan dari fungsi murni `hitungNilaiDanPredikat`.
 * - Bila baris tidak diedit (sudah tersimpan), gunakan hasil `nilai_akhir` & `predikat` dari DB
 *   (dengan fallback ke fungsi murni apabila keempat komponen terisi).
 */
export function hitungTampilanNilaiAkhir(params: {
  nilai: KomponenNilai
  dbNilaiAkhir: number | null
  dbPredikat: PredikatNilai | null
  isDirty: boolean
  bobot?: BobotPenilaian
  kkm?: number
}): { nilai_akhir: number | null; predikat: PredikatNilai | null } {
  const {
    nilai,
    dbNilaiAkhir,
    dbPredikat,
    isDirty,
    bobot = DEFAULT_BOBOT,
    kkm = DEFAULT_KKM,
  } = params

  if (apakahBelumAdaNilai(nilai)) {
    return { nilai_akhir: null, predikat: null }
  }

  if (!isDirty && dbNilaiAkhir !== null && dbPredikat !== null) {
    return { nilai_akhir: dbNilaiAkhir, predikat: dbPredikat }
  }

  return hitungNilaiDanPredikat(nilai, bobot, kkm)
}
