import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"

/**
 * Memastikan user yang sedang terautentikasi di Supabase Auth selalu terdaftar
 * pada tabel `public.profiles` dengan `role = 'admin'`.
 *
 * Aman karena:
 * - Hanya berjalan di sisi server (Server Component / Server Action).
 * - Hanya menyinkronkan user yang sudah berhasil login di Supabase Auth (`auth.getUser()`),
 *   sehingga pengguna anonim tetap ditolak sepenuhnya oleh RLS.
 */
export async function ensureAdminProfile(
  serverSupabase?: SupabaseClient<Database>,
): Promise<boolean> {
  try {
    let userId: string | null = null

    if (serverSupabase && "auth" in serverSupabase && serverSupabase.auth?.getUser) {
      const { data: authData } = await serverSupabase.auth.getUser()
      userId = authData?.user?.id ?? null
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && serviceRoleKey) {
      const adminClient = createSupabaseAdminClient<Database>(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      )

      if (userId) {
        const { error } = await adminClient
          .from("profiles")
          .upsert({ id: userId, role: "admin" }, { onConflict: "id" })
        return !error
      }

      // Bila dipanggil untuk menyinkronkan seluruh user yang ada di Supabase Auth
      const { data: usersList, error: listErr } =
        await adminClient.auth.admin.listUsers()

      if (listErr || !usersList?.users?.length) {
        return false
      }

      const profileRows = usersList.users.map((u) => ({
        id: u.id,
        role: "admin" as const,
      }))

      const { error: upsertErr } = await adminClient
        .from("profiles")
        .upsert(profileRows, { onConflict: "id" })

      return !upsertErr
    }

    // Fallback melalui RPC SECURITY DEFINER bila SUPABASE_SERVICE_ROLE_KEY tidak disetel
    if (serverSupabase && "rpc" in serverSupabase && typeof serverSupabase.rpc === "function") {
      await serverSupabase.rpc("ensure_admin_profile")
      return true
    }

    return false
  } catch {
    return false
  }
}
