"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { Period } from "@/lib/supabase/types"
import { bandingkanPeriode } from "@/lib/hitung/periode"
import { usePeriodStore } from "@/stores/period-store"

export const PERIODS_QUERY_KEY = ["periode"] as const

export function usePeriods(initialData?: Period[]) {
  return useQuery<Period[]>({
    queryKey: PERIODS_QUERY_KEY,
    initialData,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("periods")
        .select("*")
        .order("tahun_mulai", { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return [...(data ?? [])].sort(bandingkanPeriode)
    },
  })
}

export function useActivePeriod(initialData?: Period[]) {
  const query = usePeriods(initialData)
  const selectedPeriodId = usePeriodStore((s) => s.selectedPeriodId)
  const setSelectedPeriodId = usePeriodStore((s) => s.setSelectedPeriodId)
  const hydrateFromCookie = usePeriodStore((s) => s.hydrateFromCookie)

  React.useEffect(() => {
    hydrateFromCookie()
  }, [hydrateFromCookie])

  const periods = React.useMemo(() => query.data ?? [], [query.data])

  const activePeriod = React.useMemo(
    () => periods.find((p) => p.is_active) ?? periods[0] ?? null,
    [periods],
  )

  const selectedPeriod = React.useMemo(() => {
    if (selectedPeriodId) {
      const found = periods.find((p) => p.id === selectedPeriodId)
      if (found) return found
    }
    return activePeriod
  }, [periods, selectedPeriodId, activePeriod])

  return {
    ...query,
    periods,
    activePeriod,
    selectedPeriod,
    selectedPeriodId: selectedPeriod?.id ?? null,
    setSelectedPeriodId,
  }
}
