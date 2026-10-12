"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ensureAdminProfile } from "@/lib/supabase/sync-admin-profile"
import type { Student } from "@/lib/supabase/types"
import { studentSchema } from "@/lib/validators/siswa"

export interface SiswaActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

export async function tambahSiswaAction(
  rawInput: unknown,
): Promise<SiswaActionResult<Student>> {
  const parsed = studentSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data siswa tidak valid",
    }
  }

  const supabase = await createClient()
  await ensureAdminProfile(supabase)
  const { nisn, nama, kelas, jenis_kelamin } = parsed.data

  const { data, error } = await supabase
    .from("students")
    .insert({
      nisn,
      nama,
      kelas,
      jenis_kelamin: jenis_kelamin ?? null,
    })
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "NISN sudah terdaftar pada siswa lain",
      }
    }
    return {
      success: false,
      error: "Gagal menambahkan data siswa",
    }
  }

  revalidatePath("/dashboard/kelas", "layout")
  revalidatePath("/dashboard/nilai")
  revalidatePath("/dashboard")
  return { success: true, data }
}

export async function ubahSiswaAction(
  id: string,
  rawInput: unknown,
): Promise<SiswaActionResult<Student>> {
  if (!id) {
    return { success: false, error: "ID siswa wajib diisi" }
  }

  const parsed = studentSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data siswa tidak valid",
    }
  }

  const supabase = await createClient()
  await ensureAdminProfile(supabase)
  const { nisn, nama, kelas, jenis_kelamin } = parsed.data

  const { data, error } = await supabase
    .from("students")
    .update({
      nisn,
      nama,
      kelas,
      jenis_kelamin: jenis_kelamin ?? null,
    })
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "NISN sudah terdaftar pada siswa lain",
      }
    }
    return {
      success: false,
      error: "Gagal memperbarui data siswa",
    }
  }

  revalidatePath("/dashboard/kelas", "layout")
  revalidatePath("/dashboard/nilai")
  revalidatePath("/dashboard")
  return { success: true, data }
}

export async function cekNilaiSiswaAction(
  id: string,
): Promise<SiswaActionResult<{ gradesCount: number }>> {
  if (!id) {
    return { success: false, error: "ID siswa wajib diisi" }
  }

  const supabase = await createClient()
  const { count, error } = await supabase
    .from("grades")
    .select("id", { count: "exact", head: true })
    .eq("student_id", id)

  if (error) {
    return {
      success: false,
      error: "Gagal memeriksa riwayat nilai siswa",
    }
  }

  return {
    success: true,
    data: { gradesCount: count ?? 0 },
  }
}

export async function hapusSiswaAction(id: string): Promise<SiswaActionResult> {
  if (!id) {
    return { success: false, error: "ID siswa wajib diisi" }
  }

  const supabase = await createClient()
  await ensureAdminProfile(supabase)
  const { error } = await supabase.from("students").delete().eq("id", id)

  if (error) {
    return {
      success: false,
      error: "Gagal menghapus data siswa",
    }
  }

  revalidatePath("/dashboard/kelas", "layout")
  revalidatePath("/dashboard/nilai")
  revalidatePath("/dashboard")
  return { success: true }
}

export interface CsvImportSummaryResult {
  ditambah: number
  diperbarui: number
  dilewati: number
}

