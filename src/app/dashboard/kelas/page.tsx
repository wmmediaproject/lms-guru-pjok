import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import {
  hitungRingkasanKelas,
  type ClassSummary,
} from "@/lib/hitung/ringkasan-kelas"
import { ClassCardsGrid } from "@/features/kelas/class-cards-grid"

export const metadata: Metadata = {
  title: "Kelola Kelas — LMS Guru PJOK",
}

export default async function KelolaKelasPage() {
  let initialSummaries: ClassSummary[] | undefined = undefined

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("students")
      .select("*")

    if (data) {
      initialSummaries = hitungRingkasanKelas(data)
    }
  } catch {
    // Graceful fallback if DB is unreachable
  }

  return <ClassCardsGrid initialSummaries={initialSummaries} />
}
