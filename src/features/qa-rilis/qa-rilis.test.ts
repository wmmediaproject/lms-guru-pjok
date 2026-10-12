import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const rootDir = path.resolve(import.meta.dirname, "../../..")
const srcDir = path.join(rootDir, "src")
const migrationsDir = path.join(rootDir, "supabase/migrations")

function getAllFiles(dir: string, exts = [".ts", ".tsx"]): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const results: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, exts))
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath)
    }
  }
  return results
}

describe("Fase 10 — Audit QA, Keamanan, Aksesibilitas & Bahasa Indonesia", () => {
  describe("1. Keamanan: Tidak Ada service_role di Klien & Hardening View/RPC", () => {
    it("memastikan SUPABASE_SERVICE_ROLE_KEY tidak pernah direferensikan di berkas 'use client' atau client.ts", () => {
      const allSrcFiles = getAllFiles(srcDir)
      for (const file of allSrcFiles) {
        const content = fs.readFileSync(file, "utf-8")
        const isClientComponent = /^["']use client["']/m.test(content.trim())
        const isBrowserClient = file.endsWith(path.join("supabase", "client.ts"))

        if (isClientComponent || isBrowserClient) {
          expect(content).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
          expect(content).not.toMatch(/process\.env\.[A-Z0-9_]*SERVICE_ROLE/i)
        }
      }
    })

    it("memastikan migrasi 0014 mengaktifkan security_invoker = true pada view dashboard dan memproteksi semua RPC dengan is_admin()", () => {
      const hardeningSql = fs.readFileSync(
        path.join(migrationsDir, "20261012000014_security_hardening_views_and_rpc.sql"),
        "utf-8",
      )

      expect(hardeningSql).toMatch(
        /ALTER\s+VIEW\s+public\.dashboard_student_summary\s+SET\s*\(\s*security_invoker\s*=\s*true\s*\)/i,
      )
      expect(hardeningSql).toMatch(
        /ALTER\s+VIEW\s+public\.dashboard_grade_stats\s+SET\s*\(\s*security_invoker\s*=\s*true\s*\)/i,
      )
      expect(hardeningSql).toMatch(/IF\s+NOT\s+public\.is_admin\(\)\s+THEN/i)
      expect(hardeningSql).toMatch(
        /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.get_dashboard_summary\(uuid\)\s+FROM\s+PUBLIC,\s*anon/i,
      )
      expect(hardeningSql).toMatch(
        /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.set_active_period\(uuid\)\s+FROM\s+PUBLIC,\s*anon/i,
      )
      expect(hardeningSql).toMatch(
        /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.upsert_students_csv\(jsonb\)\s+FROM\s+PUBLIC,\s*anon/i,
      )
      expect(hardeningSql).toMatch(
        /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.promote_students_massal\(\)\s+FROM\s+PUBLIC,\s*anon/i,
      )
    })
  })

  describe("2. Audit Teks UI 100% Bahasa Indonesia & Aksesibilitas", () => {
    it("memastikan komponen shadcn (dialog, sheet, breadcrumb, sidebar) menggunakan label sr-only Bahasa Indonesia", () => {
      const dialogContent = fs.readFileSync(
        path.join(srcDir, "components/ui/dialog.tsx"),
        "utf-8",
      )
      const sheetContent = fs.readFileSync(
        path.join(srcDir, "components/ui/sheet.tsx"),
        "utf-8",
      )
      const breadcrumbContent = fs.readFileSync(
        path.join(srcDir, "components/ui/breadcrumb.tsx"),
        "utf-8",
      )
      const sidebarContent = fs.readFileSync(
        path.join(srcDir, "components/ui/sidebar.tsx"),
        "utf-8",
      )

      expect(dialogContent).toContain('<span className="sr-only">Tutup</span>')
      expect(sheetContent).toContain('<span className="sr-only">Tutup</span>')
      expect(breadcrumbContent).toContain('<span className="sr-only">Lainnya</span>')
      expect(sidebarContent).toContain('<span className="sr-only">Alihkan Bilah Sisi</span>')
    })

    it("memastikan status predikat tidak hanya dibedakan dengan warna tetapi juga teks eksplisit ('Tuntas' / 'Belum Tuntas')", () => {
      const gradesTableContent = fs.readFileSync(
        path.join(srcDir, "features/nilai/grades-table-view.tsx"),
        "utf-8",
      )
      expect(gradesTableContent).toContain("Tuntas")
      expect(gradesTableContent).toContain("Belum Tuntas")
    })
  })

  describe("3. Audit Token Warna & Dynamic Import Pustaka Berat", () => {
    it("memastikan grafik-dashboard.tsx menggunakan token CSS variabel tanpa hex hardcoded", () => {
      const chartContent = fs.readFileSync(
        path.join(srcDir, "features/dashboard/grafik-dashboard.tsx"),
        "utf-8",
      )
      expect(chartContent).not.toMatch(/#[0-9a-fA-F]{3,6}/)
      expect(chartContent).toContain("var(--color-chart-1)")
    })

    it("memastikan exceljs dan jspdf diimpor secara dinamis pada saat tombol ekspor diklik", () => {
      const exportBtnContent = fs.readFileSync(
        path.join(srcDir, "components/shared/export-button.tsx"),
        "utf-8",
      )
      expect(exportBtnContent).toMatch(/await\s+import\(\s*["']@\/lib\/ekspor\/ekspor-excel["']\s*\)/)
      expect(exportBtnContent).toMatch(/await\s+import\(\s*["']@\/lib\/ekspor\/ekspor-pdf["']\s*\)/)
      expect(exportBtnContent).not.toMatch(/^import\s+.*from\s+["']exceljs["']/m)
      expect(exportBtnContent).not.toMatch(/^import\s+.*from\s+["']jspdf["']/m)
    })
  })
})
