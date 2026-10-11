"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Period, Settings } from "@/lib/supabase/types"
import {
  namaPeriode,
  periodeBerikutnyaDariDaftar,
} from "@/lib/hitung/periode"
import {
  appearanceSettingsSchema,
  changePasswordSchema,
  periodeSchema,
  weightSettingsSchema,
} from "@/lib/validators/pengaturan"

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

export async function tambahPeriodeAction(
  rawInput: unknown,
): Promise<ActionResult<Period>> {
  const parsed = periodeSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data periode tidak valid",
    }
  }

  const supabase = await createClient()
  const { tahun_mulai, semester } = parsed.data
  const nama = namaPeriode(tahun_mulai, semester)

  const { count } = await supabase
    .from("periods")
    .select("id", { count: "exact", head: true })

  const isFirstPeriod = (count ?? 0) === 0

  const { data, error } = await supabase
    .from("periods")
    .insert({
      tahun_mulai,
      semester,
      nama,
      is_active: isFirstPeriod,
    })
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "Periode untuk tahun ajaran dan semester tersebut sudah ada",
      }
    }
    return {
      success: false,
      error: "Gagal menambahkan periode baru",
    }
  }

  revalidatePath("/dashboard", "layout")
  return { success: true, data }
}

export async function ubahPeriodeAction(
  id: string,
  rawInput: unknown,
): Promise<ActionResult<Period>> {
  if (!id) {
    return { success: false, error: "ID periode wajib diisi" }
  }

  const parsed = periodeSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data periode tidak valid",
    }
  }

  const supabase = await createClient()
  const { tahun_mulai, semester } = parsed.data
  const nama = namaPeriode(tahun_mulai, semester)

  const { data, error } = await supabase
    .from("periods")
    .update({
      tahun_mulai,
      semester,
      nama,
    })
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "Periode untuk tahun ajaran dan semester tersebut sudah ada",
      }
    }
    return {
      success: false,
      error: "Gagal memperbarui periode",
    }
  }

  revalidatePath("/dashboard", "layout")
  return { success: true, data }
}

export async function hapusPeriodeAction(id: string): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "ID periode wajib diisi" }
  }

  const supabase = await createClient()

  // 1. Cek apakah periode sudah memiliki nilai di tabel grades
  const { count: gradeCount, error: gradeCheckErr } = await supabase
    .from("grades")
    .select("id", { count: "exact", head: true })
    .eq("period_id", id)

  if (gradeCheckErr) {
    return {
      success: false,
      error: "Gagal memeriksa data nilai pada periode ini",
    }
  }

  if ((gradeCount ?? 0) > 0) {
    return {
      success: false,
      error:
        "Periode tidak dapat dihapus karena sudah memiliki data nilai siswa",
    }
  }

  // 2. Cek apakah periode sedang aktif
  const { data: targetPeriod } = await supabase
    .from("periods")
    .select("id, is_active")
    .eq("id", id)
    .maybeSingle()

  if (targetPeriod?.is_active) {
    return {
      success: false,
      error:
        "Periode yang sedang aktif tidak dapat dihapus. Aktifkan periode lain terlebih dahulu",
    }
  }

  const { error } = await supabase.from("periods").delete().eq("id", id)

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        error:
          "Periode tidak dapat dihapus karena sudah memiliki data nilai siswa",
      }
    }
    return {
      success: false,
      error: "Gagal menghapus periode",
    }
  }

  revalidatePath("/dashboard", "layout")
  return { success: true }
}

export async function jadikanPeriodeAktifAction(
  id: string,
): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "ID periode wajib diisi" }
  }

  const supabase = await createClient()

  const { error: rpcError } = await supabase.rpc("set_active_period", {
    p_period_id: id,
  })

  if (rpcError) {
    return {
      success: false,
      error: "Gagal mengubah periode aktif",
    }
  }

  revalidatePath("/dashboard", "layout")
  return { success: true }
}

export async function buatPeriodeBerikutnyaAction(): Promise<
  ActionResult<Period>
> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from("periods")
    .select("tahun_mulai, semester")

  if (fetchError) {
    return {
      success: false,
      error: "Gagal membaca daftar periode saat ini",
    }
  }

  const daftar = existing ?? []
  const berikutnya = periodeBerikutnyaDariDaftar(daftar)

  const { data, error } = await supabase
    .from("periods")
    .insert({
      tahun_mulai: berikutnya.tahun_mulai,
      semester: berikutnya.semester,
      nama: berikutnya.nama,
      is_active: daftar.length === 0,
    })
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: `${berikutnya.nama} sudah tersedia`,
      }
    }
    return {
      success: false,
      error: "Gagal membuat periode berikutnya",
    }
  }

  revalidatePath("/dashboard", "layout")
  return { success: true, data }
}

export async function simpanPenilaianAction(
  rawInput: unknown,
): Promise<ActionResult<Settings>> {
  const parsed = weightSettingsSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "Pengaturan penilaian tidak valid",
    }
  }

  const supabase = await createClient()
  const { bobot_praktek, bobot_uh, bobot_asts, bobot_asas, kkm } = parsed.data

  const { data: existing } = await supabase
    .from("settings")
    .select("id")
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    const { data, error } = await supabase
      .from("settings")
      .update({
        bobot_praktek,
        bobot_uh,
        bobot_asts,
        bobot_asas,
        kkm,
      })
      .eq("id", existing.id)
      .select("*")
      .single()

    if (error) {
      return {
        success: false,
        error: "Gagal menyimpan pengaturan penilaian",
      }
    }

    revalidatePath("/dashboard", "layout")
    return { success: true, data }
  }

  const { data, error } = await supabase
    .from("settings")
    .insert({
      bobot_praktek,
      bobot_uh,
      bobot_asts,
      bobot_asas,
      kkm,
    })
    .select("*")
    .single()

  if (error) {
    return {
      success: false,
      error: "Gagal menyimpan pengaturan penilaian",
    }
  }

  revalidatePath("/dashboard", "layout")
  return { success: true, data }
}

export async function simpanTampilanAction(
  rawInput: unknown,
): Promise<ActionResult<Settings>> {
  const parsed = appearanceSettingsSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "Pengaturan tampilan tidak valid",
    }
  }

  const supabase = await createClient()
  const namaSekolahClean = parsed.data.nama_sekolah?.trim() || null

  const { data: existing } = await supabase
    .from("settings")
    .select("id")
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    const { data, error } = await supabase
      .from("settings")
      .update({
        nama_sekolah: namaSekolahClean,
      })
      .eq("id", existing.id)
      .select("*")
      .single()

    if (error) {
      return {
        success: false,
        error: "Gagal menyimpan nama sekolah",
      }
    }

    revalidatePath("/dashboard", "layout")
    return { success: true, data }
  }

  const { data, error } = await supabase
    .from("settings")
    .insert({
      nama_sekolah: namaSekolahClean,
    })
    .select("*")
    .single()

  if (error) {
    return {
      success: false,
      error: "Gagal menyimpan nama sekolah",
    }
  }

  revalidatePath("/dashboard", "layout")
  return { success: true, data }
}

export async function ubahKataSandiAction(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Kata sandi tidak valid",
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password_baru,
  })

  if (error) {
    return {
      success: false,
      error: "Gagal memperbarui kata sandi. Silakan coba lagi",
    }
  }

  return { success: true }
}
