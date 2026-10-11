"use client"

import * as React from "react"
import { GraduationCap } from "lucide-react"
import { KELAS_LIST } from "@/lib/sidebar-utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  return (
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
        className={className ?? "w-40 gap-1.5 cursor-pointer"}
      >
        <GraduationCap
          className="h-4 w-4 text-primary shrink-0"
          aria-hidden="true"
        />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
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
  )
}
