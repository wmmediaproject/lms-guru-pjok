import type { Metadata } from "next"
import { Users } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"

export const metadata: Metadata = {
  title: "Kelola Kelas — LMS Guru PJOK",
}

export default function KelolaKelasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Kelas"
        description="Pilih Kelas 1 sampai Kelas 6 untuk mengelola daftar dan data siswa."
      />

      <EmptyState
        icon={Users}
        title="Belum Ada Data Kelas yang Ditampilkan"
        description="Gunakan menu Kelas 1–6 di bilah sisi untuk melihat dan mengelola daftar siswa per kelas."
      />
    </div>
  )
}
