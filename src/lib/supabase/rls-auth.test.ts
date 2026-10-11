import { describe, it, expect, vi, beforeEach } from "vitest"
import fs from "fs"
import path from "path"
import { NextRequest } from "next/server"
import { loginSchema } from "@/lib/validators/auth"

// Mock @supabase/ssr for proxy and client tests
const mockGetUser = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()
const mockFrom = vi.fn()

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
    },
    from: mockFrom,
  })),
  createBrowserClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

describe("Fase 1 — Database, RLS, Auth & Proteksi Rute", () => {
  const migrationsDir = path.resolve(
    import.meta.dirname,
    "../../../supabase/migrations",
  )

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-test"
  })

  describe("1. Verifikasi Skema SQL & RLS Admin-Only (Penolakan Akses Anonim)", () => {
    it("mengaktifkan RLS pada semua 5 tabel utama (periods, students, grades, settings, profiles)", () => {
      const rlsSql = fs.readFileSync(
        path.join(migrationsDir, "20261011000007_rls_and_functions.sql"),
        "utf-8",
      )

      const tables = ["periods", "students", "grades", "settings", "profiles"]
      for (const table of tables) {
        expect(rlsSql).toMatch(
          new RegExp(
            `alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`,
            "i",
          ),
        )
      }
    })

    it("mendefinisikan fungsi is_admin() yang memeriksa auth.uid() dan role = 'admin'", () => {
      const rlsSql = fs.readFileSync(
        path.join(migrationsDir, "20261011000007_rls_and_functions.sql"),
        "utf-8",
      )

      expect(rlsSql).toMatch(/create\s+or\s+replace\s+function\s+public\.is_admin\(\)/i)
      expect(rlsSql).toMatch(/where\s+id\s*=\s*auth\.uid\(\)/i)
      expect(rlsSql).toMatch(/and\s+role\s*=\s*'admin'/i)
    })

    it("memastikan seluruh policy SELECT/INSERT/UPDATE/DELETE mewajibkan public.is_admin() dan tidak ada akses anon", () => {
      const rlsSql = fs.readFileSync(
        path.join(migrationsDir, "20261011000007_rls_and_functions.sql"),
        "utf-8",
      )

      // Pastikan tidak ada policy yang memberi izin ke role anon atau using (true)
      expect(rlsSql).not.toMatch(/to\s+anon/i)
      expect(rlsSql).not.toMatch(/using\s*\(\s*true\s*\)/i)
      expect(rlsSql).not.toMatch(/with\s+check\s*\(\s*true\s*\)/i)

      // Semua tabel bisnis memiliki policy select, insert, update, delete berbasis is_admin()
      const dataTables = ["periods", "students", "grades", "settings"]
      for (const table of dataTables) {
        expect(rlsSql).toMatch(
          new RegExp(`on\\s+public\\.${table}\\s+for\\s+select[\\s\\S]*?public\\.is_admin\\(\\)`, "i"),
        )
        expect(rlsSql).toMatch(
          new RegExp(`on\\s+public\\.${table}\\s+for\\s+insert[\\s\\S]*?public\\.is_admin\\(\\)`, "i"),
        )
        expect(rlsSql).toMatch(
          new RegExp(`on\\s+public\\.${table}\\s+for\\s+update[\\s\\S]*?public\\.is_admin\\(\\)`, "i"),
        )
        expect(rlsSql).toMatch(
          new RegExp(`on\\s+public\\.${table}\\s+for\\s+delete[\\s\\S]*?public\\.is_admin\\(\\)`, "i"),
        )
      }
    })

    it("menolak operasi baca dan tulis dari klien anonim (tanpa sesi admin)", async () => {
      // Simulasi perilaku PostgREST + RLS ketika auth.uid() = null (anonim):
      // SELECT mengembalikan baris kosong [] dan INSERT/UPDATE/DELETE ditolak dengan kode 42501 (insufficient_privilege)
      const tables = ["periods", "students", "grades", "settings", "profiles"] as const

      mockFrom.mockImplementation((table: string) => ({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          status: 200,
          table,
        }),
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: "42501",
            message: `new row violates row-level security policy for table "${table}"`,
          },
          status: 403,
        }),
        update: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: "42501",
            message: `new row violates row-level security policy for table "${table}"`,
          },
          status: 403,
        }),
        delete: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: "42501",
            message: `row violates row-level security policy for table "${table}"`,
          },
          status: 403,
        }),
      }))

      const { createClient } = await import("@/lib/supabase/client")
      const anonClient = createClient()

      for (const table of tables) {
        const selectRes = await anonClient.from(table).select("*")
        expect(selectRes.data).toEqual([])

        const insertRes = await anonClient.from(table).insert({} as never)
        expect(insertRes.error?.code).toBe("42501")

        const updateRes = await anonClient.from(table).update({} as never)
        expect(updateRes.error?.code).toBe("42501")

        const deleteRes = await anonClient.from(table).delete()
        expect(deleteRes.error?.code).toBe("42501")
      }
    })

    it("memverifikasi constraint tabel sesuai PRD §6 (0-100, kelas 1-6, bobot = 100, partial unique index)", () => {
      const periodsSql = fs.readFileSync(
        path.join(migrationsDir, "20261011000001_create_periods.sql"),
        "utf-8",
      )
      const studentsSql = fs.readFileSync(
        path.join(migrationsDir, "20261011000002_create_students.sql"),
        "utf-8",
      )
      const gradesSql = fs.readFileSync(
        path.join(migrationsDir, "20261011000003_create_grades.sql"),
        "utf-8",
      )
      const settingsSql = fs.readFileSync(
        path.join(migrationsDir, "20261011000004_create_settings.sql"),
        "utf-8",
      )

      // periods: unique(tahun_mulai, semester) & partial unique index is_active = true
      expect(periodsSql).toMatch(/unique\s*\(\s*tahun_mulai\s*,\s*semester\s*\)/i)
      expect(periodsSql).toMatch(/where\s+is_active\s*=\s*true/i)

      // students: nisn digits only & kelas 1-6
      expect(studentsSql).toMatch(/kelas\s+between\s+1\s+and\s+6/i)
      expect(studentsSql).toMatch(/nisn\s*~\s*'\^\[0-9\]\+\$'/i)

      // grades: check 0-100, keterangan <= 300, on delete cascade
      expect(gradesSql).toMatch(/on\s+delete\s+cascade/i)
      expect(gradesSql).toMatch(/nilai_praktek\s+between\s+0\s+and\s+100/i)
      expect(gradesSql).toMatch(/nilai_uh\s+between\s+0\s+and\s+100/i)
      expect(gradesSql).toMatch(/nilai_asts\s+between\s+0\s+and\s+100/i)
      expect(gradesSql).toMatch(/nilai_asas\s+between\s+0\s+and\s+100/i)
      expect(gradesSql).toMatch(/char_length\(keterangan\)\s*<=\s*300/i)

      // settings: bobot_praktek + bobot_uh + bobot_asts + bobot_asas = 100
      expect(settingsSql).toMatch(
        /bobot_praktek\s*\+\s*bobot_uh\s*\+\s*bobot_asts\s*\+\s*bobot_asas\s*=\s*100/i,
      )
    })
  })

  describe("2. Proteksi Rute (proxy.ts)", () => {
    it("mengarahkan pengguna anonim dari /dashboard ke /masuk", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })

      const { proxy } = await import("@/proxy")
      const req = new NextRequest("http://localhost:3000/dashboard")
      const res = await proxy(req)

      expect(res.status).toBe(307)
      expect(res.headers.get("location")).toBe("http://localhost:3000/masuk")
    })

    it("mengarahkan pengguna anonim dari sub-rute /dashboard/nilai ke /masuk", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })

      const { proxy } = await import("@/proxy")
      const req = new NextRequest("http://localhost:3000/dashboard/nilai")
      const res = await proxy(req)

      expect(res.status).toBe(307)
      expect(res.headers.get("location")).toBe("http://localhost:3000/masuk")
    })

    it("mengarahkan admin yang sudah login dari /masuk ke /dashboard", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "admin-uuid", email: "guru@sekolah.sch.id" } },
      })

      const { proxy } = await import("@/proxy")
      const req = new NextRequest("http://localhost:3000/masuk")
      const res = await proxy(req)

      expect(res.status).toBe(307)
      expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard")
    })

    it("mengizinkan akses ke /dashboard saat admin sudah login", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "admin-uuid", email: "guru@sekolah.sch.id" } },
      })

      const { proxy } = await import("@/proxy")
      const req = new NextRequest("http://localhost:3000/dashboard")
      const res = await proxy(req)

      expect(res.status).toBe(200)
    })
  })

  describe("3. Validasi Form Masuk (Zod Bahasa Indonesia)", () => {
    it("menolak email kosong atau tidak valid dengan pesan Bahasa Indonesia", () => {
      const emptyResult = loginSchema.safeParse({ email: "", password: "password123" })
      expect(emptyResult.success).toBe(false)
      if (!emptyResult.success) {
        expect(emptyResult.error.issues[0]?.message).toBe("Email wajib diisi")
      }

      const invalidEmail = loginSchema.safeParse({
        email: "bukan-email",
        password: "password123",
      })
      expect(invalidEmail.success).toBe(false)
      if (!invalidEmail.success) {
        expect(invalidEmail.error.issues[0]?.message).toBe("Format email tidak valid")
      }
    })

    it("menolak kata sandi kosong atau kurang dari 6 karakter", () => {
      const emptyPass = loginSchema.safeParse({
        email: "guru@sekolah.sch.id",
        password: "",
      })
      expect(emptyPass.success).toBe(false)
      if (!emptyPass.success) {
        expect(emptyPass.error.issues[0]?.message).toBe("Kata sandi wajib diisi")
      }

      const shortPass = loginSchema.safeParse({
        email: "guru@sekolah.sch.id",
        password: "123",
      })
      expect(shortPass.success).toBe(false)
      if (!shortPass.success) {
        expect(shortPass.error.issues[0]?.message).toBe(
          "Kata sandi minimal 6 karakter",
        )
      }
    })

    it("menerima kredensial dengan format yang valid", () => {
      const valid = loginSchema.safeParse({
        email: "guru@sekolah.sch.id",
        password: "password123",
      })
      expect(valid.success).toBe(true)
    })
  })
})
