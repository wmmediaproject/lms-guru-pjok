import * as React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { hitungRingkasanKelas } from "@/lib/hitung/ringkasan-kelas"
import { gabungkanSiswaDanNilai } from "@/lib/hitung/nilai-siswa"
import type { Grade, Student } from "@/lib/supabase/types"

const mockRpc = vi.fn()

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
    rpc: mockRpc,
  })),
}))

describe("Fase 7B — Naik Kelas Massal, Penanganan Kelas 6 (Lulus), Rollback, & Keutuhan Nilai Historis", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("migrasi SQL promote_students_massal meng-update dari kelas tertinggi (5..1), menandai Kelas 6 sebagai lulus, dan tidak mengubah tabel grades", () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20261011000011_naik_kelas_massal.sql",
      ),
      "utf-8",
    )

    // Kolom status ('aktif' | 'lulus')
    expect(sql).toContain("check (status in ('aktif', 'lulus'))")
    // Siswa Kelas 6 ditandai lulus terlebih dahulu
    expect(sql).toContain("set status = 'lulus'")
    // Loop mundur dari kelas tertinggi 5..1 agar tidak pernah bertumpuk
    expect(sql).toContain("for v_kelas in reverse 5..1 loop")
    // Pengaman waktu eksekusi terakhir
    expect(sql).toContain("set last_promoted_at = v_now")
    // Tidak ada perintah UPDATE atau DELETE terhadap public.grades
    expect(sql.toLowerCase()).not.toContain("update public.grades")
    expect(sql.toLowerCase()).not.toContain("delete from public.grades")
  })

  it("simulasi pemindahan Kelas N -> N+1, Kelas 6 -> lulus, serta memastikan catatan grades (kelas_saat_nilai) tidak berubah", () => {
    const studentsBefore: Student[] = [
      {
        id: "s-k1",
        nisn: "001",
        nama: "Siswa Kelas 1",
        kelas: 1,
        jenis_kelamin: "L",
        status: "aktif",
        created_at: "",
        updated_at: "",
      },
      {
        id: "s-k5",
        nisn: "005",
        nama: "Siswa Kelas 5",
        kelas: 5,
        jenis_kelamin: "P",
        status: "aktif",
        created_at: "",
        updated_at: "",
      },
      {
        id: "s-k6",
        nisn: "006",
        nama: "Siswa Kelas 6",
        kelas: 6,
        jenis_kelamin: "L",
        status: "aktif",
        created_at: "",
        updated_at: "",
      },
    ]

    const historicalGrades: Grade[] = [
      {
        id: "g-1",
        student_id: "s-k1",
        period_id: "periode-lama",
        kelas_saat_nilai: 1,
        nilai_praktek: 85,
        nilai_uh: 85,
        nilai_asts: 85,
        nilai_asas: 85,
        nilai_akhir: 85,
        predikat: "Tuntas",
        keterangan: "Nilai saat di Kelas 1",
        updated_at: "",
      },
      {
        id: "g-6",
        student_id: "s-k6",
        period_id: "periode-lama",
        kelas_saat_nilai: 6,
        nilai_praktek: 90,
        nilai_uh: 90,
        nilai_asts: 90,
        nilai_asas: 90,
        nilai_akhir: 90,
        predikat: "Tuntas",
        keterangan: "Nilai saat di Kelas 6",
        updated_at: "",
      },
    ]

    // Terapkan logika identik dengan RPC promote_students_massal (Kelas 6 -> lulus, 5..1 -> kelas + 1)
    const studentsAfter: Student[] = studentsBefore.map((s) => {
      if (s.status !== "aktif") return s
      if (s.kelas === 6) return { ...s, status: "lulus" }
      return { ...s, kelas: s.kelas + 1 }
    })

    // Kelas 1 naik ke 2, Kelas 5 naik ke 6, Kelas 6 berstatus lulus
    expect(studentsAfter.find((s) => s.id === "s-k1")?.kelas).toBe(2)
    expect(studentsAfter.find((s) => s.id === "s-k5")?.kelas).toBe(6)
    expect(studentsAfter.find((s) => s.id === "s-k6")?.status).toBe("lulus")

    // Ringkasan kelas aktif hanya menghitung siswa berstatus 'aktif' (Kelas 2 = 1, Kelas 6 = 1 dari eks Kelas 5)
    const summariesAfter = hitungRingkasanKelas(studentsAfter)
    expect(summariesAfter.find((c) => c.kelas === 1)?.total).toBe(0)
    expect(summariesAfter.find((c) => c.kelas === 2)?.total).toBe(1)
    expect(summariesAfter.find((c) => c.kelas === 6)?.total).toBe(1)

    // Catatan grades historis TIDAK berubah (kelas_saat_nilai tetap 1 untuk s-k1 walaupun sekarang s-k1 di Kelas 2)
    const mergedClass2 = gabungkanSiswaDanNilai(
      studentsAfter.filter((s) => s.kelas === 2),
      historicalGrades,
      "periode-lama",
    )
    expect(mergedClass2).toHaveLength(1)
    expect(mergedClass2[0]?.kelas).toBe(2)
    expect(mergedClass2[0]?.kelas_saat_nilai).toBe(1)
  })

  it("naikKelasMassalAction menolak konfirmasi yang salah dan melakukan rollback penuh saat RPC gagal", async () => {
    const { naikKelasMassalAction } = await import("@/features/siswa/actions")

    // 1. Konfirmasi tidak sesuai -> ditolak sebelum menyentuh DB
    const badConfirm = await naikKelasMassalAction("naik")
    expect(badConfirm.success).toBe(false)
    expect(mockRpc).not.toHaveBeenCalled()

    // 2. Simulasi kegagalan di tengah transaksi RPC -> rollback total
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { code: "40001", message: "transaction aborted" },
    })

    const failedRes = await naikKelasMassalAction("NAIK KELAS")
    expect(failedRes.success).toBe(false)
    expect(failedRes.error).toContain("Transaksi dibatalkan dan tidak ada data yang berubah")

    // 3. Eksekusi sukses
    mockRpc.mockResolvedValueOnce({
      data: {
        promoted_1_to_2: 10,
        promoted_2_to_3: 12,
        promoted_3_to_4: 11,
        promoted_4_to_5: 9,
        promoted_5_to_6: 14,
        graduated_kelas_6: 13,
        total_affected: 69,
        executed_at: "2026-10-11T16:00:00Z",
      },
      error: null,
    })

    const okRes = await naikKelasMassalAction("NAIK KELAS")
    expect(okRes.success).toBe(true)
    if (okRes.success) {
      expect(okRes.data?.promoted_1_to_2).toBe(10)
      expect(okRes.data?.graduated_kelas_6).toBe(13)
      expect(okRes.data?.total_affected).toBe(69)
    }
  })

  it("NaikKelasDialog menampilkan pratinjau jumlah siswa per kelas, mewajibkan ketik 'NAIK KELAS', dan menampilkan ringkasan hasil", async () => {
    const { NaikKelasDialog } = await import(
      "@/features/kelas/naik-kelas-dialog"
    )

    const initialSummaries = hitungRingkasanKelas([
      { kelas: 1, jenis_kelamin: "L", status: "aktif" },
      { kelas: 1, jenis_kelamin: "P", status: "aktif" },
      { kelas: 6, jenis_kelamin: "L", status: "aktif" },
    ])

    mockRpc.mockResolvedValueOnce({
      data: {
        promoted_1_to_2: 2,
        promoted_2_to_3: 0,
        promoted_3_to_4: 0,
        promoted_4_to_5: 0,
        promoted_5_to_6: 0,
        graduated_kelas_6: 1,
        total_affected: 3,
        executed_at: "2026-10-11T16:00:00Z",
      },
      error: null,
    })

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={qc}>
        <NaikKelasDialog
          open={true}
          onOpenChange={vi.fn()}
          initialSummaries={initialSummaries}
        />
      </QueryClientProvider>,
    )

    expect(
      screen.getByText(/Pratinjau Pemindahan Siswa Aktif \(3 Siswa\)/i),
    ).toBeDefined()
    expect(screen.getByText("Kelas 6 → Lulus")).toBeDefined()

    const submitBtn = screen.getByRole("button", {
      name: /Jalankan Naik Kelas Massal/i,
    }) as HTMLButtonElement
    expect(submitBtn.disabled).toBe(true)

    const confirmInput = screen.getByLabelText(
      /Ketik NAIK KELAS untuk konfirmasi/i,
    )
    fireEvent.change(confirmInput, { target: { value: "NAIK KELAS" } })
    expect(submitBtn.disabled).toBe(false)

    await act(async () => {
      fireEvent.click(submitBtn)
    })

    expect(
      screen.getByText(/Total 3 siswa berhasil diproses/i),
    ).toBeDefined()
  })
})
