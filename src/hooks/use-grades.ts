"use client"

import * as React from "react"
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { Grade, Student } from "@/lib/supabase/types"
import { studentsByClassKey, type StudentWithGradesCount } from "@/hooks/use-students"
import {
  gabungkanSiswaDanNilai,
  type StudentGradeRow,
} from "@/lib/hitung/nilai-siswa"

export const GRADES_ROOT_KEY = ["nilai"] as const

export function getGradesQueryKey(
  kelas: number,
  periodId: string | null,
) {
  return [...GRADES_ROOT_KEY, kelas, periodId ?? "belum-dipilih"] as const
}

/**
 * Menyinkronkan perubahan data siswa (NISN, nama, kelas, jenis kelamin)
 * secara langsung ke seluruh cache tabel nilai (`["nilai", ...]`).
 */
export function syncStudentToGradesCache(
  queryClient: QueryClient,
  student: Student,
  previousKelas?: number,
) {
  const queries = queryClient.getQueriesData<StudentGradeRow[]>({
    queryKey: GRADES_ROOT_KEY,
  })

  for (const [queryKey, oldRows] of queries) {
    if (!oldRows) continue
    const [, queryKelas, queryPeriodId] = queryKey as [
      string,
      number | undefined,
      string | undefined,
    ]

    if (
      previousKelas !== undefined &&
      previousKelas !== student.kelas &&
      queryKelas === previousKelas
    ) {
      queryClient.setQueryData<StudentGradeRow[]>(
        queryKey,
        oldRows.filter((row) => row.student_id !== student.id),
      )
      continue
    }

    if (queryKelas === student.kelas) {
      const exists = oldRows.some((row) => row.student_id === student.id)
      const nextRows = exists
        ? oldRows.map((row) =>
            row.student_id === student.id
              ? {
                  ...row,
                  nisn: student.nisn,
                  nama: student.nama,
                  kelas: student.kelas,
                  jenis_kelamin: student.jenis_kelamin,
                }
              : row,
          )
        : typeof queryPeriodId === "string" && queryPeriodId !== "belum-dipilih"
          ? [
              ...oldRows,
              {
                student_id: student.id,
                nisn: student.nisn,
                nama: student.nama,
                kelas: student.kelas,
                jenis_kelamin: student.jenis_kelamin,
                grade_id: null,
                period_id: queryPeriodId,
                kelas_saat_nilai: student.kelas,
                nilai_praktek: null,
                nilai_uh: null,
                nilai_asts: null,
                nilai_asas: null,
                nilai_akhir: null,
                predikat: null,
                keterangan: null,
                updated_at: null,
              },
            ]
          : oldRows

      queryClient.setQueryData<StudentGradeRow[]>(
        queryKey,
        [...nextRows].sort((a, b) => a.nama.localeCompare(b.nama, "id-ID")),
      )
    }
  }

  if (previousKelas !== undefined && previousKelas !== student.kelas) {
    queryClient.setQueryData<StudentWithGradesCount[]>(
      studentsByClassKey(previousKelas),
      (oldList) =>
        oldList ? oldList.filter((s) => s.id !== student.id) : oldList,
    )
  }

  queryClient.setQueryData<StudentWithGradesCount[]>(
    studentsByClassKey(student.kelas),
    (oldList) => {
      if (!oldList) return oldList
      const exists = oldList.some((s) => s.id === student.id)
      const nextList = exists
        ? oldList.map((s) =>
            s.id === student.id
              ? {
                  ...s,
                  nisn: student.nisn,
                  nama: student.nama,
                  kelas: student.kelas,
                  jenis_kelamin: student.jenis_kelamin,
                }
              : s,
          )
        : [...oldList, { ...student, grades_count: 0 }]
      return [...nextList].sort((a, b) => a.nama.localeCompare(b.nama, "id-ID"))
    },
  )
}

/**
 * Menghapus baris siswa dari cache tabel nilai saat siswa dihapus.
 */
export function removeStudentFromGradesCache(
  queryClient: QueryClient,
  studentId: string,
) {
  queryClient.setQueriesData<StudentGradeRow[]>(
    { queryKey: GRADES_ROOT_KEY },
    (oldRows) => {
      if (!oldRows) return oldRows
      return oldRows.filter((row) => row.student_id !== studentId)
    },
  )
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
  const queryClient = useQueryClient()
  const hasInitialData =
    initialStudents !== undefined &&
    initialGrades !== undefined &&
    Boolean(periodId)

  const query = useQuery<StudentGradeRow[]>({
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

  // Sinkronkan bila prop initialStudents dari Server Component diperbarui (mis. pasca revalidatePath)
  const prevInitialStudentsRef = React.useRef(initialStudents)
  React.useEffect(() => {
    if (
      prevInitialStudentsRef.current !== initialStudents &&
      initialStudents &&
      periodId
    ) {
      prevInitialStudentsRef.current = initialStudents
      for (const s of initialStudents) {
        syncStudentToGradesCache(queryClient, s)
      }
    }
  }, [initialStudents, periodId, queryClient])

  // Pastikan data NISN & profil siswa di tabel nilai selalu tersinkron dengan cache siswa terbaru bila tersedia
  const cachedClassStudents = queryClient.getQueryData<StudentWithGradesCount[]>(
    studentsByClassKey(kelas),
  )

  const syncedData = React.useMemo(() => {
    if (!query.data) return query.data
    if (!cachedClassStudents || cachedClassStudents.length === 0) {
      return query.data
    }

    const studentMap = new Map(cachedClassStudents.map((s) => [s.id, s]))
    return query.data.map((row) => {
      const latestStudent = studentMap.get(row.student_id)
      if (!latestStudent) return row
      if (
        row.nisn === latestStudent.nisn &&
        row.nama === latestStudent.nama &&
        row.kelas === latestStudent.kelas &&
        row.jenis_kelamin === latestStudent.jenis_kelamin
      ) {
        return row
      }
      return {
        ...row,
        nisn: latestStudent.nisn,
        nama: latestStudent.nama,
        kelas: latestStudent.kelas,
        jenis_kelamin: latestStudent.jenis_kelamin,
      }
    })
  }, [query.data, cachedClassStudents])

  return {
    ...query,
    data: syncedData,
  }
}

