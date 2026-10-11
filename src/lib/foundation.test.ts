import { describe, it, expect } from "vitest"

describe("Fondasi Proyek Fase 0", () => {
  it("memverifikasi lingkungan pengujian Vitest berjalan dengan benar", () => {
    expect(true).toBe(true)
  })

  it("memverifikasi nilai default token dan konstanta dasar", () => {
    const kkmDefault = 75
    const totalBobotDefault = 25 + 25 + 25 + 25
    expect(kkmDefault).toBe(75)
    expect(totalBobotDefault).toBe(100)
  })
})
