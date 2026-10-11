"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useInstallPrompt } from "@/hooks/use-install-prompt"

interface InstallAppButtonProps {
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
}

export function InstallAppButton({
  className,
  size = "lg",
  variant = "outline",
}: InstallAppButtonProps) {
  const { canInstall, installApp } = useInstallPrompt()

  // Sembunyikan bila sudah terpasang (standalone), setelah appinstalled, atau browser tidak mendukung install prompt
  if (!canInstall) {
    return null
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => void installApp()}
      className={className}
      aria-label="Install Aplikasi LMS Guru PJOK"
    >
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  )
}
