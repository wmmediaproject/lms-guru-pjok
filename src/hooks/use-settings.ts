"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { Settings } from "@/lib/supabase/types"
import { DEFAULT_BOBOT, DEFAULT_KKM } from "@/lib/hitung/nilai-akhir"

export const SETTINGS_QUERY_KEY = ["pengaturan"] as const

export const FALLBACK_SETTINGS: Settings = {
  id: "default-settings",
  nama_sekolah: null,
  kkm: DEFAULT_KKM,
  bobot_praktek: DEFAULT_BOBOT.bobot_praktek,
  bobot_uh: DEFAULT_BOBOT.bobot_uh,
  bobot_asts: DEFAULT_BOBOT.bobot_asts,
  bobot_asas: DEFAULT_BOBOT.bobot_asas,
  updated_at: "",
}

export function useSettings(initialData?: Settings | null) {
  return useQuery<Settings>({
    queryKey: SETTINGS_QUERY_KEY,
    initialData: initialData ?? undefined,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }

      return data ?? FALLBACK_SETTINGS
    },
  })
}
