"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  GraduationCap,
  UserPlus,
  Users,
} from "lucide-react"

import {
  useClassSummaries,
  type ClassSummary,
} from "@/hooks/use-students"
import { PageHeader } from "@/components/shared/page-header"
import { StudentFormDialog } from "@/features/siswa/student-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface ClassCardsGridProps {
  initialSummaries?: ClassSummary[]
}

export function ClassCardsGrid({ initialSummaries }: ClassCardsGridProps) {
  const { data: summaries = [] } = useClassSummaries(initialSummaries)
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)

  const totalSeluruhSiswa = summaries.reduce((acc, s) => acc + s.total, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Kelas"
        description={`Total ${totalSeluruhSiswa} siswa terdaftar pada Kelas 1 sampai Kelas 6. Pilih kelas untuk mengelola daftar siswa.`}
        actions={
          <Button
            type="button"
            onClick={() => setAddDialogOpen(true)}
            className="gap-1.5 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            <span>Tambah Siswa</span>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map((item) => (
          <Card
            key={item.kelas}
            className="flex flex-col justify-between border-border/80 transition-colors hover:border-primary/50"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="font-heading text-2xl font-extrabold uppercase tracking-wide flex items-center gap-2">
                  <GraduationCap
                    className="h-6 w-6 text-primary"
                    aria-hidden="true"
                  />
                  <span>Kelas {item.kelas}</span>
                </CardTitle>
                <Badge
                  variant={item.total > 0 ? "default" : "secondary"}
                  className="gap-1 font-semibold"
                >
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{item.total} Siswa</span>
                </Badge>
              </div>
              <CardDescription>
                Rekapitulasi siswa Kelas {item.kelas}
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-4">
              <div className="grid grid-cols-3 gap-2 rounded-md border border-border/70 bg-muted/30 p-3 text-center">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Laki-laki (L)
                  </p>
                  <p className="font-heading text-xl font-bold text-foreground">
                    {item.laki_laki}
                  </p>
                </div>
                <div className="border-x border-border/70">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Perempuan (P)
                  </p>
                  <p className="font-heading text-xl font-bold text-foreground">
                    {item.perempuan}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Belum Diisi
                  </p>
                  <p className="font-heading text-xl font-bold text-muted-foreground">
                    {item.belum_diisi}
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-0">
              <Button
                asChild
                variant="outline"
                className="w-full justify-between font-heading uppercase tracking-wider cursor-pointer"
              >
                <Link href={`/dashboard/kelas/${item.kelas}`}>
                  <span>Buka Kelas {item.kelas}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <StudentFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        defaultKelas={1}
      />
    </div>
  )
}
