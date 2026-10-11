import type { Metadata } from "next"
import { Barlow_Condensed, Inter } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const fontHeading = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-heading",
  display: "swap",
})

export const metadata: Metadata = {
  title: "LMS Guru PJOK",
  description: "Aplikasi pengelolaan nilai dan siswa PJOK Kelas 1–6",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontHeading.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
