"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Save,
  Sliders,
} from "lucide-react"
import { toast } from "sonner"

import type { Settings } from "@/lib/supabase/types"
import { SETTINGS_QUERY_KEY, useSettings } from "@/hooks/use-settings"
import { DEFAULT_BOBOT, DEFAULT_KKM } from "@/lib/hitung/nilai-akhir"
import {
  weightSettingsSchema,
  type WeightSettingsInput,
} from "@/lib/validators/pengaturan"
import { simpanPenilaianAction } from "./actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export interface WeightSettingsFormProps {
  initialSettings?: Settings | null
}

export function WeightSettingsForm({
  initialSettings,
}: WeightSettingsFormProps) {
  const queryClient = useQueryClient()
  const { data: settings } = useSettings(initialSettings)
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<WeightSettingsInput>({
    resolver: zodResolver(weightSettingsSchema),
    defaultValues: {
      bobot_praktek:
        Number(settings?.bobot_praktek) || DEFAULT_BOBOT.bobot_praktek,
      bobot_uh: Number(settings?.bobot_uh) || DEFAULT_BOBOT.bobot_uh,
      bobot_asts: Number(settings?.bobot_asts) || DEFAULT_BOBOT.bobot_asts,
      bobot_asas: Number(settings?.bobot_asas) || DEFAULT_BOBOT.bobot_asas,
      kkm: Number(settings?.kkm) || DEFAULT_KKM,
    },
  })

  React.useEffect(() => {
    if (settings) {
      form.reset({
        bobot_praktek: Number(settings.bobot_praktek),
        bobot_uh: Number(settings.bobot_uh),
        bobot_asts: Number(settings.bobot_asts),
        bobot_asas: Number(settings.bobot_asas),
        kkm: Number(settings.kkm),
      })
    }
  }, [settings, form])

  const watchedValues = useWatch({
    control: form.control,
  })
  const wPraktek = Number(watchedValues.bobot_praktek) || 0
  const wUh = Number(watchedValues.bobot_uh) || 0
  const wAsts = Number(watchedValues.bobot_asts) || 0
  const wAsas = Number(watchedValues.bobot_asas) || 0

  const totalBobot =
    Math.round((wPraktek + wUh + wAsts + wAsas) * 100) / 100
  const isTotalValid = totalBobot === 100

  const handleResetDefault = () => {
    form.reset({
      bobot_praktek: DEFAULT_BOBOT.bobot_praktek,
      bobot_uh: DEFAULT_BOBOT.bobot_uh,
      bobot_asts: DEFAULT_BOBOT.bobot_asts,
      bobot_asas: DEFAULT_BOBOT.bobot_asas,
      kkm: DEFAULT_KKM,
    })
  }

  const onSubmit = (values: WeightSettingsInput) => {
    startTransition(async () => {
      const result = await simpanPenilaianAction(values)
      if (!result.success) {
        toast.error(result.error ?? "Gagal menyimpan pengaturan penilaian")
        return
      }
      toast.success(
        "Pengaturan bobot dan KKM berhasil disimpan. Seluruh nilai siswa telah diperbarui.",
      )
      await queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
    })
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="font-heading text-base sm:text-xl font-bold uppercase tracking-wide flex items-center gap-2">
          <Sliders
            className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span>Bobot Komponen Nilai &amp; KKM</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm leading-relaxed">
          Atur persentase bobot keempat komponen penilaian (total wajib 100%)
          serta Kriteria Ketuntasan Minimal (KKM). Perubahan akan otomatis
          menghitung ulang Nilai Akhir dan Predikat seluruh siswa.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-6"
            noValidate
          >
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="bobot_praktek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">
                      Bobot Nilai Praktek (%)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        disabled={isPending}
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? 0
                              : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bobot_uh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">
                      Bobot Nilai UH (%)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        disabled={isPending}
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? 0
                              : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bobot_asts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">
                      Bobot Nilai ASTS (%)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        disabled={isPending}
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? 0
                              : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bobot_asas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">
                      Bobot Nilai ASAS (%)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        disabled={isPending}
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? 0
                              : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Indikator Penjumlah Total Bobot Langsung */}
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/40 px-3.5 py-2.5 sm:px-4 sm:py-3"
            >
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Total Bobot Komponen Saat Ini:
              </span>
              {isTotalValid ? (
                <Badge className="w-fit gap-1.5 bg-primary text-primary-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{totalBobot}% (Sesuai — 100%)</span>
                </Badge>
              ) : (
                <Badge variant="destructive" className="w-fit gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{totalBobot}% (Wajib tepat 100%)</span>
                </Badge>
              )}
            </div>

            <Separator />

            <div className="w-full sm:max-w-xs">
              <FormField
                control={form.control}
                name="kkm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">
                      Kriteria Ketuntasan Minimal (KKM)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        disabled={isPending}
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? 0
                              : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription className="text-xs leading-relaxed">
                      Siswa dinyatakan <strong>Tuntas</strong> bila Nilai Akhir
                      &ge; KKM, dan <strong>Belum Tuntas</strong> bila &lt; KKM.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={handleResetDefault}
                className="h-9 w-full sm:w-auto justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
              >
                <RotateCcw
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  Kembalikan Default (25% &amp; KKM 75)
                </span>
              </Button>

              <Button
                type="submit"
                disabled={isPending}
                className="h-9 w-full sm:w-auto justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin shrink-0" />
                ) : (
                  <Save
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span>Simpan Pengaturan Penilaian</span>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
