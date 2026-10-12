"use client"

import * as React from "react"
import { CalendarDays } from "lucide-react"
import { useActivePeriod } from "@/hooks/use-periods"
import type { Period } from "@/lib/supabase/types"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

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

  const currentPeriodLabel =
    selectedPeriod?.nama ?? fallbackName ?? "Semester Ganjil 2026-2027"

  if (periods.length === 0) {
    return (
      <ButtonGroup className={cn("inline-flex items-stretch", className)}>
        <ButtonGroupText
          className="h-8 py-0 gap-1.5 border-primary/30 bg-primary/5 px-2.5 text-xs font-medium text-foreground select-none"
          aria-label="Periode aktif saat ini"
        >
          <CalendarDays
            className="h-3.5 w-3.5 text-primary shrink-0"
            aria-hidden="true"
          />
          <span className="max-w-32 sm:max-w-none truncate leading-none">
            {currentPeriodLabel}
          </span>
        </ButtonGroupText>
      </ButtonGroup>
    )
  }

  return (
    <ButtonGroup className={cn("inline-flex items-stretch", className)}>
      <ButtonGroupText className="h-8 py-0 gap-1.5 border-primary/30 bg-primary/5 px-2.5 text-xs font-medium text-foreground select-none">
        <CalendarDays
          className="h-3.5 w-3.5 text-primary shrink-0"
          aria-hidden="true"
        />
        <span className="max-w-32 xs:max-w-40 sm:max-w-60 truncate leading-none">
          {currentPeriodLabel}
        </span>
      </ButtonGroupText>

      <Select
        value={selectedPeriodId ?? undefined}
        onValueChange={(val) => setSelectedPeriodId(val)}
      >
        <SelectTrigger
          aria-label="Pilih periode semester"
          className="h-8 w-8 py-0 px-0 justify-center border-primary/30 bg-primary/5 hover:bg-primary/10 text-xs font-medium cursor-pointer"
        />
        <SelectContent position="popper" align="end" className="min-w-56">
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
    </ButtonGroup>
  )
}
