"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Grade, Period, Settings } from "@/lib/supabase/types"
import { hitungNilaiDanPredikat } from "@/lib/hitung/nilai-akhir"
import {
  namaPeriode,
  periodeBerikutnyaDariDaftar,
} from "@/lib/hitung/periode"
import {
  appearanceSettingsSchema,
  changePasswordSchema,
  periodeSchema,
  profileSchema,
  weightSettingsSchema,
} from "@/lib/validators/pengaturan"
import { ensureAdminProfile } from "@/lib/supabase/sync-admin-profile"

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
  await ensureAdminProfile(supabase)
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
  await ensureAdminProfile(supabase)

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
  await ensureAdminProfile(supabase)

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
  await ensureAdminProfile(supabase)

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
  await ensureAdminProfile(supabase)
  const { bobot_praktek, bobot_uh, bobot_asts, bobot_asas, kkm } = parsed.data

  const { data: existing } = await supabase
    .from("settings")
    .select("*")
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

    if (!error && data) {
      revalidatePath("/dashboard", "layout")
      revalidatePath("/dashboard/nilai")
      revalidatePath("/dashboard/pengaturan")
      return { success: true, data }
    }

    // Fallback apabila trigger lama di DB remote belum memiliki klausa WHERE (pg_safeupdate SQLSTATE 21000):
    // Ganti baris singleton settings dengan DELETE + INSERT (tidak memicu AFTER UPDATE trigger lama)
    // lalu hitung ulang seluruh baris grades dengan klausa onConflict yang aman.
    if (error?.code === "21000") {
      const { error: delError } = await supabase
        .from("settings")
        .delete()
        .eq("id", existing.id)

      if (delError) {
        return {
          success: false,
          error: "Gagal menyimpan pengaturan penilaian",
        }
      }

      const { data: replacedSettings, error: insError } = await supabase
        .from("settings")
        .insert({
          id: existing.id,
          nama_sekolah: existing.nama_sekolah ?? null,
          last_promoted_at: existing.last_promoted_at ?? null,
          bobot_praktek,
          bobot_uh,
          bobot_asts,
          bobot_asas,
          kkm,
        })
        .select("*")
        .single()

      if (insError || !replacedSettings) {
        return {
          success: false,
          error: "Gagal menyimpan pengaturan penilaian",
        }
      }

      // Hitung ulang nilai_akhir & predikat seluruh baris grades menggunakan bobot & KKM baru
      const { data: allGrades } = await supabase
        .from("grades")
        .select("*")

      if (allGrades && allGrades.length > 0) {
        const bobotBaru = {
          bobot_praktek,
          bobot_uh,
          bobot_asts,
          bobot_asas,
        }
        const recomputedRows = (allGrades as Grade[]).map((g) => {
          const { nilai_akhir, predikat } = hitungNilaiDanPredikat(
            {
              nilai_praktek: g.nilai_praktek,
              nilai_uh: g.nilai_uh,
              nilai_asts: g.nilai_asts,
              nilai_asas: g.nilai_asas,
            },
            bobotBaru,
            kkm,
          )
          return {
            student_id: g.student_id,
            period_id: g.period_id,
            kelas_saat_nilai: g.kelas_saat_nilai,
            nilai_praktek: g.nilai_praktek,
            nilai_uh: g.nilai_uh,
            nilai_asts: g.nilai_asts,
            nilai_asas: g.nilai_asas,
            nilai_akhir,
            predikat,
            keterangan: g.keterangan,
          }
        })

        await supabase.from("grades").upsert(recomputedRows, {
          onConflict: "student_id,period_id",
        })
      }

      revalidatePath("/dashboard", "layout")
      revalidatePath("/dashboard/nilai")
      revalidatePath("/dashboard/pengaturan")
      return { success: true, data: replacedSettings }
    }

    if (error?.code === "23514") {
      return {
        success: false,
        error: "Total bobot keempat komponen harus tepat 100% dan KKM 0–100",
      }
    }

    return {
      success: false,
      error: "Gagal menyimpan pengaturan penilaian",
    }
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
    if (error.code === "23514") {
      return {
        success: false,
        error: "Total bobot keempat komponen harus tepat 100% dan KKM 0–100",
      }
    }
    return {
      success: false,
      error: "Gagal menyimpan pengaturan penilaian",
    }
  }

  revalidatePath("/dashboard", "layout")
  revalidatePath("/dashboard/nilai")
  revalidatePath("/dashboard/pengaturan")
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
  await ensureAdminProfile(supabase)
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

export async function ubahProfilAdminAction(
  rawInput: unknown,
): Promise<ActionResult<{ nama_lengkap: string; nip?: string; no_hp?: string }>> {
  const parsed = profileSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data profil tidak valid",
    }
  }

  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    return {
      success: false,
      error: "Gagal memverifikasi sesi admin",
    }
  }

  const metadataUpdate = {
    nama_lengkap: parsed.data.nama_lengkap,
    nip: parsed.data.nip || null,
    no_hp: parsed.data.no_hp || null,
    full_name: parsed.data.nama_lengkap,
  }

  const { error } = await supabase.auth.updateUser({
    data: metadataUpdate,
  })

  if (error) {
    return {
      success: false,
      error: "Gagal memperbarui profil admin: " + error.message,
    }
  }

  revalidatePath("/dashboard", "layout")
  return {
    success: true,
    data: {
      nama_lengkap: parsed.data.nama_lengkap,
      nip: parsed.data.nip || undefined,
      no_hp: parsed.data.no_hp || undefined,
    },
  }
}
