import type { Metadata } from "next"
import Link from "next/link"
import { LayoutDashboard, Users } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Dashboard — LMS Guru PJOK",
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan statistik siswa, ketuntasan nilai, dan kelengkapan pengisian nilai PJOK."
      />

      <EmptyState
        icon={LayoutDashboard}
        title="Ringkasan Dashboard Belum Tersedia"
        description="Metrik dan grafik statistik kelas akan tampil setelah modul pengelolaan siswa dan nilai selesai dibangun."
        action={
          <Button asChild className="font-heading uppercase tracking-wider">
            <Link href="/dashboard/kelas">
              <Users className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Lihat Kelola Kelas
            </Link>
          </Button>
        }
      />
    </div>
  )
}
