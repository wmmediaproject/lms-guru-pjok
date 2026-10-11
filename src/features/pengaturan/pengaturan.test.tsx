import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  changePasswordSchema,
  periodeSchema,
  weightSettingsSchema,
} from "@/lib/validators/pengaturan"
import { WeightSettingsForm } from "./weight-settings-form"
import { PeriodSelect } from "@/components/shared/period-select"
import type { Period, Settings } from "@/lib/supabase/types"

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/supabase/sync-admin-profile", () => ({
  ensureAdminProfile: vi.fn(async () => true),
}))

const mockFrom = vi.fn()
const mockRpc = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      updateUser: mockUpdateUser,
    },
  })),
}))

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}))

describe("Fase 3 — Periode & Pengaturan (Validasi, Actions & UI)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("1. Skema Validasi Zod (src/lib/validators/pengaturan.ts)", () => {
    it("weightSettingsSchema menolak total bobot != 100% dan menerima tepat 100%", () => {
      const invalidSum = weightSettingsSchema.safeParse({
        bobot_praktek: 30,
        bobot_uh: 25,
        bobot_asts: 25,
        bobot_asas: 25,
        kkm: 75,
      })
      expect(invalidSum.success).toBe(false)
      if (!invalidSum.success) {
        expect(invalidSum.error.issues[0]?.message).toBe(
          "Total bobot keempat komponen harus tepat 100%",
        )
      }

      const validSum = weightSettingsSchema.safeParse({
        bobot_praktek: 40,
        bobot_uh: 20,
        bobot_asts: 20,
        bobot_asas: 20,
        kkm: 78,
      })
      expect(validSum.success).toBe(true)
    })

    it("periodeSchema memvalidasi tahun_mulai dan semester", () => {
      expect(
        periodeSchema.safeParse({ tahun_mulai: 2026, semester: "ganjil" })
          .success,
      ).toBe(true)
      expect(
        periodeSchema.safeParse({ tahun_mulai: 2010, semester: "ganjil" })
          .success,
      ).toBe(false)
    })

    it("changePasswordSchema menolak konfirmasi kata sandi yang berbeda", () => {
      const mismatch = changePasswordSchema.safeParse({
        password_baru: "rahasia123",
        konfirmasi_password: "beda123",
      })
      expect(mismatch.success).toBe(false)
      if (!mismatch.success) {
        expect(mismatch.error.issues[0]?.message).toBe(
          "Konfirmasi kata sandi tidak cocok",
        )
      }
    })
  })

  describe("2. Server Actions Periode (src/features/pengaturan/actions.ts)", () => {
    it("hapusPeriodeAction menolak penghapusan bila periode sudah memiliki nilai di tabel grades", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "grades") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 12, error: null }),
            }),
          }
        }
        return {}
      })

      const { hapusPeriodeAction } = await import("./actions")
      const res = await hapusPeriodeAction("period-uuid-1")

      expect(res.success).toBe(false)
      expect(res.error).toBe(
        "Periode tidak dapat dihapus karena sudah memiliki data nilai siswa",
      )
    })

    it("jadikanPeriodeAktifAction memanggil RPC set_active_period secara atomik", async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null })

      const { jadikanPeriodeAktifAction } = await import("./actions")
      const res = await jadikanPeriodeAktifAction("period-uuid-2")

      expect(res.success).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith("set_active_period", {
        p_period_id: "period-uuid-2",
      })
    })

    it("buatPeriodeBerikutnyaAction menghasilkan Semester Ganjil 2027-2028 setelah Ganjil & Genap 2026-2027", async () => {
      const insertedRow: Period = {
        id: "period-uuid-3",
        tahun_mulai: 2027,
        semester: "ganjil",
        nama: "Semester Ganjil 2027-2028",
        is_active: false,
        created_at: new Date().toISOString(),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === "periods") {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { tahun_mulai: 2026, semester: "ganjil" },
                { tahun_mulai: 2026, semester: "genap" },
              ],
              error: null,
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: insertedRow,
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      })

      const { buatPeriodeBerikutnyaAction } = await import("./actions")
      const res = await buatPeriodeBerikutnyaAction()

      expect(res.success).toBe(true)
      expect(res.data?.nama).toBe("Semester Ganjil 2027-2028")
      expect(res.data?.tahun_mulai).toBe(2027)
      expect(res.data?.semester).toBe("ganjil")
    })
  })

  describe("3. Komponen WeightSettingsForm & PeriodSelect", () => {
    it("merender WeightSettingsForm dengan bobot default 25/25/25/25 (total 100%) dan KKM 75", () => {
      const qc = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const initialSettings: Settings = {
        id: "settings-1",
        nama_sekolah: "SDN 01 PJOK",
        kkm: 75,
        bobot_praktek: 25,
        bobot_uh: 25,
        bobot_asts: 25,
        bobot_asas: 25,
        updated_at: new Date().toISOString(),
      }

      render(
        <QueryClientProvider client={qc}>
          <WeightSettingsForm initialSettings={initialSettings} />
        </QueryClientProvider>,
      )

      expect(screen.getByText("100% (Sesuai — 100%)")).toBeDefined()
      expect(
        screen.getByText("Kriteria Ketuntasan Minimal (KKM)"),
      ).toBeDefined()
      expect(screen.getByText("Simpan Pengaturan Penilaian")).toBeDefined()
    })

    it("merender PeriodSelect dengan default periode aktif Semester Ganjil 2026-2027", () => {
      const qc = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const initialPeriods: Period[] = [
        {
          id: "p-ganjil",
          tahun_mulai: 2026,
          semester: "ganjil",
          nama: "Semester Ganjil 2026-2027",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "p-genap",
          tahun_mulai: 2026,
          semester: "genap",
          nama: "Semester Genap 2026-2027",
          is_active: false,
          created_at: new Date().toISOString(),
        },
      ]

      render(
        <QueryClientProvider client={qc}>
          <PeriodSelect initialPeriods={initialPeriods} />
        </QueryClientProvider>,
      )

      expect(screen.getByText("Semester Ganjil 2026-2027")).toBeDefined()
    })
  })
})
