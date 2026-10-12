"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound, Loader2, Save, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordInput,
  type ProfileInput,
} from "@/lib/validators/pengaturan"
import { ubahKataSandiAction, ubahProfilAdminAction } from "./actions"
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

export interface AdminProfileData {
  nama_lengkap?: string | null
  nip?: string | null
  no_hp?: string | null
}

export interface AccountTabProps {
  userEmail?: string | null
  profile?: AdminProfileData | null
}

export function AccountTab({ userEmail, profile }: AccountTabProps) {
  const [isPendingPassword, startPasswordTransition] = React.useTransition()
  const [isPendingProfile, startProfileTransition] = React.useTransition()

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nama_lengkap: profile?.nama_lengkap || "Admin Guru PJOK",
      nip: profile?.nip || "",
      no_hp: profile?.no_hp || "",
    },
  })

  // Sync profile defaults when profile prop changes
  React.useEffect(() => {
    if (profile) {
      profileForm.reset({
        nama_lengkap: profile.nama_lengkap || "Admin Guru PJOK",
        nip: profile.nip || "",
        no_hp: profile.no_hp || "",
      })
    }
  }, [profile, profileForm])

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password_baru: "",
      konfirmasi_password: "",
    },
  })

  const onProfileSubmit = (values: ProfileInput) => {
    startProfileTransition(async () => {
      const result = await ubahProfilAdminAction(values)
      if (!result.success) {
        toast.error(result.error ?? "Gagal memperbarui profil admin")
        return
      }
      toast.success("Profil admin berhasil diperbarui")
    })
  }

  const onPasswordSubmit = (values: ChangePasswordInput) => {
    startPasswordTransition(async () => {
      const result = await ubahKataSandiAction(values)
      if (!result.success) {
        toast.error(result.error ?? "Gagal memperbarui kata sandi")
        return
      }
      toast.success("Kata sandi berhasil diperbarui")
      passwordForm.reset({
        password_baru: "",
        konfirmasi_password: "",
      })
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="border-b border-border/60 pb-3.5 sm:pb-4">
          <CardTitle className="font-heading text-base sm:text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck
              className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>Informasi &amp; Profil Admin</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm leading-relaxed">
            Perbarui data identitas profil akun administrator yang tampil di
            aplikasi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="w-full max-w-md space-y-4"
              noValidate
            >
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Email Terdaftar (Akun Login)
                </p>
                <p className="truncate rounded-md border border-border/80 bg-muted/40 px-3 py-2 text-xs sm:text-sm font-medium text-foreground">
                  {userEmail || "admin@sekolah.sch.id"}
                </p>
              </div>

              <FormField
                control={profileForm.control}
                name="nama_lengkap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">
                      Nama Lengkap / Nama Profil
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Budi Santoso, S.Pd."
                        disabled={isPendingProfile}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs leading-relaxed">
                      Nama yang tampil di bagian atas menu admin.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="nip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">
                      NIP (Opsional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: 19850101 201001 1 001"
                        disabled={isPendingProfile}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="no_hp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">
                      Nomor WhatsApp / HP (Opsional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        disabled={isPendingProfile}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isPendingProfile}
                className="h-9 w-full sm:w-auto justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
              >
                {isPendingProfile ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin shrink-0" />
                ) : (
                  <Save
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span>Simpan Profil Admin</span>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/60 pb-3.5 sm:pb-4">
          <CardTitle className="font-heading text-base sm:text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            <KeyRound
              className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>Ganti Kata Sandi</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm leading-relaxed">
            Perbarui kata sandi akun admin Anda (minimal 6 karakter).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="w-full max-w-md space-y-4"
              noValidate
            >
              <FormField
                control={passwordForm.control}
                name="password_baru"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">
                      Kata Sandi Baru
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Masukkan kata sandi baru"
                        autoComplete="new-password"
                        disabled={isPendingPassword}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="konfirmasi_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">
                      Konfirmasi Kata Sandi Baru
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Ulangi kata sandi baru"
                        autoComplete="new-password"
                        disabled={isPendingPassword}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isPendingPassword}
                className="h-9 w-full sm:w-auto justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
              >
                {isPendingPassword ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin shrink-0" />
                ) : (
                  <Save
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span>Simpan Kata Sandi Baru</span>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
