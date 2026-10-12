"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  FileSpreadsheet,
  GraduationCap,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"

import {
  useClassSummaries,
  type ClassSummary,
} from "@/hooks/use-students"
import { ExportStudentsButton } from "@/components/shared/export-students-button"
import { PageHeader } from "@/components/shared/page-header"
import { NaikKelasDialog } from "@/features/kelas/naik-kelas-dialog"
import { CsvImportDialog } from "@/features/siswa/csv-import-dialog"
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
  const [csvDialogOpen, setCsvDialogOpen] = React.useState(false)
  const [naikKelasOpen, setNaikKelasOpen] = React.useState(false)

  const totalSeluruhSiswa = summaries.reduce((acc, s) => acc + s.total, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Kelas"
        description={`Total ${totalSeluruhSiswa} siswa aktif terdaftar pada Kelas 1 sampai Kelas 6. Pilih kelas untuk mengelola daftar siswa.`}
        actions={
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNaikKelasOpen(true)}
              className="w-full sm:w-auto justify-center gap-1.5 cursor-pointer"
            >
              <TrendingUp
                className="h-4 w-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">Naik Kelas Massal</span>
            </Button>
            <ExportStudentsButton
              disabled={totalSeluruhSiswa === 0}
              className="w-full sm:w-auto justify-center"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setCsvDialogOpen(true)}
              className="w-full sm:w-auto justify-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet
                className="h-4 w-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">Impor CSV</span>
            </Button>
            <Button
              type="button"
              onClick={() => setAddDialogOpen(true)}
              className="w-full sm:w-auto justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Tambah Siswa</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map((item) => (
          <Card
            key={item.kelas}
            className="flex flex-col justify-between border-border/80 transition-all hover:border-primary/50 hover:shadow-xs"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="font-heading text-xl sm:text-2xl font-extrabold uppercase tracking-wide flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <GraduationCap
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>
                  <span>Kelas {item.kelas}</span>
                </CardTitle>
                <Badge
                  variant={item.total > 0 ? "default" : "secondary"}
                  className="gap-1 font-semibold shrink-0"
                >
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{item.total} Siswa</span>
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Rekapitulasi siswa aktif Kelas {item.kelas}
              </CardDescription>
            </CardHeader>

            <CardContent className="py-1">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 rounded-lg border border-border/70 bg-muted/30 p-2.5 sm:p-3 text-center">
                <div className="min-w-0 px-1">
                  <p className="text-[11px] font-medium text-muted-foreground truncate">
                    Laki-laki (L)
                  </p>
                  <p className="font-heading text-lg sm:text-xl font-bold text-foreground mt-0.5">
                    {item.laki_laki}
                  </p>
                </div>
                <div className="border-x border-border/70 min-w-0 px-1">
                  <p className="text-[11px] font-medium text-muted-foreground truncate">
                    Perempuan (P)
                  </p>
                  <p className="font-heading text-lg sm:text-xl font-bold text-foreground mt-0.5">
                    {item.perempuan}
                  </p>
                </div>
                <div className="min-w-0 px-1">
                  <p className="text-[11px] font-medium text-muted-foreground truncate">
                    Belum Diisi
                  </p>
                  <p className="font-heading text-lg sm:text-xl font-bold text-muted-foreground mt-0.5">
                    {item.belum_diisi}
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="px-4 py-3.5">
              <Button
                asChild
                variant="outline"
                className="w-full h-9 px-3.5 justify-between font-heading uppercase tracking-wider cursor-pointer hover:bg-primary/5 hover:border-primary/40"
              >
                <Link href={`/dashboard/kelas/${item.kelas}`}>
                  <span>Buka Kelas {item.kelas}</span>
                  <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
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

      <CsvImportDialog
        open={csvDialogOpen}
        onOpenChange={setCsvDialogOpen}
      />

      <NaikKelasDialog
        open={naikKelasOpen}
        onOpenChange={setNaikKelasOpen}
        initialSummaries={initialSummaries}
      />
    </div>
  )
}
