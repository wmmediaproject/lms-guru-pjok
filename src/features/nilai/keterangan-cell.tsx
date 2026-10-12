"use client"

import * as React from "react"
import { Eraser, MessageSquareText, Sparkles } from "lucide-react"
import { MAX_KETERANGAN_LENGTH } from "@/lib/validators/nilai"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export interface PilihanKeterangan {
  id: string
  label: string
  keterangan: string
}

export const PILIHAN_KETERANGAN_PJOK: readonly PilihanKeterangan[] = [
  {
    id: "sangat_baik",
    label: "Sangat Baik",
    keterangan:
      "Sangat baik dalam menguasai gerak dasar lokomotor, non-lokomotor, dan manipulatif, serta selalu antusias, disiplin, dan sportif dalam pembelajaran PJOK.",
  },
  {
    id: "baik",
    label: "Baik",
    keterangan:
      "Baik dalam memahami dan mempraktikkan keterampilan gerak dasar serta menjaga kebugaran jasmani dengan sikap kerja sama dan sportivitas yang positif.",
  },
  {
    id: "cukup",
    label: "Cukup",
    keterangan:
      "Cukup baik dalam mengikuti aktivitas pembelajaran PJOK, namun perlu lebih giat berlatih agar koordinasi gerak dan daya tahan fisik semakin meningkat.",
  },
  {
    id: "perlu_bimbingan",
    label: "Perlu Bimbingan",
    keterangan:
      "Perlu bimbingan dan latihan lebih lanjut dalam penguasaan keterampilan gerak dasar serta peningkatan motivasi dan kebugaran fisik saat berolahraga.",
  },
  {
    id: "aktif_sportif",
    label: "Aktif & Sportif",
    keterangan:
      "Menunjukkan semangat olahraga yang tinggi, aktif bergerak, mematuhi aturan permainan, dan mampu bekerja sama secara sportif dengan teman.",
  },
  {
    id: "disiplin_bugar",
    label: "Disiplin & Bugar",
    keterangan:
      "Memiliki kebugaran jasmani yang prima, disiplin dalam pemanasan maupun praktik olahraga, serta konsisten menerapkan pola hidup sehat.",
  },
] as const

const CLEAR_VALUE = "__kosongkan__"

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

  const matchedPreset = React.useMemo(
    () =>
      PILIHAN_KETERANGAN_PJOK.find(
        (item) => item.keterangan === value.trim(),
      ) ?? null,
    [value],
  )

  const handleSelectPreset = (selectedId: string) => {
    if (selectedId === CLEAR_VALUE) {
      onChange("")
      return
    }
    const found = PILIHAN_KETERANGAN_PJOK.find((item) => item.id === selectedId)
    if (found) {
      onChange(found.keterangan)
    }
  }

  return (
    <div className="flex flex-col justify-center gap-1 min-w-68">
      <div className="flex items-center gap-1.5">
        <Select
          value={matchedPreset?.id ?? ""}
          onValueChange={handleSelectPreset}
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            aria-label={`Pilih cepat keterangan ${studentName}`}
            className="h-8 w-[122px] shrink-0 px-2 text-xs font-medium cursor-pointer"
          >
            <SelectValue
              placeholder={value.trim() ? "Kustom" : "Pilih Cepat"}
            />
          </SelectTrigger>
          <SelectContent position="popper" align="start" className="w-64">
            {PILIHAN_KETERANGAN_PJOK.map((preset) => (
              <SelectItem
                key={preset.id}
                value={preset.id}
                className="cursor-pointer"
              >
                <span className="font-medium">{preset.label}</span>
              </SelectItem>
            ))}
            {value.trim() !== "" && (
              <SelectItem
                value={CLEAR_VALUE}
                className="text-muted-foreground cursor-pointer"
              >
                Kosongkan Keterangan
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        <Input
          type="text"
          value={value}
          title={value || undefined}
          disabled={disabled}
          maxLength={MAX_KETERANGAN_LENGTH}
          placeholder="Pilih cepat atau ketik catatan..."
          aria-label={`Keterangan nilai ${studentName}`}
          aria-invalid={isOverLimit}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-8 min-w-36 flex-1 text-xs",
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
          <PopoverContent align="end" className="w-80 sm:w-96 space-y-3 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground truncate">
                Keterangan — {studentName}
              </p>
              <span
                className={cn(
                  "text-[11px] font-mono tabular-nums",
                  isOverLimit
                    ? "text-destructive font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {charCount}/{MAX_KETERANGAN_LENGTH}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <Sparkles
                    className="h-3 w-3 text-primary"
                    aria-hidden="true"
                  />
                  Pilihan Keterangan Siap Pakai:
                </span>
                {value.trim() !== "" && (
                  <button
                    type="button"
                    onClick={() => onChange("")}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    <Eraser className="h-3 w-3" aria-hidden="true" />
                    <span>Kosongkan</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PILIHAN_KETERANGAN_PJOK.map((preset) => {
                  const isSelected = matchedPreset?.id === preset.id
                  return (
                    <Badge
                      key={preset.id}
                      variant={isSelected ? "default" : "outline"}
                       asChild
                    >
                      <button
                        type="button"
                        onClick={() => onChange(preset.keterangan)}
                        className={cn(
                          "cursor-pointer px-2 py-0.5 text-[11px] font-medium transition-colors",
                          !isSelected &&
                            "hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
                        )}
                      >
                        {preset.label}
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>

            <Textarea
              rows={4}
              value={value}
              maxLength={MAX_KETERANGAN_LENGTH}
              placeholder="Contoh: Sangat baik dalam menguasai gerak dasar lokomotor, non-lokomotor, dan manipulatif..."
              aria-label={`Editor teks panjang keterangan ${studentName}`}
              onChange={(e) => onChange(e.target.value)}
              className="text-xs resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Disimpan otomatis setelah dipilih atau diketik.</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setPopoverOpen(false)}
                className="h-6 px-2.5 text-xs cursor-pointer"
              >
                Selesai
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {error && (
        <span
          role="alert"
          className="px-0.5 text-[11px] text-destructive font-medium"
        >
          {error}
        </span>
      )}
    </div>
  )
}
