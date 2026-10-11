"use client"

import * as React from "react"
import { CalendarDays } from "lucide-react"
import { useActivePeriod } from "@/hooks/use-periods"
import type { Period } from "@/lib/supabase/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface PeriodSelectProps {
  initialPeriods?: Period[]
  fallbackName?: string | null
  className?: string
}

export function PeriodSelect({
  initialPeriods,
  fallbackName,
  className,
}: PeriodSelectProps) {
  const { periods, selectedPeriod, selectedPeriodId, setSelectedPeriodId } =
    useActivePeriod(initialPeriods)

  if (periods.length === 0) {
    return (
      <div
        className="inline-flex h-7 sm:h-8 items-center gap-1 sm:gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 sm:px-2.5 text-[11px] sm:text-xs font-medium text-foreground"
        aria-label="Periode aktif saat ini"
      >
        <CalendarDays
          className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0"
          aria-hidden="true"
        />
        <span className="max-w-28 sm:max-w-none truncate">
          {fallbackName || "Semester Ganjil 2026-2027"}
        </span>
      </div>
    )
  }

  return (
    <Select
      value={selectedPeriodId ?? undefined}
      onValueChange={(val) => setSelectedPeriodId(val)}
    >
      <SelectTrigger
        size="sm"
        aria-label="Pilih periode semester"
        className={
          className ??
          "h-7 sm:h-8 max-w-28 xs:max-w-36 sm:max-w-64 gap-1 sm:gap-1.5 px-2 sm:px-2.5 border-primary/30 bg-primary/5 text-[11px] sm:text-xs font-medium cursor-pointer"
        }
      >
        <CalendarDays
          className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0"
          aria-hidden="true"
        />
        <SelectValue placeholder={selectedPeriod?.nama ?? "Pilih periode"} />
      </SelectTrigger>
      <SelectContent align="end">
        {periods.map((period) => (
          <SelectItem
            key={period.id}
            value={period.id}
            className="text-xs cursor-pointer"
          >
            <span>{period.nama}</span>
            {period.is_active && (
              <span className="ml-1.5 font-semibold text-primary">
                (Aktif)
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
