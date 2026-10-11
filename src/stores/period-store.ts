import { create } from "zustand"

export const SELECTED_PERIOD_COOKIE = "selected_period_id"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function readPeriodCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${SELECTED_PERIOD_COOKIE}=`))
  if (!match) return null
  const val = match.split("=")[1]?.trim()
  return val ? decodeURIComponent(val) : null
}

function writePeriodCookie(periodId: string | null) {
  if (typeof document === "undefined") return
  if (periodId) {
    document.cookie = `${SELECTED_PERIOD_COOKIE}=${encodeURIComponent(periodId)}; path=/; max-age=${COOKIE_MAX_AGE}`
  } else {
    document.cookie = `${SELECTED_PERIOD_COOKIE}=; path=/; max-age=0`
  }
}

export interface PeriodStoreState {
  selectedPeriodId: string | null
  setSelectedPeriodId: (id: string | null) => void
  hydrateFromCookie: () => void
}

export const usePeriodStore = create<PeriodStoreState>((set) => ({
  selectedPeriodId: null,
  setSelectedPeriodId: (id) => {
    writePeriodCookie(id)
    set({ selectedPeriodId: id })
  },
  hydrateFromCookie: () => {
    const cookieVal = readPeriodCookie()
    if (cookieVal) {
      set({ selectedPeriodId: cookieVal })
    }
  },
}))
