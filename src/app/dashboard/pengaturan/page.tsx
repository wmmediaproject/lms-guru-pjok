import type { Metadata } from "next"
import { Settings } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"

export const metadata: Metadata = {
  title: "Pengaturan — LMS Guru PJOK",
}

export default function PengaturanPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola periode semester, bobot penilaian, KKM, tampilan aplikasi, dan akun admin."
      />

      <EmptyState
        icon={Settings}
        title="Modul Pengaturan Sedang Disiapkan"
        description="Pengaturan periode semester, bobot nilai (Praktek, UH, ASTS, ASAS), KKM, tampilan, dan kata sandi akan tersedia pada Fase 3."
      />
    </div>
  )
}
