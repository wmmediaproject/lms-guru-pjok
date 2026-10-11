"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { toast } from "sonner"
import { Activity, ShieldCheck, Sparkles } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-xl space-y-6 text-center">
        <div className="inline-flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-xs uppercase tracking-wider font-semibold border-primary/40 text-primary">
            <Activity className="mr-1.5 h-3.5 w-3.5" />
            Fase 0 — Fondasi Proyek
          </Badge>
        </div>

        <h1 className="font-heading text-4xl sm:text-6xl font-extrabold uppercase tracking-tight text-foreground">
          LMS GURU PJOK
        </h1>

        <p className="text-muted-foreground text-base sm:text-lg">
          Fondasi aplikasi web pengelolaan nilai dan siswa Kelas 1–6 telah siap dengan tema sporty, Next.js 16, Tailwind 4, dan shadcn/ui.
        </p>

        <Card className="border border-border/80 shadow-sm text-left">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-xl uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Status Verifikasi Fondasi
            </CardTitle>
            <CardDescription>
              Seluruh dependensi utama, provider tema, font condensed, dan pustaka ekspor/impor telah terpasang.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-md bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">Next.js 16.2.7</span>
              <span className="rounded-md bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">Tailwind 4</span>
              <span className="rounded-md bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">shadcn/ui (Radix)</span>
              <span className="rounded-md bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">TanStack Query & Table</span>
              <span className="rounded-md bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">Barlow Condensed</span>
            </div>

            <Button
              className="w-full font-semibold uppercase tracking-wider gap-2 cursor-pointer"
              onClick={() => toast.success("Toast Sonner berfungsi dengan baik!", {
                description: "Provider tema dan toast berhasil dikonfigurasi.",
              })}
            >
              <Sparkles className="h-4 w-4" />
              Uji Notifikasi Toast
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
