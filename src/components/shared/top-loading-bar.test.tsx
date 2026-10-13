import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import { TopLoadingBar } from "./top-loading-bar"
import { useTopLoadingBar } from "@/hooks/use-top-loading-bar"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Mock next/navigation
let currentPath = "/dashboard"
let currentParams = ""

vi.mock("next/navigation", () => ({
  usePathname: () => currentPath,
  useSearchParams: () => new URLSearchParams(currentParams),
}))

describe("TopLoadingBar & useTopLoadingBar", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    useTopLoadingBar.getState().reset()
    currentPath = "/dashboard"
    currentParams = ""
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  it("awalnya tidak ter-render di DOM saat progress 0 dan visible false", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TopLoadingBar trackQueries={false} />
      </QueryClientProvider>
    )

    expect(screen.queryByRole("progressbar")).toBeNull()
  })

  it("menampilkan progress bar saat useTopLoadingBar.getState().start() dipanggil", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TopLoadingBar trackQueries={false} />
      </QueryClientProvider>
    )

    act(() => {
      useTopLoadingBar.getState().start()
    })

    const progressBar = screen.getByRole("progressbar")
    expect(progressBar).toBeDefined()
    expect(progressBar.getAttribute("aria-valuemin")).toBe("0")
    expect(progressBar.getAttribute("aria-valuemax")).toBe("100")
    expect(Number(progressBar.getAttribute("aria-valuenow"))).toBeGreaterThan(0)
  })

  it("menyelesaikan dan menyembunyikan bar saat useTopLoadingBar.getState().done() dipanggil", async () => {
    vi.useFakeTimers()

    render(
      <QueryClientProvider client={queryClient}>
        <TopLoadingBar trackQueries={false} />
      </QueryClientProvider>
    )

    act(() => {
      useTopLoadingBar.getState().start()
    })
    expect(screen.getByRole("progressbar")).toBeDefined()

    act(() => {
      useTopLoadingBar.getState().done()
    })

    // Progress langsung melompat ke 100
    const progressBar = screen.getByRole("progressbar")
    expect(progressBar.getAttribute("aria-valuenow")).toBe("100")

    // Setelah timeout 350ms, fade out dan unmount
    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(screen.queryByRole("progressbar")).toBeNull()
    vi.useRealTimers()
  })

  it("mendeteksi klik pada link internal untuk memulai animasi loading bar", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <div>
          <TopLoadingBar trackQueries={false} />
          <a href="/dashboard/nilai" id="test-nav-link">
            Ke Nilai
          </a>
        </div>
      </QueryClientProvider>
    )

    const link = screen.getByRole("link", { name: "Ke Nilai" })

    act(() => {
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
    })

    expect(screen.getByRole("progressbar")).toBeDefined()
  })
})
