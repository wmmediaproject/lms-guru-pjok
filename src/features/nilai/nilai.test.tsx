import * as React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  parseGradeCellInput,
  upsertGradeSchema,
} from "@/lib/validators/nilai"
import {
  hitungNilaiAkhir,
  tentukanPredikat,
  type BobotPenilaian,
} from "@/lib/hitung/nilai-akhir"
import {
  apakahBelumAdaNilai,
  gabungkanSiswaDanNilai,
  hitungTampilanNilaiAkhir,
} from "@/lib/hitung/nilai-siswa"
import type { Grade, Period, Settings, Student } from "@/lib/supabase/types"

const mockUpsert = vi.fn()
const mockSelectAfterUpsert = vi.fn()
const mockSingleAfterUpsert = vi.fn()

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      upsert: mockUpsert.mockReturnValue({
        select: mockSelectAfterUpsert.mockReturnValue({
          single: mockSingleAfterUpsert,
        }),
      }),
    })),
  })),
}))

const SAMPLE_PERIODS: Period[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    tahun_mulai: 2026,
    semester: "ganjil",
    nama: "Semester Ganjil 2026-2027",
    is_active: true,
    created_at: "2026-07-01T00:00:00Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    tahun_mulai: 2026,
    semester: "genap",
    nama: "Semester Genap 2026-2027",
    is_active: false,
    created_at: "2026-07-01T00:00:00Z",
  },
]

const SAMPLE_SETTINGS: Settings = {
  id: "33333333-3333-4333-8333-333333333333",
  nama_sekolah: "SDN 1 Nusantara",
  kkm: 75,
  bobot_praktek: 25,
  bobot_uh: 25,
  bobot_asts: 25,
  bobot_asas: 25,
  updated_at: "2026-07-01T00:00:00Z",
}

const SAMPLE_STUDENTS: Student[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    nisn: "0012345678",
    nama: "Andi Pratama",
    kelas: 1,
    jenis_kelamin: "L",
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    nisn: "0012345679",
    nama: "Bunga Citra",
    kelas: 1,
    jenis_kelamin: "P",
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
  },
]

const SAMPLE_GRADES: Grade[] = [
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    student_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    period_id: "11111111-1111-4111-8111-111111111111",
    kelas_saat_nilai: 1,
    nilai_praktek: 80,
    nilai_uh: 80,
    nilai_asts: 80,
    nilai_asas: 80,
    nilai_akhir: 80,
    predikat: "Tuntas",
    keterangan: "Sangat aktif dan sportif",
    updated_at: "2026-07-02T00:00:00Z",
  },
]

describe("Validasi Rentang Nilai (Klien & Server)", () => {
  it("membiarkan nilai kosong sebagai null (bukan 0) dan menerima angka 0-100 maksimal 2 desimal", () => {
    expect(parseGradeCellInput("")).toEqual({ valid: true, value: null })
    expect(parseGradeCellInput("   ")).toEqual({ valid: true, value: null })
    expect(parseGradeCellInput("0")).toEqual({ valid: true, value: 0 })
    expect(parseGradeCellInput("100")).toEqual({ valid: true, value: 100 })
    expect(parseGradeCellInput("85.75")).toEqual({ valid: true, value: 85.75 })
    expect(parseGradeCellInput("85,5")).toEqual({ valid: true, value: 85.5 })
  })

  it("menolak nilai di luar rentang 0-100, lebih dari 2 desimal, atau bukan angka", () => {
    const over = parseGradeCellInput("101")
    expect(over.valid).toBe(false)
    if (!over.valid) {
      expect(over.error).toContain("100")
    }

    const negative = parseGradeCellInput("-1")
    expect(negative.valid).toBe(false)
    if (!negative.valid) {
      expect(negative.error).toContain("0")
    }

    const threeDecimals = parseGradeCellInput("80.125")
    expect(threeDecimals.valid).toBe(false)
    if (!threeDecimals.valid) {
      expect(threeDecimals.error).toContain("2 angka di belakang koma")
    }

    const nanInput = parseGradeCellInput("delapan puluh")
    expect(nanInput.valid).toBe(false)
  })

  it("upsertGradeSchema menolak nilai > 100 dan keterangan > 300 karakter", () => {
    const invalidScore = upsertGradeSchema.safeParse({
      student_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      period_id: "11111111-1111-4111-8111-111111111111",
      kelas_saat_nilai: 1,
      nilai_praktek: 101,
      nilai_uh: null,
      nilai_asts: null,
      nilai_asas: null,
      keterangan: null,
    })
    expect(invalidScore.success).toBe(false)

    const tooLongNote = upsertGradeSchema.safeParse({
      student_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      period_id: "11111111-1111-4111-8111-111111111111",
      kelas_saat_nilai: 1,
      nilai_praktek: 80,
      nilai_uh: 80,
      nilai_asts: 80,
      nilai_asas: 80,
      keterangan: "a".repeat(301),
    })
    expect(tooLongNote.success).toBe(false)
  })
})

