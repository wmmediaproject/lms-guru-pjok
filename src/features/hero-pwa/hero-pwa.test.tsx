import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { renderHook, act } from "@testing-library/react"
import { useInstallPrompt } from "@/hooks/use-install-prompt"
import { InstallAppButton } from "@/components/shared/install-app-button"
import manifest from "@/app/manifest"

describe("Fase 8 — Hero & PWA", () => {
  describe("1. Manifest Web App (app/manifest.ts)", () => {
    it("menghasilkan manifest dengan nama, start_url, display standalone, dan ikon 192/512/maskable", () => {
      const data = manifest()
      expect(data.name).toContain("LMS Guru PJOK")
      expect(data.start_url).toBe("/")
      expect(data.display).toBe("standalone")
      expect(data.lang).toBe("id")

      const icons = data.icons ?? []
      expect(icons.length).toBeGreaterThanOrEqual(4)

      const sizes = icons.map((i) => i.sizes)
      expect(sizes).toContain("192x192")
      expect(sizes).toContain("512x512")

      const maskable = icons.filter((i) => i.purpose === "maskable")
      expect(maskable.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe("2. Hook useInstallPrompt", () => {
    let originalMatchMedia: typeof window.matchMedia

    beforeEach(() => {
      originalMatchMedia = window.matchMedia
    })

    afterEach(() => {
      window.matchMedia = originalMatchMedia
      vi.restoreAllMocks()
    })

    it("mengembalikan canInstall=false secara default bila event beforeinstallprompt belum terjadi", () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const { result } = renderHook(() => useInstallPrompt())
      expect(result.current.canInstall).toBe(false)
      expect(result.current.isInstalled).toBe(false)
    })

    it("mendeteksi display-mode standalone dan menandai isInstalled=true", () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("display-mode: standalone"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const { result } = renderHook(() => useInstallPrompt())
      expect(result.current.isInstalled).toBe(true)
      expect(result.current.canInstall).toBe(false)
    })

    it("mengaktifkan canInstall saat event beforeinstallprompt diterima dan memanggil prompt() saat diinstal", async () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const { result } = renderHook(() => useInstallPrompt())

      const mockPrompt = vi.fn().mockResolvedValue(undefined)
      const fakeEvent = Object.assign(new Event("beforeinstallprompt"), {
        platforms: ["web"],
        userChoice: Promise.resolve({ outcome: "accepted" as const, platform: "web" }),
        prompt: mockPrompt,
      })

      act(() => {
        window.dispatchEvent(fakeEvent)
      })

      expect(result.current.canInstall).toBe(true)
      expect(result.current.isSupported).toBe(true)

      let installSuccess = false
      await act(async () => {
        installSuccess = await result.current.installApp()
      })

      expect(installSuccess).toBe(true)
      expect(mockPrompt).toHaveBeenCalledTimes(1)
      expect(result.current.isInstalled).toBe(true)
      expect(result.current.canInstall).toBe(false)
    })

    it("menandai isInstalled=true dan canInstall=false ketika event appinstalled ditembakkan", () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const { result } = renderHook(() => useInstallPrompt())

      act(() => {
        window.dispatchEvent(new Event("appinstalled"))
      })

      expect(result.current.isInstalled).toBe(true)
      expect(result.current.canInstall).toBe(false)
    })
  })

  describe("3. Komponen InstallAppButton", () => {
    let originalMatchMedia: typeof window.matchMedia

    beforeEach(() => {
      originalMatchMedia = window.matchMedia
    })

    afterEach(() => {
      window.matchMedia = originalMatchMedia
      vi.restoreAllMocks()
    })

    it("tidak merender apa pun bila canInstall=false (tidak didukung atau belum ada event)", () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const { container } = render(<InstallAppButton />)
      expect(container.firstChild).toBeNull()
    })

    it("merender tombol 'Install App' dan mengeksekusi instalasi saat diklik", async () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const { container } = render(<InstallAppButton />)
      expect(container.firstChild).toBeNull()

      const mockPrompt = vi.fn().mockResolvedValue(undefined)
      const fakeEvent = Object.assign(new Event("beforeinstallprompt"), {
        platforms: ["web"],
        userChoice: Promise.resolve({ outcome: "accepted" as const, platform: "web" }),
        prompt: mockPrompt,
      })

      act(() => {
        window.dispatchEvent(fakeEvent)
      })

      const button = screen.getByRole("button", { name: /install/i })
      expect(button).toBeDefined()
      expect(button.textContent).toContain("Install App")

      await act(async () => {
        fireEvent.click(button)
      })

      expect(mockPrompt).toHaveBeenCalledTimes(1)
    })
  })
})
