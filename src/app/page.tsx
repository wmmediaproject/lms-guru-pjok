import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ensureAdminProfile } from "@/lib/supabase/sync-admin-profile"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { InstallAppButton } from "@/components/shared/install-app-button"
import {
  Activity,
  ArrowRight,
  ClipboardList,
  GraduationCap,
  Sparkles,
  Trophy,
} from "lucide-react"

export default async function HomePage() {
  let isAuthenticated = false

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      isAuthenticated = true
      // Sinkronkan profil jika belum terdaftar
      await ensureAdminProfile(supabase)
    }
  } catch {
    isAuthenticated = false
  }

  return (
    <main className="relative flex h-dvh w-full flex-col justify-between overflow-hidden bg-background p-4 sm:p-6 lg:p-8 select-none">
      {/* Background Sporty Geometric & Glow Elements */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* Dynamic Glow Circles */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />

        {/* Sporty Diagonal Racing Stripes */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] [background:repeating-linear-gradient(45deg,#000,#000_15px,transparent_15px,transparent_30deg)] dark:[background:repeating-linear-gradient(45deg,#fff,#fff_15px,transparent_15px,transparent_30deg)]" />
      </div>

      {/* Header Bar */}
      <header className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <span className="font-heading text-xl sm:text-2xl font-black uppercase tracking-wider text-foreground">
              LMS GURU PJOK
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Center Hero Section */}
      <section className="my-auto flex flex-col items-center text-center max-w-4xl mx-auto px-2">
        {/* Sporty Badge */}
        <div className="mb-4 inline-flex items-center">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-primary shadow-xs"
          >
            <Activity className="mr-1.5 h-3.5 w-3.5 text-primary animate-pulse" />
            Sistem Penilaian PJOK SD Kelas 1–6
          </Badge>
        </div>

        {/* Headline: Bold Condensed Sporty Style */}
        <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[0.95] text-foreground">
          Kelola Nilai Fisik &amp; Kebugaran Siswa Secara{" "}
          <span className="text-primary italic drop-shadow-sm">Presisi</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 max-w-2xl text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-normal">
          Platform digital terintegrasi untuk guru Pendidikan Jasmani, Olahraga,
          dan Kesehatan: input nilai kilat, kalkulasi otomatis 4 komponen bobot,
          ekspor rapor Excel/PDF, serta naik kelas massal.
        </p>

        {/* Action Buttons: Masuk/Kelola Nilai & Install App */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          {isAuthenticated ? (
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto font-heading font-extrabold uppercase tracking-wider text-base h-12 px-8 shadow-md shadow-primary/30 group"
            >
              <Link href="/dashboard">
                <ClipboardList className="mr-2 h-5 w-5" />
                Kelola Nilai
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto font-heading font-extrabold uppercase tracking-wider text-base h-12 px-8 shadow-md shadow-primary/30 group"
            >
              <Link href="/masuk">
                Masuk
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          )}

          {/* Tombol Install App (Hanya tampil bila didukung & belum terpasang) */}
          <InstallAppButton
            size="lg"
            variant="outline"
            className="w-full sm:w-auto font-heading font-bold uppercase tracking-wider text-base h-12 px-6 border-border/80 hover:border-primary/50"
          />
        </div>

        {/* Feature Highlights Pills */}
        <div className="mt-8 hidden sm:flex items-center justify-center gap-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Bobot &amp; KKM Fleksibel</span>
          </div>
          <span className="text-border">•</span>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span>Kelas 1–6 Terpadu</span>
          </div>
          <span className="text-border">•</span>
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-primary" />
            <span>Ekspor Excel &amp; PDF Instan</span>
          </div>
        </div>
      </section>

      {/* Footer minimalis */}
      <footer className="w-full text-center text-xs text-muted-foreground py-2">
        <p className="tracking-wide">
          &copy; {new Date().getFullYear()} LMS Guru PJOK. Siap digunakan dalam
          keadaan online maupun offline (PWA).
        </p>
      </footer>
    </main>
  )
}