describe("Kecocokan Perhitungan TS vs DB (Nilai Akhir & Predikat)", () => {
  // Simulasi fungsi SQL public.hitung_nilai_akhir & public.tentukan_predikat dari migrasi 009
  function pgHitungNilaiAkhir(
    p: number | null,
    u: number | null,
    asts: number | null,
    asas: number | null,
    bobot: BobotPenilaian,
  ): number | null {
    if (p === null || u === null || asts === null || asas === null) {
      return null
    }
    const raw =
      (p * bobot.bobot_praktek +
        u * bobot.bobot_uh +
        asts * bobot.bobot_asts +
        asas * bobot.bobot_asas) /
      100.0
    return Number(Math.round(Number(raw + "e+2")) + "e-2")
  }

  function pgTentukanPredikat(
    nilaiAkhir: number | null,
    kkm: number,
  ): "Tuntas" | "Belum Tuntas" | null {
    if (nilaiAkhir === null) return null
    return nilaiAkhir >= kkm ? "Tuntas" : "Belum Tuntas"
  }

  it("memastikan rumus SQL di migrasi dan fungsi murni TS memberikan hasil identik di berbagai skenario", () => {
    const sqlMigration = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20261011000009_grades_calc_and_period_rpc.sql",
      ),
      "utf-8",
    )
    expect(sqlMigration).toContain("create or replace function public.hitung_nilai_akhir")
    expect(sqlMigration).toContain("create or replace function public.tentukan_predikat")

    const testCases: Array<{
      nilai: {
        nilai_praktek: number | null
        nilai_uh: number | null
        nilai_asts: number | null
        nilai_asas: number | null
      }
      bobot: BobotPenilaian
      kkm: number
    }> = [
      {
        nilai: { nilai_praktek: 80, nilai_uh: 75, nilai_asts: 70, nilai_asas: 85 },
        bobot: { bobot_praktek: 25, bobot_uh: 25, bobot_asts: 25, bobot_asas: 25 },
        kkm: 75,
      },
      {
        nilai: { nilai_praktek: 83.33, nilai_uh: 77.77, nilai_asts: 68.15, nilai_asas: 74.25 },
        bobot: { bobot_praktek: 40, bobot_uh: 20, bobot_asts: 20, bobot_asas: 20 },
        kkm: 75,
      },
      {
        nilai: { nilai_praktek: 74.99, nilai_uh: 74.99, nilai_asts: 74.99, nilai_asas: 74.99 },
        bobot: { bobot_praktek: 25, bobot_uh: 25, bobot_asts: 25, bobot_asas: 25 },
        kkm: 75,
      },
      {
        nilai: { nilai_praktek: 90, nilai_uh: 85, nilai_asts: 80, nilai_asas: null },
        bobot: { bobot_praktek: 25, bobot_uh: 25, bobot_asts: 25, bobot_asas: 25 },
        kkm: 75,
      },
    ]

    for (const tc of testCases) {
      const tsNilaiAkhir = hitungNilaiAkhir(tc.nilai, tc.bobot)
      const tsPredikat = tentukanPredikat(tsNilaiAkhir, tc.kkm)

      const dbNilaiAkhir = pgHitungNilaiAkhir(
        tc.nilai.nilai_praktek,
        tc.nilai.nilai_uh,
        tc.nilai.nilai_asts,
        tc.nilai.nilai_asas,
        tc.bobot,
      )
      const dbPredikat = pgTentukanPredikat(dbNilaiAkhir, tc.kkm)

      expect(tsNilaiAkhir).toBe(dbNilaiAkhir)
      expect(tsPredikat).toBe(dbPredikat)
    }
  })

  it("hitungTampilanNilaiAkhir memakai hasil DB saat tidak diedit dan pratinjau instan saat diedit", () => {
    // Saat tidak diedit (isDirty = false), pakai nilai dari DB
    const fromDb = hitungTampilanNilaiAkhir({
      nilai: { nilai_praktek: 80, nilai_uh: 80, nilai_asts: 80, nilai_asas: 80 },
      dbNilaiAkhir: 80,
      dbPredikat: "Tuntas",
      isDirty: false,
    })
    expect(fromDb).toEqual({ nilai_akhir: 80, predikat: "Tuntas" })

    // Saat sedang diedit (isDirty = true), pakai pratinjau instan fungsi murni TS
    const livePreview = hitungTampilanNilaiAkhir({
      nilai: { nilai_praktek: 60, nilai_uh: 60, nilai_asts: 60, nilai_asas: 60 },
      dbNilaiAkhir: 80,
      dbPredikat: "Tuntas",
      isDirty: true,
    })
    expect(livePreview).toEqual({ nilai_akhir: 60, predikat: "Belum Tuntas" })

    // Saat salah satu komponen dihapus (null), Nilai Akhir & Predikat langsung kosong (null)
    const incompletePreview = hitungTampilanNilaiAkhir({
      nilai: { nilai_praktek: 80, nilai_uh: 80, nilai_asts: null, nilai_asas: 80 },
      dbNilaiAkhir: 80,
      dbPredikat: "Tuntas",
      isDirty: true,
    })
    expect(incompletePreview).toEqual({ nilai_akhir: null, predikat: null })
  })
})

