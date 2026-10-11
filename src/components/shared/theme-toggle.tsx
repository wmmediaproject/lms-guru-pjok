"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Check, Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Ganti tema tampilan"
          className="cursor-pointer"
        >
          <Sun className="h-[1.15rem] w-[1.15rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.15rem] w-[1.15rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Pilih Tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sun className="h-4 w-4" aria-hidden="true" />
            Terang
          </span>
          {theme === "light" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Moon className="h-4 w-4" aria-hidden="true" />
            Gelap
          </span>
          {theme === "dark" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Monitor className="h-4 w-4" aria-hidden="true" />
            Sistem
          </span>
          {theme === "system" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
