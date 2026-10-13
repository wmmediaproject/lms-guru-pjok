import type { Metadata } from "next"
import { Activity, Shield } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { PageTransition } from "@/components/shared/page-transition"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Masuk — LMS Guru PJOK",
  description: "Halaman masuk khusus admin Guru PJOK",
}

export default function MasukPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <PageTransition className="flex flex-col items-center justify-center w-full max-w-sm">
        <div className="w-full space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Badge
            variant="outline"
            className="border-primary/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary"
          >
            <Activity className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Portal Guru PJOK
          </Badge>

          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-foreground">
            MASUK AKUN ADMIN
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola data siswa dan nilai PJOK Kelas 1–6 dalam satu tempat.
          </p>
        </div>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="font-heading text-xl font-bold uppercase tracking-wide flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
              Autentikasi Guru
            </CardTitle>
            <CardDescription>
              Masukkan email dan kata sandi akun admin Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        </div>
      </PageTransition>
    </main>
  )
}
