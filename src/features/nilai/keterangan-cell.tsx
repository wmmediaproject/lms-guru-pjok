"use client"

import * as React from "react"
import { MessageSquareText } from "lucide-react"
import { MAX_KETERANGAN_LENGTH } from "@/lib/validators/nilai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export interface KeteranganCellProps {
  studentName: string
  value: string
  error?: string | null
  disabled?: boolean
  onChange: (nextValue: string) => void
}

export function KeteranganCell({
  studentName,
  value,
  error,
  disabled = false,
  onChange,
}: KeteranganCellProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const charCount = value.length
  const isOverLimit = charCount > MAX_KETERANGAN_LENGTH || Boolean(error)

  return (
    <div className="flex flex-col gap-1 min-w-48">
      <div className="flex items-center gap-1.5">
        <Input
          type="text"
          value={value}
          disabled={disabled}
          maxLength={MAX_KETERANGAN_LENGTH}
          placeholder="Catatan capaian siswa..."
          aria-label={`Keterangan nilai ${studentName}`}
          aria-invalid={isOverLimit}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-8 text-xs",
            isOverLimit &&
              "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive",
          )}
        />

        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={disabled}
              aria-label={`Buka editor keterangan lengkap ${studentName}`}
              className="h-8 w-8 shrink-0 cursor-pointer"
            >
              <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-2.5 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground truncate">
                Keterangan — {studentName}
              </p>
              <span
                className={cn(
                  "text-[11px] font-mono tabular-nums",
                  isOverLimit ? "text-destructive font-semibold" : "text-muted-foreground",
                )}
              >
                {charCount}/{MAX_KETERANGAN_LENGTH}
              </span>
            </div>
            <Textarea
              rows={4}
              value={value}
              maxLength={MAX_KETERANGAN_LENGTH}
              placeholder="Contoh: Ananda sangat baik dalam memahami gerak lokomotor dan sportif saat bermain..."
              aria-label={`Editor teks panjang keterangan ${studentName}`}
              onChange={(e) => onChange(e.target.value)}
              className="text-xs resize-none"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Disimpan otomatis setelah berhenti mengetik.</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setPopoverOpen(false)}
                className="h-6 px-2 text-xs cursor-pointer"
              >
                Selesai
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center justify-between gap-2 px-0.5">
        {error ? (
          <span role="alert" className="text-[11px] text-destructive font-medium">
            {error}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">
            {charCount > 0 ? `${charCount}/${MAX_KETERANGAN_LENGTH} karakter` : "Maks. 300 karakter"}
          </span>
        )}
      </div>
    </div>
  )
}
