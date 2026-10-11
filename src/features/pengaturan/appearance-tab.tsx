"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useTheme } from "@teispace/next-themes"
import {
  Check,
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
import { useSidebar } from "@/components/ui/sidebar"

export interface AppearanceTabProps {
  initialSettings?: Settings | null
}

export function AppearanceTab({ initialSettings }: AppearanceTabProps) {
  const queryClient = useQueryClient()
  const { data: settings } = useSettings(initialSettings)
  const { theme, setTheme } = useTheme()
  const { setOpen } = useSidebar()
  const [isPending, startTransition] = React.useTransition()

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
    <div className="space-y-6">
      {/* Kartu Nama Sekolah */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            <School className="h-5 w-5 text-primary" aria-hidden="true" />
            Identitas Sekolah
          </CardTitle>
          <CardDescription>
            Nama sekolah bersifat opsional dan akan ditampilkan di header
            dashboard serta dokumen ekspor PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitSchoolName)}
              className="space-y-4 max-w-md"
              noValidate
            >
              <FormField
                control={form.control}
                name="nama_sekolah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Sekolah (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: SDN 01 Harapan Bangsa"
                        disabled={isPending}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Kosongkan jika tidak ingin menampilkan nama sekolah.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isPending}
                className="gap-1.5 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                <span>Simpan Nama Sekolah</span>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Kartu Tema Tampilan */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            <Sun className="h-5 w-5 text-primary" aria-hidden="true" />
            Tema Warna Aplikasi
          </CardTitle>
          <CardDescription>
            Pilih tema tampilan terang, gelap, atau ikuti pengaturan perangkat
            secara otomatis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
              className="gap-2 cursor-pointer"
            >
              <Sun className="h-4 w-4" aria-hidden="true" />
              <span>Terang</span>
              {theme === "light" && <Check className="h-4 w-4" />}
            </Button>

            <Button
              type="button"
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
              className="gap-2 cursor-pointer"
            >
              <Moon className="h-4 w-4" aria-hidden="true" />
              <span>Gelap</span>
              {theme === "dark" && <Check className="h-4 w-4" />}
            </Button>

            <Button
              type="button"
              variant={theme === "system" ? "default" : "outline"}
              onClick={() => setTheme("system")}
              className="gap-2 cursor-pointer"
            >
              <Monitor className="h-4 w-4" aria-hidden="true" />
              <span>Sistem (Perangkat)</span>
              {theme === "system" && <Check className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kartu Reset Status Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            <PanelLeft className="h-5 w-5 text-primary" aria-hidden="true" />
            Bilah Sisi (Sidebar)
          </CardTitle>
          <CardDescription>
            Kembalikan posisi bilah sisi ke kondisi terbuka (expanded) default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={handleResetSidebar}
            className="gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Reset Status Bilah Sisi</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
