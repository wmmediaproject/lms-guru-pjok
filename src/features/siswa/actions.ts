"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
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
  const { error } = await supabase.from("students").delete().eq("id", id)

  if (error) {
    return {
      success: false,
      error: "Gagal menghapus data siswa",
    }
  }

  revalidatePath("/dashboard/kelas", "layout")
  return { success: true }
}
