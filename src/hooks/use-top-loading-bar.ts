import { create } from "zustand"

interface TopLoadingBarStore {
  activeCount: number
  progress: number
  visible: boolean
  start: () => void
  done: () => void
  reset: () => void
}

let timer: NodeJS.Timeout | null = null
let fadeTimer: NodeJS.Timeout | null = null

export const useTopLoadingBar = create<TopLoadingBarStore>((set, get) => ({
  activeCount: 0,
  progress: 0,
  visible: false,

  start: () => {
    const nextCount = get().activeCount + 1
    if (fadeTimer) {
      clearTimeout(fadeTimer)
      fadeTimer = null
    }

    if (get().activeCount === 0) {
      // Mulai dari 15%
      set({ activeCount: nextCount, progress: 18, visible: true })

      if (timer) clearInterval(timer)
      timer = setInterval(() => {
        const current = get().progress
        if (current < 65) {
          set({ progress: current + Math.random() * 12 + 6 })
        } else if (current < 88) {
          set({ progress: current + Math.random() * 4 + 1.5 })
        }
      }, 250)
    } else {
      set({ activeCount: nextCount })
    }
  },

  done: () => {
    const nextCount = Math.max(0, get().activeCount - 1)
    set({ activeCount: nextCount })

    if (nextCount === 0) {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      // Penuhkan ke 100%
      set({ progress: 100 })

      if (fadeTimer) clearTimeout(fadeTimer)
      fadeTimer = setTimeout(() => {
        set({ visible: false, progress: 0 })
      }, 350)
    }
  },

  reset: () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (fadeTimer) {
      clearTimeout(fadeTimer)
      fadeTimer = null
    }
    set({ activeCount: 0, progress: 0, visible: false })
  },
}))
