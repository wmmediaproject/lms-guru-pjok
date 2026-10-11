import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { studentSchema } from "@/lib/validators/siswa"
import {
  hitungRingkasanKelas,
  type StudentWithGradesCount,
} from "@/lib/hitung/ringkasan-kelas"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ClassCardsGrid } from "@/features/kelas/class-cards-grid"
import { ClassStudentsView } from "./class-students-view"

// Mock next/navigation and next/cache
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  notFound: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const mockFrom = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}))

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

describe("Fase 4 — Kelola Kelas & Data Siswa", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("1. Validasi Skema Siswa (src/lib/validators/siswa.ts)", () => {
    it("menerima NISN hanya angka dan mempertahankan angka nol di depan", () => {
      const valid = studentSchema.safeParse({
        nisn: "0012345678",
        nama: "Budi Santoso",
        kelas: 4,
      })
      expect(valid.success).toBe(true)
      if (valid.success) {
        expect(valid.data.nisn).toBe("0012345678")
        expect(valid.data.jenis_kelamin).toBeNull()
      }
    })

    it("menolak NISN yang mengandung huruf atau simbol dengan pesan jelas", () => {
      const invalidNisn = studentSchema.safeParse({
        nisn: "00123ABC",
        nama: "Budi Santoso",
        kelas: 4,
      })
      expect(invalidNisn.success).toBe(false)
      if (!invalidNisn.success) {
        expect(invalidNisn.error.issues[0]?.message).toBe(
          "NISN hanya boleh berisi angka",
        )
      }
    })

    it("menolak kelas di luar rentang 1–6", () => {
      expect(
        studentSchema.safeParse({
          nisn: "0011223344",
          nama: "Siti Aminah",
          kelas: 0,
        }).success,
      ).toBe(false)

      expect(
        studentSchema.safeParse({
          nisn: "0011223344",
          nama: "Siti Aminah",
          kelas: 7,
        }).success,
      ).toBe(false)
    })
  })

  describe("2. Ringkasan Kelas 1–6 (hitungRingkasanKelas)", () => {
    it("menghitung jumlah siswa, Laki-laki (L), Perempuan (P), dan Belum Diisi untuk Kelas 1–6", () => {
      const ringkasan = hitungRingkasanKelas([
        { kelas: 1, jenis_kelamin: "L" },
        { kelas: 1, jenis_kelamin: "P" },
        { kelas: 1, jenis_kelamin: null },
        { kelas: 4, jenis_kelamin: "L" },
      ])

      expect(ringkasan).toHaveLength(6)
      expect(ringkasan[0]).toEqual({
        kelas: 1,
        total: 3,
        laki_laki: 1,
        perempuan: 1,
        belum_diisi: 1,
      })
      expect(ringkasan[3]).toEqual({
        kelas: 4,
        total: 1,
        laki_laki: 1,
        perempuan: 0,
        belum_diisi: 0,
      })
    })
  })

  describe("3. Server Actions Siswa (Penolakan NISN Duplikat & Pindah Kelas)", () => {
    it("tambahSiswaAction menolak NISN ganda (23505) dengan pesan Bahasa Indonesia yang jelas", async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "23505", message: "duplicate key value" },
            }),
          }),
        }),
      })

      const { tambahSiswaAction } = await import("./actions")
      const res = await tambahSiswaAction({
        nisn: "0012345678",
        nama: "Andi Pratama",
        kelas: 2,
        jenis_kelamin: null,
      })

      expect(res.success).toBe(false)
      expect(res.error).toBe("NISN sudah terdaftar pada siswa lain")
    })

    it("ubahSiswaAction mendukung pemindahan siswa ke kelas lain", async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "student-1",
                  nisn: "0012345678",
                  nama: "Andi Pratama",
                  kelas: 3,
                  jenis_kelamin: "L",
                  created_at: "",
                  updated_at: "",
                },
                error: null,
              }),
            }),
          }),
        }),
      })

      const { ubahSiswaAction } = await import("./actions")
      const res = await ubahSiswaAction("student-1", {
        nisn: "0012345678",
        nama: "Andi Pratama",
        kelas: 3,
        jenis_kelamin: "L",
      })

      expect(res.success).toBe(true)
      expect(res.data?.kelas).toBe(3)
    })
  })

  describe("4. Komponen UI Kelas, DataTable (Cari & Paginasi), dan ConfirmDialog", () => {
    it("merender kartu Kelas 1–6 di halaman indeks Kelola Kelas", () => {
      const qc = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const summaries = hitungRingkasanKelas([
        { kelas: 1, jenis_kelamin: "L" },
        { kelas: 1, jenis_kelamin: "P" },
      ])

      render(
        <QueryClientProvider client={qc}>
          <ClassCardsGrid initialSummaries={summaries} />
        </QueryClientProvider>,
      )

      expect(screen.getByText("Kelas 1")).toBeDefined()
      expect(screen.getByText("Kelas 6")).toBeDefined()
      expect(screen.getByText("2 Siswa")).toBeDefined()
    })

    it("memfilter siswa berdasarkan pencarian nama/NISN pada DataTable", () => {
      const qc = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const sampleStudents: StudentWithGradesCount[] = [
        {
          id: "s-1",
          nisn: "0011111111",
          nama: "Ahmad Fauzi",
          kelas: 3,
          jenis_kelamin: "L",
          created_at: "",
          updated_at: "",
          grades_count: 0,
        },
        {
          id: "s-2",
          nisn: "0022222222",
          nama: "Siti Rahma",
          kelas: 3,
          jenis_kelamin: null,
          created_at: "",
          updated_at: "",
          grades_count: 2,
        },
      ]

      render(
        <QueryClientProvider client={qc}>
          <ClassStudentsView kelas={3} initialStudents={sampleStudents} />
        </QueryClientProvider>,
      )

      expect(screen.getByText("Ahmad Fauzi")).toBeDefined()
      expect(screen.getByText("Siti Rahma")).toBeDefined()
      expect(screen.getByText("Belum diisi")).toBeDefined()

      // Cari berdasarkan NISN Siti Rahma
      const searchInput = screen.getByPlaceholderText(
        "Cari nama atau NISN siswa...",
      )
      fireEvent.change(searchInput, { target: { value: "0022222222" } })

      expect(screen.queryByText("Ahmad Fauzi")).toBeNull()
      expect(screen.getByText("Siti Rahma")).toBeDefined()
    })

    it("ConfirmDialog menampilkan peringatan ekstra apabila siswa sudah memiliki nilai", () => {
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={vi.fn()}
          title="Hapus Data Siswa?"
          description="Apakah Anda yakin ingin menghapus siswa ini?"
          warningMessage="Peringatan Penting: Siswa ini sudah memiliki 2 catatan nilai semester. Menghapus siswa ini akan ikut menghapus seluruh riwayat nilai!"
          onConfirm={vi.fn()}
        />,
      )

      expect(screen.getByText("Hapus Data Siswa?")).toBeDefined()
      expect(
        screen.getByText(
          /Siswa ini sudah memiliki 2 catatan nilai semester/i,
        ),
      ).toBeDefined()
    })
  })
})
