"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createColumnHelper } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"
import {
  FileSpreadsheet,
  GraduationCap,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"

import {
  STUDENTS_ROOT_KEY,
  useStudentsByClass,
  type StudentWithGradesCount,
} from "@/hooks/use-students"
import { ClassSelect } from "@/components/shared/class-select"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  DataTable,
  type DataTableColumnMeta,
  type DataTableFeatures,
} from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cekNilaiSiswaAction, hapusSiswaAction } from "./actions"
import { CsvImportDialog } from "./csv-import-dialog"
import { StudentFormDialog } from "./student-form-dialog"

const columnHelper = createColumnHelper<
  DataTableFeatures,
  StudentWithGradesCount
>()

const EMPTY_STUDENTS: StudentWithGradesCount[] = []

export interface ClassStudentsViewProps {
  kelas: number
  initialStudents?: StudentWithGradesCount[]
}

export function ClassStudentsView({
  kelas,
  initialStudents,
}: ClassStudentsViewProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: students = EMPTY_STUDENTS } = useStudentsByClass(
    kelas,
    initialStudents,
  )

  const [formDialogOpen, setFormDialogOpen] = React.useState(false)
  const [csvDialogOpen, setCsvDialogOpen] = React.useState(false)
  const [editingStudent, setEditingStudent] =
    React.useState<StudentWithGradesCount | null>(null)
  const [deletingStudent, setDeletingStudent] =
    React.useState<StudentWithGradesCount | null>(null)
  const [deletingGradesCount, setDeletingGradesCount] = React.useState(0)
  const [isDeleting, startDeleteTransition] = React.useTransition()

  const handleOpenAdd = () => {
    setEditingStudent(null)
    setFormDialogOpen(true)
  }

  const handleOpenEdit = React.useCallback(
    (student: StudentWithGradesCount) => {
      setEditingStudent(student)
      setFormDialogOpen(true)
    },
    [],
  )

  const handleOpenDelete = React.useCallback(
    async (student: StudentWithGradesCount) => {
      setDeletingStudent(student)
      setDeletingGradesCount(student.grades_count ?? 0)

      // Pastikan jumlah nilai terbaru dari server
      const res = await cekNilaiSiswaAction(student.id)
      if (res.success && res.data) {
        setDeletingGradesCount(res.data.gradesCount)
      }
    },
    [],
  )

  const handleConfirmDelete = () => {
    if (!deletingStudent) return
    const target = deletingStudent

    startDeleteTransition(async () => {
      const result = await hapusSiswaAction(target.id)
      if (!result.success) {
        toast.error(result.error ?? "Gagal menghapus siswa")
        return
      }
      toast.success(`Siswa ${target.nama} berhasil dihapus`)
      setDeletingStudent(null)
      await queryClient.invalidateQueries({ queryKey: STUDENTS_ROOT_KEY })
    })
  }

  const columns = React.useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("nisn", {
          header: "NISN",
          cell: (info) => (
            <span className="font-mono text-xs font-medium">
              {info.getValue()}
            </span>
          ),
        }),
        columnHelper.accessor("nama", {
          header: "Nama Siswa",
          meta: {
            sticky: true,
            cellClassName: "font-medium text-foreground min-w-44",
          } satisfies DataTableColumnMeta,
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor("kelas", {
          header: "Kelas",
          cell: (info) => (
            <Badge variant="outline" className="font-semibold">
              Kelas {info.getValue()}
            </Badge>
          ),
        }),
        columnHelper.accessor("jenis_kelamin", {
          header: "Jenis Kelamin",
          cell: (info) => {
            const jk = info.getValue()
            if (jk === "L") {
              return <Badge variant="secondary">Laki-laki (L)</Badge>
            }
            if (jk === "P") {
              return <Badge variant="secondary">Perempuan (P)</Badge>
            }
            return (
              <span className="text-xs italic text-muted-foreground">
                Belum diisi
              </span>
            )
          },
        }),
        columnHelper.display({
          id: "aksi",
          header: () => <span className="sr-only">Aksi</span>,
          meta: {
            headerClassName: "text-right",
            cellClassName: "text-right",
          } satisfies DataTableColumnMeta,
          cell: (info) => {
            const rowStudent = info.row.original
            return (
              <div className="inline-flex items-center justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleOpenEdit(rowStudent)}
                  aria-label={`Ubah ${rowStudent.nama}`}
                  className="cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleOpenDelete(rowStudent)}
                  aria-label={`Hapus ${rowStudent.nama}`}
                  className="text-destructive hover:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            )
          },
        }),
      ]),
    [handleOpenDelete, handleOpenEdit],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Kelas ${kelas}`}
        description={`Daftar siswa Kelas ${kelas} (${students.length} siswa terdaftar).`}
        actions={
          <>
            <ClassSelect
              value={kelas}
              onValueChange={(nextKelas) => {
                if (typeof nextKelas === "number" && nextKelas !== kelas) {
                  router.push(`/dashboard/kelas/${nextKelas}`)
                }
              }}
              ariaLabel="Pindah tampilan kelas"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setCsvDialogOpen(true)}
              className="gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              <span>Impor CSV</span>
            </Button>
            <Button
              type="button"
              onClick={handleOpenAdd}
              className="gap-1.5 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah Siswa</span>
            </Button>
          </>
        }
      />

      {students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={`Belum Ada Siswa di Kelas ${kelas}`}
          description={`Tambahkan siswa baru secara manual atau impor via CSV ke Kelas ${kelas}.`}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCsvDialogOpen(true)}
                className="gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                <span>Impor CSV</span>
              </Button>
              <Button
                type="button"
                onClick={handleOpenAdd}
                className="gap-1.5 cursor-pointer"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span>Tambah Siswa Pertama</span>
              </Button>
            </div>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={students}
          searchPlaceholder="Cari nama atau NISN siswa..."
          emptyMessage="Tidak ada siswa yang cocok dengan kata kunci pencarian."
        />
      )}

      <StudentFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        defaultKelas={kelas}
        student={editingStudent}
      />

      <CsvImportDialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen} />

      <ConfirmDialog
        open={Boolean(deletingStudent)}
        onOpenChange={(open) => !open && setDeletingStudent(null)}
        title="Hapus Data Siswa?"
        description={
          <span>
            Apakah Anda yakin ingin menghapus siswa{" "}
            <strong className="text-foreground">
              {deletingStudent?.nama}
            </strong>{" "}
            (NISN:{" "}
            <strong className="font-mono text-foreground">
              {deletingStudent?.nisn}
            </strong>
            ) dari Kelas {deletingStudent?.kelas}?
          </span>
        }
        warningMessage={
          deletingGradesCount > 0 ? (
            <span>
              <strong>Peringatan Penting:</strong> Siswa ini sudah memiliki{" "}
              <strong>{deletingGradesCount} catatan nilai</strong> semester.
              Menghapus siswa ini akan{" "}
              <strong>ikut menghapus seluruh riwayat nilai</strong> siswa
              tersebut secara permanen!
            </span>
          ) : undefined
        }
        confirmLabel="Ya, Hapus Siswa"
        cancelLabel="Batal"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