describe("Upsert Nilai Siswa Idempoten (simpanNilaiSiswaAction)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("menyimpan secara idempoten dengan onConflict 'student_id,period_id' dan menyertakan kelas_saat_nilai", async () => {
    const { simpanNilaiSiswaAction } = await import("@/features/nilai/actions")

    const payload = {
      student_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      period_id: "11111111-1111-4111-8111-111111111111",
      kelas_saat_nilai: 1,
      nilai_praktek: 85,
      nilai_uh: null,
      nilai_asts: null,
      nilai_asas: null,
      keterangan: "Bagus dalam gerak dasar",
    }

    // Simpan pertama (sebagian komponen) -> nilai_akhir null
    mockSingleAfterUpsert.mockResolvedValueOnce({
      data: {
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        ...payload,
        nilai_akhir: null,
        predikat: null,
        updated_at: "2026-07-03T00:00:00Z",
      },
      error: null,
    })

    const res1 = await simpanNilaiSiswaAction(payload)
    expect(res1.success).toBe(true)
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        student_id: payload.student_id,
        period_id: payload.period_id,
        kelas_saat_nilai: 1,
        nilai_praktek: 85,
        nilai_uh: null,
        nilai_asts: null,
        nilai_asas: null,
        keterangan: "Bagus dalam gerak dasar",
      },
      { onConflict: "student_id,period_id" },
    )
    if (res1.success) {
      expect(res1.data?.nilai_akhir).toBeNull()
    }

    // Simpan kedua (keempat komponen lengkap pada pasangan student_id + period_id yang sama)
    const fullPayload = {
      ...payload,
      nilai_uh: 75,
      nilai_asts: 80,
      nilai_asas: 80,
    }
    mockSingleAfterUpsert.mockResolvedValueOnce({
      data: {
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        ...fullPayload,
        nilai_akhir: 80,
        predikat: "Tuntas",
        updated_at: "2026-07-03T00:01:00Z",
      },
      error: null,
    })

    const res2 = await simpanNilaiSiswaAction(fullPayload)
    expect(res2.success).toBe(true)
    if (res2.success) {
      expect(res2.data?.id).toBe("dddddddd-dddd-4ddd-8ddd-dddddddddddd")
      expect(res2.data?.nilai_akhir).toBe(80)
      expect(res2.data?.predikat).toBe("Tuntas")
    }
  })
})

