import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ensureAdminProfile } from "@/lib/supabase/sync-admin-profile"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { InstallAppButton } from "@/components/shared/install-app-button"
import { PageTransition } from "@/components/shared/page-transition"
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
    <main className="relative isolate flex h-dvh w-full flex-col justify-between overflow-hidden bg-background p-4 sm:p-6 lg:p-8 select-none">
      {/* Background Sporty Clean & Minimalist */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        {/* Ambient Soft Glow Orbs */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-[520px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-28 right-[-5%] h-72 w-72 rounded-full bg-primary/15 blur-3xl" />

        {/* Subtle Sporty Grid Line Pattern with Radial Mask */}
        <div className="hero-grid-pattern absolute inset-0 opacity-60" />

        {/* Minimalist Geometric Silhouettes di Sudut Luar */}
        <div className="hidden sm:block absolute top-16 right-10 lg:right-20 h-28 w-28 lg:h-36 lg:w-36 rounded-2xl border border-primary/20 bg-primary/[0.02]" />
        <div className="hidden sm:block absolute bottom-16 left-10 lg:left-20 h-28 w-28 lg:h-36 lg:w-36 rounded-2xl border border-foreground/15 dark:border-foreground/20 bg-primary/[0.01]" />
      </div>

      {/* Header Bar */}
      <header className="relative z-10 flex w-full items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <span className="font-heading text-lg sm:text-2xl font-black uppercase tracking-wider text-foreground">
              LMS GURU PJOK
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Center Hero Section */}
      <PageTransition className="my-auto flex flex-col items-center justify-center">
        <section className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto px-1 sm:px-2">
          {/* Sporty Badge */}
          <div className="mb-3 sm:mb-4 inline-flex items-center">
            <Badge
              variant="outline"
              className="border-primary/40 bg-background/70 backdrop-blur-xs px-3 sm:px-3.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-primary shadow-xs"
            >
              <Activity className="mr-1.5 h-3.5 w-3.5 text-primary animate-pulse" />
              Sistem Penilaian PJOK SD Kelas 1–6
            </Badge>
          </div>

          {/* Headline: Bold Condensed Sporty Style */}
          <h1 className="font-heading text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[0.96] sm:leading-[0.95] text-foreground">
            Kelola Nilai Fisik &amp; Kebugaran Siswa Secara{" "}
            <span className="text-primary italic drop-shadow-sm">Presisi</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-3 sm:mt-4 max-w-2xl text-xs sm:text-base md:text-lg text-muted-foreground leading-relaxed font-normal px-2 sm:px-0">
            Platform digital terintegrasi untuk guru Pendidikan Jasmani, Olahraga,
            dan Kesehatan: input nilai kilat, kalkulasi otomatis 4 komponen bobot,
            ekspor rapor Excel/PDF, serta naik kelas massal.
          </p>

          {/* Action Buttons: Masuk/Kelola Nilai & Install App */}
          <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
            {isAuthenticated ? (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto font-heading font-extrabold uppercase tracking-wider text-sm sm:text-base h-11 sm:h-12 px-6 sm:px-8 shadow-md shadow-primary/30 group"
              >
                <Link href="/dashboard">
                  <ClipboardList className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Kelola Nilai
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto font-heading font-extrabold uppercase tracking-wider text-sm sm:text-base h-11 sm:h-12 px-6 sm:px-8 shadow-md shadow-primary/30 group"
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
              className="w-full sm:w-auto font-heading font-bold uppercase tracking-wider text-sm sm:text-base h-11 sm:h-12 px-5 sm:px-6 bg-background/70 backdrop-blur-xs border-border/80 hover:border-primary/50"
            />
          </div>

          {/* Feature Highlights Pills (Responsive on all devices) */}
          <div className="mt-5 sm:mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-6 text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 backdrop-blur-xs px-2.5 py-1 sm:border-0 sm:bg-transparent sm:p-0">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span>Bobot &amp; KKM Fleksibel</span>
            </div>
            <span className="hidden sm:inline text-border">•</span>
            <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 backdrop-blur-xs px-2.5 py-1 sm:border-0 sm:bg-transparent sm:p-0">
              <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span>Kelas 1–6 Terpadu</span>
            </div>
            <span className="hidden sm:inline text-border">•</span>
            <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 backdrop-blur-xs px-2.5 py-1 sm:border-0 sm:bg-transparent sm:p-0">
              <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span>Ekspor Excel &amp; PDF Instan</span>
            </div>
          </div>
        </section>
      </PageTransition>

      {/* Footer minimalis */}
      <footer className="relative z-10 w-full text-center text-[11px] sm:text-xs text-muted-foreground py-1 sm:py-2">
        <p className="tracking-wide">
          &copy; {new Date().getFullYear()} LMS Guru PJOK. Siap digunakan dalam
          keadaan online maupun offline (PWA).
        </p>
      </footer>
    </main>
  )
}
