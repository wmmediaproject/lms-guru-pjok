"use client"

import { useCallback, useEffect, useState } from "react"

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

function getIsInitialStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState<boolean>(getIsInitialStandalone)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Dengarkan event beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setIsSupported(true)
    }

    // Dengarkan event appinstalled ketika user selesai memasang PWA
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
    }

    // Deteksi perubahan display-mode jika pengguna membuka dari aplikasi terpasang
    const mediaQueryList = window.matchMedia("(display-mode: standalone)")
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true)
        setDeferredPrompt(null)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    mediaQueryList.addEventListener("change", handleDisplayModeChange)

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      )
      window.removeEventListener("appinstalled", handleAppInstalled)
      mediaQueryList.removeEventListener("change", handleDisplayModeChange)
    }
  }, [])

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      return false
    }

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true)
        setDeferredPrompt(null)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [deferredPrompt])

  // Tombol hanya boleh ditampilkan bila:
  // 1. Belum terpasang (!isInstalled)
  // 2. Browser mendukung dan prompt instalasi siap (isSupported && deferredPrompt !== null)
  const canInstall = !isInstalled && isSupported && deferredPrompt !== null

  return {
    isInstalled,
    isSupported,
    canInstall,
    installApp,
  }
}