describe("UI GradesTableView (/dashboard/nilai)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it("menampilkan semua siswa (termasuk yang belum punya nilai), melakukan pratinjau instan, simpan otomatis debounce 800ms, dan filter 'Belum ada nilai'", async () => {
    const { GradesTableView } = await import(
      "@/features/nilai/grades-table-view"
    )

    const merged = gabungkanSiswaDanNilai(
      SAMPLE_STUDENTS,
      SAMPLE_GRADES,
      SAMPLE_PERIODS[0]!.id,
    )
    expect(merged).toHaveLength(2)
    expect(apakahBelumAdaNilai(merged[0]!)).toBe(false)
    expect(apakahBelumAdaNilai(merged[1]!)).toBe(true)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <GradesTableView
          initialKelas={1}
          initialPeriods={SAMPLE_PERIODS}
          initialSettings={SAMPLE_SETTINGS}
          initialStudents={SAMPLE_STUDENTS}
          initialGrades={SAMPLE_GRADES}
        />
      </QueryClientProvider>,
    )

    // Kedua siswa tampil di tabel beserta kolom NISN masing-masing
    expect(screen.getByText("NISN")).toBeDefined()
    expect(screen.getByText("Andi Pratama")).toBeDefined()
    expect(screen.getByText("Bunga Citra")).toBeDefined()
    expect(
      screen.getByTestId(`nisn-${SAMPLE_STUDENTS[0]!.id}`).textContent,
    ).toBe("0012345678")
    expect(
      screen.getByTestId(`nisn-${SAMPLE_STUDENTS[1]!.id}`).textContent,
    ).toBe("0012345679")

    // Andi sudah punya nilai lengkap (80.00, Tuntas)
    expect(
      screen.getByTestId(`nilai-akhir-${SAMPLE_STUDENTS[0]!.id}`).textContent,
    ).toContain("80.00")
    expect(
      screen.getByTestId(`predikat-${SAMPLE_STUDENTS[0]!.id}`).textContent,
    ).toContain("Tuntas")

    // Bunga belum punya nilai -> sel input kosong (bukan "0") dan Nilai Akhir "—"
    const praktekBunga = screen.getByLabelText(
      "Nilai Praktek Bunga Citra",
    ) as HTMLInputElement
    expect(praktekBunga.value).toBe("")
    expect(
      screen.getByTestId(`nilai-akhir-${SAMPLE_STUDENTS[1]!.id}`).textContent,
    ).toContain("—")

    // Isi keempat komponen nilai Bunga -> pratinjau instan langsung menghitung Nilai Akhir & Predikat
    const uhBunga = screen.getByLabelText("Nilai UH Bunga Citra")
    const astsBunga = screen.getByLabelText("Nilai ASTS Bunga Citra")
    const asasBunga = screen.getByLabelText("Nilai ASAS Bunga Citra")

    mockSingleAfterUpsert.mockResolvedValue({
      data: {
        id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        student_id: SAMPLE_STUDENTS[1]!.id,
        period_id: SAMPLE_PERIODS[0]!.id,
        kelas_saat_nilai: 1,
        nilai_praktek: 70,
        nilai_uh: 70,
        nilai_asts: 70,
        nilai_asas: 70,
        nilai_akhir: 70,
        predikat: "Belum Tuntas",
        keterangan: null,
        updated_at: "2026-07-03T00:00:00Z",
      },
      error: null,
    })

    fireEvent.change(praktekBunga, { target: { value: "70" } })
    fireEvent.change(uhBunga, { target: { value: "70" } })
    fireEvent.change(astsBunga, { target: { value: "70" } })
    fireEvent.change(asasBunga, { target: { value: "70" } })

    // Pratinjau instan langsung muncul sebelum debounce 800ms selesai
    expect(
      screen.getByTestId(`nilai-akhir-${SAMPLE_STUDENTS[1]!.id}`).textContent,
    ).toContain("70.00")
    expect(
      screen.getByTestId(`predikat-${SAMPLE_STUDENTS[1]!.id}`).textContent,
    ).toContain("Belum Tuntas")
    expect(
      screen.getByTestId(`status-simpan-${SAMPLE_STUDENTS[1]!.id}`).textContent,
    ).toContain("Belum tersimpan")

    // Sebelum 800ms, belum memanggil upsert
    expect(mockUpsert).not.toHaveBeenCalled()

    // Majukan timer 800ms untuk memicu autosave
    await act(async () => {
      vi.advanceTimersByTime(800)
    })

    expect(mockUpsert).toHaveBeenCalledTimes(1)
    expect(
      screen.getByTestId(`status-simpan-${SAMPLE_STUDENTS[1]!.id}`).textContent,
    ).toContain("Tersimpan ✓")

    // Sinkronisasi langsung ketika NISN siswa diperbarui di data siswa
    const { syncStudentToGradesCache } = await import("@/hooks/use-grades")
    await act(async () => {
      syncStudentToGradesCache(queryClient, {
        ...SAMPLE_STUDENTS[0]!,
        nisn: "0099887766",
      })
      vi.advanceTimersByTime(10)
    })

    expect(
      screen.getByTestId(`nisn-${SAMPLE_STUDENTS[0]!.id}`).textContent,
    ).toBe("0099887766")

    vi.useRealTimers()
  })
})
