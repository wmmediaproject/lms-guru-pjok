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

const roundTwoDecimals = (val: number) =>
  Math.round((val + Number.EPSILON) * 100) / 100

const bobotField = (label: string) =>
  z
    .number({
      error: `${label} harus berupa angka`,
    })
    .min(0, `${label} minimal 0%`)
    .max(100, `${label} maksimal 100%`)
    .transform(roundTwoDecimals)

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
      .max(100, "KKM maksimal 100")
      .transform(roundTwoDecimals),
  })
  .refine(
    (data) => {
      const total = roundTwoDecimals(
        data.bobot_praktek +
          data.bobot_uh +
          data.bobot_asts +
          data.bobot_asas,
      )
      return total === 100
    },
    {
      message: "Total bobot keempat komponen harus tepat 100%",
      path: ["bobot_asas"],
    },
  )

export type WeightSettingsInput = z.input<typeof weightSettingsSchema>
export type WeightSettingsValidated = z.output<typeof weightSettingsSchema>

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

export const profileSchema = z.object({
  nama_lengkap: z
    .string()
    .trim()
    .min(1, "Nama lengkap tidak boleh kosong")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  nip: z
    .string()
    .trim()
    .max(30, "NIP maksimal 30 karakter")
    .optional()
    .or(z.literal("")),
  no_hp: z
    .string()
    .trim()
    .max(20, "Nomor WhatsApp/HP maksimal 20 karakter")
    .optional()
    .or(z.literal("")),
})

export type ProfileInput = z.infer<typeof profileSchema>

