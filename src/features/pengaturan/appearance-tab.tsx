"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useTheme } from "@teispace/next-themes"
import {
  Loader2,
  Monitor,
  Moon,
  PanelLeft,
  RotateCcw,
  Save,
  School,
  Sun,
} from "lucide-react"
import { toast } from "sonner"

import type { Settings } from "@/lib/supabase/types"
import { SETTINGS_QUERY_KEY, useSettings } from "@/hooks/use-settings"
import { SIDEBAR_STORAGE_KEY } from "@/lib/sidebar-utils"
import {
  appearanceSettingsSchema,
  type AppearanceSettingsInput,
} from "@/lib/validators/pengaturan"
import { simpanTampilanAction } from "./actions"
import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { useSidebar } from "@/components/ui/sidebar"

export interface AppearanceTabProps {
  initialSettings?: Settings | null
}

const THEME_OPTIONS = {
  light: { label: "Terang", Icon: Sun },
  dark: { label: "Gelap", Icon: Moon },
  system: { label: "Sistem (Perangkat)", Icon: Monitor },
} as const

export function AppearanceTab({ initialSettings }: AppearanceTabProps) {
  const queryClient = useQueryClient()
  const { data: settings } = useSettings(initialSettings)
  const { theme, setTheme } = useTheme()
  const { setOpen } = useSidebar()
  const [isPending, startTransition] = React.useTransition()

  const activeThemeKey =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system"
  const ActiveThemeIcon = THEME_OPTIONS[activeThemeKey].Icon
  const activeThemeLabel = THEME_OPTIONS[activeThemeKey].label

  const form = useForm<AppearanceSettingsInput>({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: {
      nama_sekolah: settings?.nama_sekolah ?? "",
    },
  })

  React.useEffect(() => {
    if (settings) {
      form.reset({
        nama_sekolah: settings.nama_sekolah ?? "",
      })
    }
  }, [settings, form])

  const onSubmitSchoolName = (values: AppearanceSettingsInput) => {
    startTransition(async () => {
      const result = await simpanTampilanAction(values)
      if (!result.success) {
        toast.error(result.error ?? "Gagal menyimpan nama sekolah")
        return
      }
      toast.success("Nama sekolah berhasil disimpan")
      await queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
    })
  }

  const handleResetSidebar = () => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, "true")
    } catch {
      // Ignore storage error
    }
    setOpen(true)
    toast.success("Status bilah sisi (sidebar) dikembalikan ke terbuka")
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Kartu Nama Sekolah */}
      <Card>
        <CardHeader className="border-b border-border/60 pb-3.5 sm:pb-4">
          <CardTitle className="font-heading text-base sm:text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            <School
              className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>Identitas Sekolah</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm leading-relaxed">
            Nama sekolah bersifat opsional dan akan ditampilkan di header
            dashboard serta dokumen ekspor PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitSchoolName)}
              className="w-full max-w-md space-y-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="nama_sekolah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">
                      Nama Sekolah (Opsional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: SDN 01 Harapan Bangsa"
                        disabled={isPending}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription className="text-xs leading-relaxed">
                      Kosongkan jika tidak ingin menampilkan nama sekolah.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                <span>Simpan Nama Sekolah</span>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Kartu Tema Tampilan */}
      <Card>
        <CardHeader className="border-b border-border/60 pb-3.5 sm:pb-4">
          <CardTitle className="font-heading text-base sm:text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            <Sun
              className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>Tema Warna Aplikasi</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm leading-relaxed">
            Pilih tema tampilan terang, gelap, atau ikuti pengaturan perangkat
            secara otomatis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ButtonGroup className="flex w-full sm:inline-flex sm:w-auto items-stretch">
            <ButtonGroupText className="h-9 sm:h-8 flex-1 sm:flex-initial py-0 gap-2 border-input bg-background px-3 text-xs sm:text-sm font-medium text-foreground select-none dark:bg-input/30">
              <ActiveThemeIcon
                className="h-4 w-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <span className="leading-none whitespace-nowrap">
                {activeThemeLabel}
              </span>
            </ButtonGroupText>

            <Select
              value={activeThemeKey}
              onValueChange={(val) => setTheme(val)}
            >
              <SelectTrigger
                aria-label="Pilih tema warna aplikasi"
                className="h-9 w-9 sm:h-8 sm:w-8 py-0 px-0 justify-center border-input bg-background hover:bg-muted cursor-pointer dark:bg-input/30 dark:hover:bg-input/50"
              />
              <SelectContent position="popper" align="end" className="min-w-48">
                <SelectItem value="light" className="cursor-pointer">
                  <Sun
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>Terang</span>
                </SelectItem>
                <SelectItem value="dark" className="cursor-pointer">
                  <Moon
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>Gelap</span>
                </SelectItem>
                <SelectItem value="system" className="cursor-pointer">
                  <Monitor
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>Sistem (Perangkat)</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </ButtonGroup>
        </CardContent>
      </Card>

      {/* Kartu Reset Status Sidebar */}
      <Card>
        <CardHeader className="border-b border-border/60 pb-3.5 sm:pb-4">
          <CardTitle className="font-heading text-base sm:text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            <PanelLeft
              className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>Bilah Sisi (Sidebar)</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm leading-relaxed">
            Kembalikan posisi bilah sisi ke kondisi terbuka (expanded) default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={handleResetSidebar}
            className="h-9 w-full sm:w-auto justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
          >
            <RotateCcw
              className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0"
              aria-hidden="true"
            />
            <span>Reset Status Bilah Sisi</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
