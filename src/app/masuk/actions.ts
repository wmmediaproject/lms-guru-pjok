"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureAdminProfile } from "@/lib/supabase/sync-admin-profile"
import { loginSchema } from "@/lib/validators/auth"

export type AuthActionResult = {
  success: boolean
  error?: string
}

export async function masukAction(rawInput: unknown): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(rawInput)

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      success: false,
      error: firstIssue?.message ?? "Data masuk tidak valid",
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return {
      success: false,
      error: "Email atau kata sandi salah",
    }
  }

  await ensureAdminProfile(supabase)

  redirect("/dashboard")
}

export async function keluarAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/masuk")
}