export async function imporSiswaCsvAction(
  rawRows: unknown,
  clientSkippedCount = 0,
): Promise<SiswaActionResult<CsvImportSummaryResult>> {
  if (!Array.isArray(rawRows)) {
    return {
      success: false,
      error: "Format data impor tidak valid",
    }
  }

  if (rawRows.length === 0) {
    return {
      success: false,
      error: "Tidak ada baris siswa yang valid untuk diimpor",
    }
  }

  if (rawRows.length > 1000) {
    return {
      success: false,
      error: "Jumlah baris melebihi batas maksimal 1.000 baris per impor",
    }
  }

  const seenNisn = new Set<string>()
  const validRows: Array<{
    nisn: string
    nama: string
    kelas: number
    jenis_kelamin: "L" | "P" | null
  }> = []
  let serverSkipped = 0

  for (const item of rawRows) {
    const parsed = studentSchema.safeParse(item)
    if (!parsed.success || seenNisn.has(parsed.data.nisn)) {
      serverSkipped += 1
      continue
    }
    seenNisn.add(parsed.data.nisn)
    validRows.push({
      nisn: parsed.data.nisn,
      nama: parsed.data.nama,
      kelas: parsed.data.kelas,
      jenis_kelamin: parsed.data.jenis_kelamin ?? null,
    })
  }

  if (validRows.length === 0) {
    return {
      success: false,
      error: "Tidak ada baris siswa yang valid setelah pemeriksaan server",
    }
  }

  const supabase = await createClient()
  await ensureAdminProfile(supabase)

  // 1. Coba jalankan melalui RPC satu transaksi `upsert_students_csv`
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "upsert_students_csv",
    {
      p_rows: validRows,
    },
  )

  if (!rpcError && rpcData) {
    const ditambah = Number(rpcData.inserted ?? 0)
    const diperbarui = Number(rpcData.updated ?? 0)
    const dilewati = clientSkippedCount + serverSkipped

    revalidatePath("/dashboard/kelas", "layout")
    revalidatePath("/dashboard/nilai")
    revalidatePath("/dashboard")
    return {
      success: true,
      data: {
        ditambah,
        diperbarui,
        dilewati,
      },
    }
  }

  // 2. Fallback: Bila fungsi RPC belum dipasang di Supabase remote (PGRST202 / 42883),
  //    gunakan batch upsert PostgREST (.upsert(validRows, { onConflict: "nisn" }))
  //    yang juga dieksekusi PostgreSQL sebagai SATU pernyataan INSERT ... ON CONFLICT atomik.
  const nisnList = validRows.map((r) => r.nisn)
  const { data: existingRows, error: checkError } = await supabase
    .from("students")
    .select("nisn")
    .in("nisn", nisnList)

  if (checkError) {
    if (checkError.code === "42501") {
      return {
        success: false,
        error:
          "Akses ditolak oleh RLS: pastikan akun Anda terdaftar sebagai admin di tabel profiles",
      }
    }
    return {
      success: false,
      error: `Gagal memeriksa data siswa di database: ${checkError.message}`,
    }
  }

  const existingSet = new Set((existingRows ?? []).map((r) => r.nisn))
  const diperbarui = validRows.filter((r) => existingSet.has(r.nisn)).length
  const ditambah = Math.max(0, validRows.length - diperbarui)
  const dilewati = clientSkippedCount + serverSkipped

  const { error: upsertError } = await supabase
    .from("students")
    .upsert(validRows, {
      onConflict: "nisn",
    })

  if (upsertError) {
    if (upsertError.code === "42501") {
      return {
        success: false,
        error:
          "Akses ditolak oleh RLS: pastikan akun Anda terdaftar sebagai admin di tabel profiles",
      }
    }
    return {
      success: false,
      error: `Gagal menyimpan data impor CSV ke database: ${upsertError.message}`,
    }
  }

  revalidatePath("/dashboard/kelas", "layout")
  revalidatePath("/dashboard/nilai")
  revalidatePath("/dashboard")

  return {
    success: true,
    data: {
      ditambah,
      diperbarui,
      dilewati,
    },
  }
}

export interface NaikKelasMassalResult {
  promoted_1_to_2: number
  promoted_2_to_3: number
  promoted_3_to_4: number
  promoted_4_to_5: number
  promoted_5_to_6: number
  graduated_kelas_6: number
  total_affected: number
  executed_at: string
}

export async function naikKelasMassalAction(
  konfirmasi: string,
): Promise<SiswaActionResult<NaikKelasMassalResult>> {
  if (konfirmasi.trim() !== "NAIK KELAS") {
    return {
      success: false,
      error: 'Ketik "NAIK KELAS" secara persis untuk mengonfirmasi kenaikan kelas massal',
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc("promote_students_massal")

  if (error || !data) {
    return {
      success: false,
      error:
        "Gagal menjalankan kenaikan kelas massal. Transaksi dibatalkan dan tidak ada data yang berubah.",
    }
  }

  revalidatePath("/dashboard/kelas", "layout")
  revalidatePath("/dashboard/nilai")
  revalidatePath("/dashboard/pengaturan")
  revalidatePath("/dashboard")

  return {
    success: true,
    data: {
      promoted_1_to_2: Number(data.promoted_1_to_2 ?? 0),
      promoted_2_to_3: Number(data.promoted_2_to_3 ?? 0),
      promoted_3_to_4: Number(data.promoted_3_to_4 ?? 0),
      promoted_4_to_5: Number(data.promoted_4_to_5 ?? 0),
      promoted_5_to_6: Number(data.promoted_5_to_6 ?? 0),
      graduated_kelas_6: Number(data.graduated_kelas_6 ?? 0),
      total_affected: Number(data.total_affected ?? 0),
      executed_at: String(data.executed_at ?? new Date().toISOString()),
    },
  }
}
