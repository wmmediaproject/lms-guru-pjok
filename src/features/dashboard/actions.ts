import { createClient } from "@/lib/supabase/server"
import type { DashboardKelasRow, Grade, Period, Settings, Student } from "@/lib/supabase/types"
import { bandingkanPeriode } from "@/lib/hitung/periode"
import { KELAS_LIST } from "@/lib/sidebar-utils"

export interface DashboardData {
  rows: DashboardKelasRow[]
  activePeriodId: string | null
  periods: Period[]
  settings: Settings | null
  namaGuru: string | null
}

/**
 * Agregasi fallback di sisi aplikasi bila RPC get_dashboard_summary belum dipasang di remote Supabase.
 * Mengabaikan siswa berstatus 'lulus' dari total siswa aktif.
 */
function hitungAgregasiFallback(
  students: Student[],
  grades: Grade[],
): DashboardKelasRow[] {
  const activeStudents = students.filter((s) => s.status !== "lulus")
  const gradeByStudentId = new Map<string, Grade>()
  for (const g of grades) {
    gradeByStudentId.set(g.student_id, g)
  }

  return KELAS_LIST.map((kelas) => {
    const siswaKelas = activeStudents.filter((s) => s.kelas === kelas)
    const total_aktif = siswaKelas.length
    const total_laki = siswaKelas.filter((s) => s.jenis_kelamin === "L").length
    const total_perempuan = siswaKelas.filter((s) => s.jenis_kelamin === "P").length

    let jumlah_lengkap = 0
    let sumPraktek = 0
    let countPraktek = 0
    let sumUh = 0
    let countUh = 0
    let sumAsts = 0
    let countAsts = 0
    let sumAsas = 0
    let countAsas = 0
    let sumNilaiAkhir = 0
    let countNilaiAkhir = 0
    let jumlah_tuntas = 0
    let jumlah_belum_tuntas = 0

    for (const s of siswaKelas) {
      const g = gradeByStudentId.get(s.id)
      if (g) {
        if (g.nilai_akhir !== null && g.nilai_akhir !== undefined) {
          jumlah_lengkap++
          sumNilaiAkhir += g.nilai_akhir
          countNilaiAkhir++
        }
        if (g.nilai_praktek !== null && g.nilai_praktek !== undefined) {
          sumPraktek += g.nilai_praktek
          countPraktek++
        }
        if (g.nilai_uh !== null && g.nilai_uh !== undefined) {
          sumUh += g.nilai_uh
          countUh++
        }
        if (g.nilai_asts !== null && g.nilai_asts !== undefined) {
          sumAsts += g.nilai_asts
          countAsts++
        }
        if (g.nilai_asas !== null && g.nilai_asas !== undefined) {
          sumAsas += g.nilai_asas
          countAsas++
        }
        if (g.predikat === "Tuntas") jumlah_tuntas++
        if (g.predikat === "Belum Tuntas") jumlah_belum_tuntas++
      }
    }

    return {
      kelas,
      total_aktif,
      total_laki,
      total_perempuan,
      jumlah_lengkap,
      jumlah_belum: total_aktif - jumlah_lengkap,
      avg_praktek:
        countPraktek > 0 ? Math.round((sumPraktek / countPraktek) * 100) / 100 : 0,
      avg_uh:
        countUh > 0 ? Math.round((sumUh / countUh) * 100) / 100 : 0,
      avg_asts:
        countAsts > 0 ? Math.round((sumAsts / countAsts) * 100) / 100 : 0,
      avg_asas:
        countAsas > 0 ? Math.round((sumAsas / countAsas) * 100) / 100 : 0,
      avg_nilai_akhir:
        countNilaiAkhir > 0
          ? Math.round((sumNilaiAkhir / countNilaiAkhir) * 100) / 100
          : 0,
      jumlah_tuntas,
      jumlah_belum_tuntas,
    }
  })
}

/**
 * Mengambil data agregasi dashboard dari Supabase.
 * Pertama mencoba RPC SQL `get_dashboard_summary`, dan jika belum dipasang di remote DB,
 * otomatis menggunakan fallback query langsung ke tabel `students` dan `grades`.
 */
export async function fetchDashboardData(
  periodId?: string | null,
): Promise<DashboardData> {
  const empty: DashboardData = {
    rows: [],
    activePeriodId: null,
    periods: [],
    settings: null,
    namaGuru: null,
  }

  try {
    const supabase = await createClient()

    const [periodsRes, settingsRes, userRes] = await Promise.all([
      supabase
        .from("periods")
        .select("*")
        .order("tahun_mulai", { ascending: true }),
      supabase.from("settings").select("*").limit(1).maybeSingle(),
      supabase.auth.getUser(),
    ])

    const periods = [...(periodsRes.data ?? [])].sort(bandingkanPeriode)
    const settings = settingsRes.data ?? null
    const meta = userRes.data.user?.user_metadata
    const namaGuru =
      ((meta?.nama_lengkap || meta?.full_name || meta?.name) as
        | string
        | null) ?? null

    const activePeriod =
      periodId
        ? (periods.find((p) => p.id === periodId) ?? null)
        : (periods.find((p) => p.is_active) ?? periods[0] ?? null)

    if (!activePeriod) {
      return { ...empty, periods, settings, namaGuru }
    }

    // 1. Coba via RPC SQL `get_dashboard_summary`
    const { data: rows, error } = await supabase.rpc("get_dashboard_summary", {
      p_period_id: activePeriod.id,
    })

    if (!error && rows && rows.length > 0) {
      return {
        rows,
        activePeriodId: activePeriod.id,
        periods,
        settings,
        namaGuru,
      }
    }

    // 2. Fallback bila RPC belum dipasang di Supabase remote
    const [studentsRes, gradesRes] = await Promise.all([
      supabase.from("students").select("*"),
      supabase.from("grades").select("*").eq("period_id", activePeriod.id),
    ])

    const fallbackRows = hitungAgregasiFallback(
      studentsRes.data ?? [],
      gradesRes.data ?? [],
    )

    return {
      rows: fallbackRows,
      activePeriodId: activePeriod.id,
      periods,
      settings,
      namaGuru,
    }
  } catch (err) {
    console.error("[dashboard] fetchDashboardData:", err)
    return empty
  }
}
