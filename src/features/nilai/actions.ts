"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ensureAdminProfile } from "@/lib/supabase/sync-admin-profile"
import type { Grade } from "@/lib/supabase/types"
import { upsertGradeSchema } from "@/lib/validators/nilai"

export interface NilaiActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Menyimpan nilai siswa secara idempoten dengan upsert (student_id, period_id) + kelas_saat_nilai.
 * Trigger DB `grades_compute_before_write` secara otomatis menghitung `nilai_akhir` dan `predikat`
 * berdasarkan pengaturan bobot & KKM saat ini.
 */
export async function simpanNilaiSiswaAction(
  rawInput: unknown,
): Promise<NilaiActionResult<Grade>> {
  const parsed = upsertGradeSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data nilai siswa tidak valid",
    }
  }

  const supabase = await createClient()
  await ensureAdminProfile(supabase)
  const {
    student_id,
    period_id,
    kelas_saat_nilai,
    nilai_praktek,
    nilai_uh,
    nilai_asts,
    nilai_asas,
    keterangan,
  } = parsed.data

  const { data, error } = await supabase
    .from("grades")
    .upsert(
      {
        student_id,
        period_id,
        kelas_saat_nilai,
        nilai_praktek,
        nilai_uh,
        nilai_asts,
        nilai_asas,
        keterangan: keterangan ?? null,
      },
      {
        onConflict: "student_id,period_id",
      },
    )
    .select("*")
    .single()

  if (error || !data) {
    if (error?.code === "23514") {
      return {
        success: false,
        error: "Nilai harus berada dalam rentang 0 sampai 100",
      }
    }
    return {
      success: false,
      error: "Gagal menyimpan nilai siswa. Silakan coba lagi.",
    }
  }

  revalidatePath("/dashboard/nilai")
  revalidatePath("/dashboard")

  return {
    success: true,
    data,
  }
}
