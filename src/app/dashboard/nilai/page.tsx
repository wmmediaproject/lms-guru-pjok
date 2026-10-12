import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import type { Grade, Period, Settings, Student } from "@/lib/supabase/types"
import { bandingkanPeriode } from "@/lib/hitung/periode"
import { isValidKelasNumber } from "@/lib/validators/siswa"
import { GradesTableView } from "@/features/nilai/grades-table-view"

export const metadata: Metadata = {
  title: "Nilai Siswa — LMS Guru PJOK",
}

export interface NilaiSiswaPageProps {
  searchParams: Promise<{ kelas?: string }>
}

export default async function NilaiSiswaPage({
  searchParams,
}: NilaiSiswaPageProps) {
  const resolvedSearchParams = await searchParams
  const rawKelas = Number(resolvedSearchParams?.kelas)
  const initialKelas = isValidKelasNumber(rawKelas) ? rawKelas : 1

  let initialPeriods: Period[] | undefined = undefined
  let initialSettings: Settings | null = null
  let initialStudents: Student[] | undefined = undefined
  let initialGrades: Grade[] | undefined = undefined
  let initialNamaGuru: string | null = null

  try {
    const supabase = await createClient()
    const [periodsRes, settingsRes, studentsRes, userRes] = await Promise.all([
      supabase
        .from("periods")
        .select("*")
        .order("tahun_mulai", { ascending: true }),
      supabase.from("settings").select("*").limit(1).maybeSingle(),
      supabase
        .from("students")
        .select("*")
        .eq("kelas", initialKelas)
        .order("nama", { ascending: true }),
      supabase.auth.getUser(),
    ])

    if (periodsRes.data) {
      initialPeriods = [...periodsRes.data].sort(bandingkanPeriode)
    }
    if (settingsRes.data) {
      initialSettings = settingsRes.data
    }
    if (studentsRes.data) {
      initialStudents = studentsRes.data
    }

    const meta = userRes.data.user?.user_metadata
    if (meta) {
      initialNamaGuru =
        ((meta.nama_lengkap || meta.full_name || meta.name) as string | null) ??
        null
    }

    const activePeriod =
      initialPeriods?.find((p) => p.is_active) ?? initialPeriods?.[0] ?? null

    if (activePeriod) {
      const gradesRes = await supabase
        .from("grades")
        .select("*")
        .eq("period_id", activePeriod.id)

      if (gradesRes.data) {
        initialGrades = gradesRes.data
      }
    }
  } catch {
    // Fallback aman bila koneksi database belum tersedia
  }

  return (
    <GradesTableView
      initialKelas={initialKelas}
      initialPeriods={initialPeriods}
      initialSettings={initialSettings}
      initialStudents={initialStudents}
      initialGrades={initialGrades}
      initialNamaGuru={initialNamaGuru}
    />
  )
}
