import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import type { Period, Settings } from "@/lib/supabase/types"
import { bandingkanPeriode } from "@/lib/hitung/periode"
import { PageHeader } from "@/components/shared/page-header"
import { PengaturanTabs } from "@/features/pengaturan/pengaturan-tabs"

export const metadata: Metadata = {
  title: "Pengaturan — LMS Guru PJOK",
}

export default async function PengaturanPage() {
  let initialPeriods: Period[] | undefined = undefined
  let initialSettings: Settings | null = null
  let userEmail: string | null = null
  let profile: { nama_lengkap?: string | null; nip?: string | null; no_hp?: string | null } | null = null

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

    if (periodsRes.data) {
      initialPeriods = [...periodsRes.data].sort(bandingkanPeriode)
    }
    initialSettings = settingsRes.data ?? null
    userEmail = userRes.data.user?.email ?? null

    const meta = userRes.data.user?.user_metadata
    if (meta) {
      profile = {
        nama_lengkap: (meta.nama_lengkap || meta.full_name || meta.name) as string | null,
        nip: (meta.nip || null) as string | null,
        no_hp: (meta.no_hp || null) as string | null,
      }
    }
  } catch {
    // Graceful fallback if DB is unreachable
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola periode semester, bobot penilaian, KKM, tampilan aplikasi, dan akun admin."
      />

      <PengaturanTabs
        initialPeriods={initialPeriods}
        initialSettings={initialSettings}
        userEmail={userEmail}
        profile={profile}
      />
    </div>
  )
}
