import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { GraduationCap } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Kelas ${kelasNum}`}
        description={`Daftar dan pengelolaan data siswa untuk Kelas ${kelasNum}.`}
      />

      <EmptyState
        icon={GraduationCap}
        title={`Belum Ada Siswa di Kelas ${kelasNum}`}
        description={`Data siswa Kelas ${kelasNum} akan tampil di sini setelah modul pengelolaan siswa selesai.`}
      />
    </div>
  )
}
