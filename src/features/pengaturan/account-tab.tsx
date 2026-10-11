"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound, Loader2, Save, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validators/pengaturan"
import { ubahKataSandiAction } from "./actions"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export interface AccountTabProps {
  userEmail?: string | null
}

export function AccountTab({ userEmail }: AccountTabProps) {
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password_baru: "",
      konfirmasi_password: "",
    },
  })

  const onSubmit = (values: ChangePasswordInput) => {
    startTransition(async () => {
      const result = await ubahKataSandiAction(values)
      if (!result.success) {
        toast.error(result.error ?? "Gagal memperbarui kata sandi")
        return
      }
      toast.success("Kata sandi berhasil diperbarui")
      form.reset({
        password_baru: "",
        konfirmasi_password: "",
      })
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            Informasi Akun Admin
          </CardTitle>
          <CardDescription>
            Akun administrator tunggal yang sedang masuk ke aplikasi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Email Terdaftar
            </p>
            <p className="rounded-md border border-border/80 bg-muted/40 px-3 py-2 text-sm font-medium text-foreground">
              {userEmail || "admin@sekolah.sch.id"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
            Ganti Kata Sandi
          </CardTitle>
          <CardDescription>
            Perbarui kata sandi akun admin Anda (minimal 6 karakter).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="max-w-md space-y-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="password_baru"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata Sandi Baru</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Masukkan kata sandi baru"
                        autoComplete="new-password"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="konfirmasi_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi Kata Sandi Baru</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Ulangi kata sandi baru"
                        autoComplete="new-password"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
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
                <span>Simpan Kata Sandi Baru</span>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
