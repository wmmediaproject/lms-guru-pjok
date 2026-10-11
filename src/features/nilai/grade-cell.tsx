"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface GradeCellProps {
  studentName: string
  componentLabel: string
  rowIndex: number
  colIndex: number
  rawValue: string
  error?: string | null
  disabled?: boolean
  onRawChange: (nextRaw: string) => void
  onNavigateCell: (targetRow: number, targetCol: number) => void
}

export function GradeCell({
  studentName,
  componentLabel,
  rowIndex,
  colIndex,
  rawValue,
  error,
  disabled = false,
  onRawChange,
  onNavigateCell,
}: GradeCellProps) {
  const hasError = Boolean(error)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const selectionStart = input.selectionStart ?? 0
    const selectionEnd = input.selectionEnd ?? 0
    const valueLength = input.value.length

    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault()
      onNavigateCell(rowIndex + 1, colIndex)
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      onNavigateCell(rowIndex - 1, colIndex)
      return
    }

    if (
      e.key === "ArrowRight" &&
      selectionStart === valueLength &&
      selectionEnd === valueLength
    ) {
      e.preventDefault()
      onNavigateCell(rowIndex, colIndex + 1)
      return
    }

    if (
      e.key === "ArrowLeft" &&
      selectionStart === 0 &&
      selectionEnd === 0
    ) {
      e.preventDefault()
      onNavigateCell(rowIndex, colIndex - 1)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Input
        type="text"
        inputMode="decimal"
        data-grade-row={rowIndex}
        data-grade-col={colIndex}
        value={rawValue}
        disabled={disabled}
        placeholder="—"
        aria-label={`Nilai ${componentLabel} ${studentName}`}
        aria-invalid={hasError}
        onChange={(e) => onRawChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-8 w-20 text-center font-mono text-sm tabular-nums px-2",
          hasError &&
            "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive",
        )}
      />
      {hasError && (
        <span
          role="alert"
          className="max-w-28 text-[11px] leading-tight font-medium text-destructive"
        >
          {error}
        </span>
      )}
    </div>
  )
}
