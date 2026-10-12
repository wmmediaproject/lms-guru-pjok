"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import {
  hitungRingkasanKelas,
  type ClassSummary,
  type StudentWithGradesCount,
} from "@/lib/hitung/ringkasan-kelas"

export type { ClassSummary, StudentWithGradesCount }

export const STUDENTS_ROOT_KEY = ["siswa"] as const
export const studentsByClassKey = (kelas: number) => ["siswa", kelas] as const
export const CLASS_SUMMARIES_KEY = ["siswa", "ringkasan"] as const

export function useStudentsByClass(
  kelas: number,
  initialData?: StudentWithGradesCount[],
) {
  return useQuery<StudentWithGradesCount[]>({
    queryKey: studentsByClassKey(kelas),
    initialData,
    queryFn: async () => {
      const supabase = createClient()
      const { data: students, error } = await supabase
        .from("students")
        .select("*")
        .eq("kelas", kelas)
        .order("nama", { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      const list = (students ?? []).filter((s) => s.status !== "lulus")
      if (list.length === 0) return []

      const ids = list.map((s) => s.id)
      const { data: gradesRows } = await supabase
        .from("grades")
        .select("student_id")
        .in("student_id", ids)

      const countMap = new Map<string, number>()
      for (const g of gradesRows ?? []) {
        countMap.set(g.student_id, (countMap.get(g.student_id) ?? 0) + 1)
      }

      return list.map((s) => ({
        ...s,
        grades_count: countMap.get(s.id) ?? 0,
      }))
    },
  })
}

export function useClassSummaries(initialData?: ClassSummary[]) {
  return useQuery<ClassSummary[]>({
    queryKey: CLASS_SUMMARIES_KEY,
    initialData,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("students")
        .select("*")

      if (error) {
        throw new Error(error.message)
      }

      return hitungRingkasanKelas(data ?? [])
    },
  })
}
