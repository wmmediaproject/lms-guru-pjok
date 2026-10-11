"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { Grade, Student } from "@/lib/supabase/types"
import {
  gabungkanSiswaDanNilai,
  type StudentGradeRow,
} from "@/lib/hitung/nilai-siswa"

export function getGradesQueryKey(
  kelas: number,
  periodId: string | null,
) {
  return ["nilai", kelas, periodId ?? "belum-dipilih"] as const
}

export interface UseGradesOptions {
  kelas: number
  periodId: string | null
  initialStudents?: Student[]
  initialGrades?: Grade[]
}

export function useGrades({
  kelas,
  periodId,
  initialStudents,
  initialGrades,
}: UseGradesOptions) {
  const hasInitialData =
    initialStudents !== undefined &&
    initialGrades !== undefined &&
    Boolean(periodId)

  return useQuery<StudentGradeRow[]>({
    queryKey: getGradesQueryKey(kelas, periodId),
    enabled: Boolean(periodId),
    initialData:
      hasInitialData && periodId
        ? gabungkanSiswaDanNilai(initialStudents, initialGrades, periodId)
        : undefined,
    queryFn: async () => {
      if (!periodId) return []

      const supabase = createClient()

      const [studentsRes, gradesRes] = await Promise.all([
        supabase
          .from("students")
          .select("*")
          .eq("kelas", kelas)
          .order("nama", { ascending: true }),
        supabase
          .from("grades")
          .select("*")
          .eq("period_id", periodId),
      ])

      if (studentsRes.error) {
        throw new Error(studentsRes.error.message)
      }

      if (gradesRes.error) {
        throw new Error(gradesRes.error.message)
      }

      return gabungkanSiswaDanNilai(
        studentsRes.data ?? [],
        gradesRes.data ?? [],
        periodId,
      )
    },
  })
}
