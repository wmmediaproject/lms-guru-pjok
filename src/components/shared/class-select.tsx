"use client"

import * as React from "react"
import { GraduationCap } from "lucide-react"
import { KELAS_LIST } from "@/lib/sidebar-utils"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface ClassSelectProps {
  value: number | "semua"
  onValueChange: (value: number | "semua") => void
  allowAll?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  ariaLabel?: string
}

export function ClassSelect({
  value,
  onValueChange,
  allowAll = false,
  disabled = false,
  placeholder = "Pilih kelas",
  className,
  ariaLabel = "Pilih kelas",
}: ClassSelectProps) {
  const currentLabel =
    value === "semua"
      ? "Semua Kelas"
      : value
        ? `Kelas ${value}`
        : placeholder

  return (
    <ButtonGroup className={cn("inline-flex items-stretch", className)}>
      <ButtonGroupText className="h-8 py-0 gap-1.5 border-input bg-background px-2.5 text-xs sm:text-sm font-medium text-foreground select-none dark:bg-input/30">
        <GraduationCap
          className="h-4 w-4 text-primary shrink-0"
          aria-hidden="true"
        />
        <span className="leading-none whitespace-nowrap">{currentLabel}</span>
      </ButtonGroupText>

      <Select
        disabled={disabled}
        value={String(value)}
        onValueChange={(val) => {
          if (val === "semua") {
            onValueChange("semua")
          } else {
            onValueChange(Number(val))
          }
        }}
      >
        <SelectTrigger
          aria-label={ariaLabel}
          className="h-8 w-8 py-0 px-0 justify-center border-input bg-background hover:bg-muted cursor-pointer dark:bg-input/30 dark:hover:bg-input/50"
        />
        <SelectContent position="popper" align="end" className="min-w-40">
          {allowAll && (
            <SelectItem value="semua" className="cursor-pointer">
              Semua Kelas
            </SelectItem>
          )}
          {KELAS_LIST.map((kelas) => (
            <SelectItem
              key={kelas}
              value={String(kelas)}
              className="cursor-pointer"
            >
              Kelas {kelas}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ButtonGroup>
  )
}
