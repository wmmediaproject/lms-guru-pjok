import type { Metadata } from "next"
import { Award } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"

export const metadata: Metadata = {
  title: "Nilai Siswa — LMS Guru PJOK",
}

export default function NilaiSiswaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nilai Siswa"
        description="Input dan kelola Nilai Praktek, UH, ASTS, ASAS, Nilai Akhir, dan Predikat per periode."
      />

      <EmptyState
        icon={Award}
        title="Tabel Nilai Siswa Belum Tersedia"
        description="Pilih kelas dan periode untuk menampilkan serta menginput nilai siswa secara otomatis."
      />
    </div>
  )
}
