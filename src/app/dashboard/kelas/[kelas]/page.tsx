import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { StudentWithGradesCount } from "@/lib/hitung/ringkasan-kelas"
import { ClassStudentsView } from "@/features/siswa/class-students-view"

interface KelasDetailPageProps {
  params: Promise<{ kelas: string }>
}

export async function generateMetadata({
  params,
}: KelasDetailPageProps): Promise<Metadata> {
  const { kelas } = await params
  return {
    title: `Kelas ${kelas} — LMS Guru PJOK`,
  }
}

export default async function KelasDetailPage({ params }: KelasDetailPageProps) {
  const { kelas } = await params
  const kelasNum = Number(kelas)

  if (!Number.isInteger(kelasNum) || kelasNum < 1 || kelasNum > 6) {
    notFound()
  }

  let initialStudents: StudentWithGradesCount[] | undefined = undefined

  try {
    const supabase = await createClient()
    const { data: students } = await supabase
      .from("students")
      .select("*")
      .eq("kelas", kelasNum)
      .order("nama", { ascending: true })

    if (students) {
      if (students.length === 0) {
        initialStudents = []
      } else {
        const ids = students.map((s) => s.id)
        const { data: gradesRows } = await supabase
          .from("grades")
          .select("student_id")
          .in("student_id", ids)

        const countMap = new Map<string, number>()
        for (const g of gradesRows ?? []) {
          countMap.set(g.student_id, (countMap.get(g.student_id) ?? 0) + 1)
        }

        initialStudents = students.map((s) => ({
          ...s,
          grades_count: countMap.get(s.id) ?? 0,
        }))
      }
    }
  } catch {
    // Graceful fallback if DB is unreachable
  }

  return (
    <ClassStudentsView kelas={kelasNum} initialStudents={initialStudents} />
  )
}
