import { describe, it, expect } from "vitest"
import {
  bandingkanPeriode,
  namaPeriode,
  periodeBerikutnya,
  periodeBerikutnyaDariDaftar,
} from "./periode"

describe("Fungsi Murni Periode Semester (src/lib/hitung/periode.ts)", () => {
  it("namaPeriode membentuk format nama sesuai PRD §5.1", () => {
    expect(namaPeriode(2026, "ganjil")).toBe("Semester Ganjil 2026-2027")
    expect(namaPeriode(2026, "genap")).toBe("Semester Genap 2026-2027")
    expect(namaPeriode(2027, "ganjil")).toBe("Semester Ganjil 2027-2028")
  })

  it("periodeBerikutnya menghasilkan urutan Ganjil 2026-2027 -> Genap 2026-2027 -> Ganjil 2027-2028 -> Genap 2027-2028", () => {
    const p1 = { tahun_mulai: 2026, semester: "ganjil" as const }
    const p2 = periodeBerikutnya(p1)
    expect(p2).toEqual({
      tahun_mulai: 2026,
      semester: "genap",
      nama: "Semester Genap 2026-2027",
    })

    const p3 = periodeBerikutnya(p2)
    expect(p3).toEqual({
      tahun_mulai: 2027,
      semester: "ganjil",
      nama: "Semester Ganjil 2027-2028",
    })

    const p4 = periodeBerikutnya(p3)
    expect(p4).toEqual({
      tahun_mulai: 2027,
      semester: "genap",
      nama: "Semester Genap 2027-2028",
    })
  })

  it("bandingkanPeriode mengurutkan Ganjil (Jul-Des) sebelum Genap (Jan-Jun) pada tahun ajaran yang sama", () => {
    const acak = [
      { tahun_mulai: 2027, semester: "genap" as const },
      { tahun_mulai: 2026, semester: "genap" as const },
      { tahun_mulai: 2026, semester: "ganjil" as const },
      { tahun_mulai: 2027, semester: "ganjil" as const },
    ]
    const terurut = [...acak].sort(bandingkanPeriode)
    expect(terurut).toEqual([
      { tahun_mulai: 2026, semester: "ganjil" },
      { tahun_mulai: 2026, semester: "genap" },
      { tahun_mulai: 2027, semester: "ganjil" },
      { tahun_mulai: 2027, semester: "genap" },
    ])
  })

  it("periodeBerikutnyaDariDaftar menghasilkan Ganjil 2027-2028 setelah seed awal (Ganjil & Genap 2026-2027)", () => {
    const seedPeriods = [
      { tahun_mulai: 2026, semester: "ganjil" as const },
      { tahun_mulai: 2026, semester: "genap" as const },
    ]
    expect(periodeBerikutnyaDariDaftar(seedPeriods)).toEqual({
      tahun_mulai: 2027,
      semester: "ganjil",
      nama: "Semester Ganjil 2027-2028",
    })
  })

  it("periodeBerikutnyaDariDaftar mengembalikan default Ganjil 2026-2027 bila daftar kosong", () => {
    expect(periodeBerikutnyaDariDaftar([])).toEqual({
      tahun_mulai: 2026,
      semester: "ganjil",
      nama: "Semester Ganjil 2026-2027",
    })
  })
})
