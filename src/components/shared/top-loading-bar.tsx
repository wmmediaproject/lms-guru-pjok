"use client"

import * as React from "react"
import * as NextNav from "next/navigation"
import * as ReactQuery from "@tanstack/react-query"
import { useTopLoadingBar } from "@/hooks/use-top-loading-bar"
import { cn } from "@/lib/utils"

function useSafeQueryActivity(enabled: boolean) {
  // Jika trackQueries false, tidak perlu query client
  if (!enabled) return { isFetching: 0, isMutating: 0 }

  try {
    const isFetching = ReactQuery.useIsFetching()
    const isMutating = ReactQuery.useIsMutating()
    return { isFetching, isMutating }
  } catch {
    return { isFetching: 0, isMutating: 0 }
  }
}

export interface TopLoadingBarProps {
  className?: string
  /**
   * Mengikutsertakan TanStack React Query fetching & mutating status ke top bar
   * Default: true
   */
  trackQueries?: boolean
}

export function TopLoadingBar({
  className,
  trackQueries = true,
}: TopLoadingBarProps) {
  const pathname = typeof NextNav.usePathname === "function" ? NextNav.usePathname() : "/"
  const { progress, visible, start, done } = useTopLoadingBar()

  const { isFetching, isMutating } = useSafeQueryActivity(trackQueries)

  // Track page transitions: saat pathname berubah, selesaikan progress bar
  const prevPathRef = React.useRef(pathname)

  React.useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname
      done()
    }
  }, [pathname, done])

  // Tangkap klik pada tautan <a> untuk memicu animasi secara instan sebelum halaman selesai dirender
  React.useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      // Hanya tangkap klik kiri biasa tanpa modifier (Ctrl/Cmd/Shift/Alt)
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target as HTMLElement | null
      const anchor = target?.closest("a")
      if (!anchor) return

      const href = anchor.getAttribute("href")
      const targetAttr = anchor.getAttribute("target")

      // Abaikan target _blank, link download, hash anchor (#), atau javascript:
      if (
        !href ||
        (targetAttr && targetAttr !== "_self") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return
      }

      // Periksa apakah URL internal
      try {
        const url = new URL(anchor.href, window.location.href)
        const isSameOrigin = url.origin === window.location.origin

        if (isSameOrigin) {
          const isSamePage =
            url.pathname === window.location.pathname &&
            url.search === window.location.search

          // Hanya mulai progress jika berpindah ke rute/parameter berbeda
          if (!isSamePage) {
            start()
          }
        }
      } catch {
        // Abaikan URL parsing error
      }
    }

    // Tangkap popstate (tombol back/forward browser)
    const handlePopState = () => {
      start()
    }

    document.addEventListener("click", handleDocumentClick, true)
    window.addEventListener("popstate", handlePopState)

    return () => {
      document.removeEventListener("click", handleDocumentClick, true)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [start])

  // Track React Query isFetching / isMutating jika diaktifkan (dengan debounce singkat agar tidak flick)
  React.useEffect(() => {
    if (!trackQueries) return

    const hasActiveAsync = isFetching > 0 || isMutating > 0
    let timeoutId: NodeJS.Timeout | null = null

    if (hasActiveAsync) {
      // Debounce 100ms agar query instan/mikro tidak membuat flicker
      timeoutId = setTimeout(() => {
        start()
      }, 100)
    } else {
      done()
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [trackQueries, isFetching, isMutating, start, done])

  if (!visible && progress === 0) {
    return null
  }

  return (
    <div
      role="progressbar"
      aria-label="Status pemuatan halaman"
      data-testid="top-loading-bar"
      data-slot="top-loading-bar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2.5px] w-full overflow-hidden bg-transparent transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <div
        className="relative h-full bg-gradient-to-r from-primary/80 via-primary to-accent shadow-[0_0_8px_var(--color-primary)] transition-all duration-300 ease-out will-change-[width]"
        style={{
          width: `${Math.min(100, Math.max(0, progress))}%`,
        }}
      >
        {/* Kilau siluet halus di ujung kanan garis */}
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-r from-transparent to-white/60 blur-[1px]" />
      </div>
    </div>
  )
}
