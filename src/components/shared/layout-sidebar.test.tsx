import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AppSidebar } from "./app-sidebar"
import {
  KELAS_LIST,
  SIDEBAR_STORAGE_KEY,
  getBreadcrumbItems,
  parseSidebarCookie,
} from "@/lib/sidebar-utils"
import { PageHeader } from "./page-header"
import { EmptyState } from "./empty-state"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

// Mock next/navigation
const mockUsePathname = vi.fn(() => "/dashboard")
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  redirect: vi.fn(),
}))

vi.mock("@/components/shared/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">Tema</button>,
}))

vi.mock("@/app/masuk/actions", () => ({
  keluarAction: vi.fn(),
}))

// Mock matchMedia for useIsMobile in jsdom
beforeEach(() => {
  vi.clearAllMocks()
  mockUsePathname.mockReturnValue("/dashboard")
  window.localStorage.clear()
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

describe("Fase 2 — Layout Dashboard, Sidebar & Komponen Shared", () => {
  describe("1. Persistensi Cookie & localStorage Sidebar (sidebar_state)", () => {
    it("parseSidebarCookie membaca nilai cookie dengan benar dan default true", () => {
      expect(parseSidebarCookie(undefined)).toBe(true)
      expect(parseSidebarCookie("true")).toBe(true)
      expect(parseSidebarCookie("false")).toBe(false)
      expect(parseSidebarCookie("lainnya")).toBe(true)
    })

    it("menyimpan status collapse sidebar ke localStorage dan memulihkan jika cookie server belum ada", () => {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, "false")

      render(
        <TooltipProvider>
          <SidebarProvider defaultOpen={true}>
            <AppSidebar hasServerCookie={false} />
          </SidebarProvider>
        </TooltipProvider>,
      )

      expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("false")
      expect(document.cookie).toContain("sidebar_state=false")
    })
  })

  describe("2. Menu Sidebar & Submenu Kelas 1–6", () => {
    it("menampilkan grup Navigasi (Beranda) terpisah dari Menu Utama (Dashboard, Kelola Kelas, Nilai Siswa, Pengaturan)", () => {
      render(
        <TooltipProvider>
          <SidebarProvider defaultOpen={true}>
            <AppSidebar namaSekolah="SDN 01 Nusantara" hasServerCookie={true} />
          </SidebarProvider>
        </TooltipProvider>,
      )

      expect(screen.getByText("LMS GURU PJOK")).toBeDefined()
      expect(screen.getByText("SDN 01 Nusantara")).toBeDefined()
      expect(screen.getByText("Navigasi")).toBeDefined()
      expect(screen.getByText("Menu Utama")).toBeDefined()
      expect(screen.getByText("Beranda")).toBeDefined()
      expect(screen.getByText("Dashboard")).toBeDefined()
      expect(screen.getByText("Kelola Kelas")).toBeDefined()
      expect(screen.getByText("Nilai Siswa")).toBeDefined()
      expect(screen.getByText("Pengaturan")).toBeDefined()
    })

    it("secara default submenu Kelas 1–6 tertutup dan dapat dibuka/ditutup melalui tombol toggle", () => {
      render(
        <TooltipProvider>
          <SidebarProvider defaultOpen={true}>
            <AppSidebar hasServerCookie={true} />
          </SidebarProvider>
        </TooltipProvider>,
      )

      // Default tertutup: submenu Kelas 1 belum tampil di DOM
      expect(screen.queryByText("Kelas 1")).toBeNull()

      // Buka dropdown submenu
      const expandBtn = screen.getByLabelText("Tampilkan daftar kelas")
      fireEvent.click(expandBtn)

      for (const kelas of KELAS_LIST) {
        expect(screen.getByText(`Kelas ${kelas}`)).toBeDefined()
      }

      // Tutup kembali
      const toggleBtn = screen.getByLabelText("Sembunyikan daftar kelas")
      fireEvent.click(toggleBtn)

      expect(screen.queryByText("Kelas 1")).toBeNull()
    })
  })

  describe("3. Breadcrumb Bahasa Indonesia (getBreadcrumbItems)", () => {
    it("menghasilkan item breadcrumb Bahasa Indonesia untuk semua rute dashboard", () => {
      expect(getBreadcrumbItems("/dashboard")).toEqual([
        { label: "Dashboard", href: "/dashboard", isCurrent: true },
      ])

      expect(getBreadcrumbItems("/dashboard/kelas")).toEqual([
        { label: "Dashboard", href: "/dashboard", isCurrent: false },
        { label: "Kelola Kelas", href: "/dashboard/kelas", isCurrent: true },
      ])

      expect(getBreadcrumbItems("/dashboard/kelas/4")).toEqual([
        { label: "Dashboard", href: "/dashboard", isCurrent: false },
        { label: "Kelola Kelas", href: "/dashboard/kelas", isCurrent: false },
        { label: "Kelas 4", href: "/dashboard/kelas/4", isCurrent: true },
      ])

      expect(getBreadcrumbItems("/dashboard/nilai")).toEqual([
        { label: "Dashboard", href: "/dashboard", isCurrent: false },
        { label: "Nilai Siswa", href: "/dashboard/nilai", isCurrent: true },
      ])

      expect(getBreadcrumbItems("/dashboard/pengaturan")).toEqual([
        { label: "Dashboard", href: "/dashboard", isCurrent: false },
        { label: "Pengaturan", href: "/dashboard/pengaturan", isCurrent: true },
      ])
    })
  })

  describe("4. Komponen Reusable PageHeader & EmptyState", () => {
    it("merender PageHeader dengan judul, deskripsi, dan slot aksi", () => {
      render(
        <PageHeader
          title="Nilai Siswa"
          description="Kelola nilai PJOK per semester"
          actions={<button type="button">Ekspor Nilai</button>}
        />,
      )

      expect(screen.getByText("Nilai Siswa")).toBeDefined()
      expect(screen.getByText("Kelola nilai PJOK per semester")).toBeDefined()
      expect(screen.getByText("Ekspor Nilai")).toBeDefined()
    })

    it("merender EmptyState dengan judul, deskripsi, dan tombol aksi", () => {
      render(
        <EmptyState
          title="Belum Ada Siswa"
          description="Tambahkan siswa baru atau impor dari CSV."
          action={<button type="button">Tambah Siswa</button>}
        />,
      )

      expect(screen.getByText("Belum Ada Siswa")).toBeDefined()
      expect(
        screen.getByText("Tambahkan siswa baru atau impor dari CSV."),
      ).toBeDefined()
      expect(screen.getByText("Tambah Siswa")).toBeDefined()
    })

    it("merender DashboardHeader dengan Nama profil dan NIP di sebelah ikon profil untuk layar tablet landscape ke desktop (lg+)", async () => {
      const { DashboardHeader } = await import("./dashboard-header")

      render(
        <TooltipProvider>
          <SidebarProvider defaultOpen={true}>
            <DashboardHeader
              userName="Budi Santoso, S.Pd."
              userNip="19850101 201001 1 001"
              userEmail="budi@sekolah.sch.id"
              periodSlot={<span>Semester Ganjil 2026-2027</span>}
            />
          </SidebarProvider>
        </TooltipProvider>,
      )

      const userMenuBtn = screen.getByLabelText("Menu pengguna")
      expect(userMenuBtn.textContent).toContain("Budi Santoso, S.Pd.")
      expect(userMenuBtn.textContent).toContain("NIP: 19850101 201001 1 001")
    })
  })
})
