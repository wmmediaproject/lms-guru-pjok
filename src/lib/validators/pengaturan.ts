import { z } from "zod"

export const periodeSchema = z.object({
  tahun_mulai: z
    .number({
      error: "Tahun mulai harus berupa angka",
    })
    .int("Tahun mulai harus bilangan bulat")
    .min(2020, "Tahun mulai minimal 2020")
    .max(2100, "Tahun mulai maksimal 2100"),
  semester: z.enum(["ganjil", "genap"], {
    error: "Semester harus dipilih (Ganjil atau Genap)",
  }),
})

export type PeriodeInput = z.infer<typeof periodeSchema>

const bobotField = (label: string) =>
  z
    .number({
      error: `${label} harus berupa angka`,
    })
    .min(0, `${label} minimal 0%`)
    .max(100, `${label} maksimal 100%`)

export const weightSettingsSchema = z
  .object({
    bobot_praktek: bobotField("Bobot Praktek"),
    bobot_uh: bobotField("Bobot UH"),
    bobot_asts: bobotField("Bobot ASTS"),
    bobot_asas: bobotField("Bobot ASAS"),
    kkm: z
      .number({
        error: "KKM harus berupa angka",
      })
      .min(0, "KKM minimal 0")
      .max(100, "KKM maksimal 100"),
  })
  .refine(
    (data) => {
      const total =
        Math.round(
          (data.bobot_praktek +
            data.bobot_uh +
            data.bobot_asts +
            data.bobot_asas) *
            100,
        ) / 100
      return total === 100
    },
    {
      message: "Total bobot keempat komponen harus tepat 100%",
      path: ["bobot_asas"],
    },
  )

export type WeightSettingsInput = z.infer<typeof weightSettingsSchema>

export const appearanceSettingsSchema = z.object({
  nama_sekolah: z
    .string()
    .trim()
    .max(120, "Nama sekolah maksimal 120 karakter")
    .nullable()
    .optional(),
})

export type AppearanceSettingsInput = z.infer<typeof appearanceSettingsSchema>

export const changePasswordSchema = z
  .object({
    password_baru: z
      .string()
      .min(1, "Kata sandi baru wajib diisi")
      .min(6, "Kata sandi baru minimal 6 karakter"),
    konfirmasi_password: z
      .string()
      .min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.password_baru === data.konfirmasi_password, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["konfirmasi_password"],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
