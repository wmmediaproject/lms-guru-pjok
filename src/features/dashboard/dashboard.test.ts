import { describe, it, expect } from "vitest"
import {
  hitungTotalSiswa,
  hitungTotalLengkap,
  hitungTotalBelum,
  hitungPersentaseLengkap,
  hitungRataRataKeseluruhan,
  kelasBelumLengkap,
  siapkanDataGrafikKomponen,
  siapkanDataGrafikJenisKelamin,
  siapkanDataGrafikKetuntasan,
} from "@/features/dashboard/hitung-dashboard"
import type { DashboardKelasRow } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------
const buatRow = (
  kelas: number,
  overrides: Partial<DashboardKelasRow> = {},
): DashboardKelasRow => ({
  kelas,
  total_aktif: 30,
  total_laki: 15,
  total_perempuan: 15,
  jumlah_lengkap: 25,
  jumlah_belum: 5,
  avg_praktek: 80,
  avg_uh: 75,
  avg_asts: 78,
  avg_asas: 82,
  avg_nilai_akhir: 78.75,
  jumlah_tuntas: 20,
  jumlah_belum_tuntas: 5,
  ...overrides,
})

const rows: DashboardKelasRow[] = [
  buatRow(1),
  buatRow(2, { jumlah_lengkap: 30, jumlah_belum: 0 }),
  buatRow(3, {
    total_aktif: 28,
    total_laki: 14,
    total_perempuan: 14,
    jumlah_lengkap: 0,
    jumlah_belum: 28,
    avg_nilai_akhir: 0,
    jumlah_tuntas: 0,
    jumlah_belum_tuntas: 0,
  }),
]

// ---------------------------------------------------------------------------
// Tes fungsi agregasi
// ---------------------------------------------------------------------------
describe("hitungTotalSiswa", () => {
  it("menjumlahkan total_aktif semua kelas", () => {
    expect(hitungTotalSiswa(rows)).toBe(30 + 30 + 28)
  })

  it("mengembalikan 0 bila rows kosong", () => {
    expect(hitungTotalSiswa([])).toBe(0)
  })
})

describe("hitungTotalLengkap", () => {
  it("menjumlahkan jumlah_lengkap semua kelas", () => {
    expect(hitungTotalLengkap(rows)).toBe(25 + 30 + 0)
  })
})

describe("hitungTotalBelum", () => {
  it("menjumlahkan jumlah_belum semua kelas", () => {
    expect(hitungTotalBelum(rows)).toBe(5 + 0 + 28)
  })
})

describe("hitungPersentaseLengkap", () => {
  it("menghitung persentase dengan benar", () => {
    // (25 + 30 + 0) / (30 + 30 + 28) = 55/88 ≈ 62.5% → dibulatkan 63
    expect(hitungPersentaseLengkap(rows)).toBe(63)
  })

  it("mengembalikan 0 bila tidak ada siswa", () => {
    expect(hitungPersentaseLengkap([])).toBe(0)
  })

  it("mengembalikan 100 bila semua lengkap", () => {
    const allComplete = [buatRow(1, { jumlah_lengkap: 30, jumlah_belum: 0 })]
    expect(hitungPersentaseLengkap(allComplete)).toBe(100)
  })
})

describe("hitungRataRataKeseluruhan", () => {
  it("menghitung rata-rata nilai akhir dari kelas yang punya data lengkap", () => {
    // kelas 1 dan 2 punya data (jumlah_lengkap > 0), kelas 3 tidak
    const result = hitungRataRataKeseluruhan(rows)
    // avg dari 78.75 dan 78.75 = 78.75
    expect(result).toBe(78.75)
  })

  it("mengembalikan null bila tidak ada kelas dengan nilai lengkap", () => {
    const emptyRows = [buatRow(1, { jumlah_lengkap: 0, avg_nilai_akhir: 0 })]
    expect(hitungRataRataKeseluruhan(emptyRows)).toBeNull()
  })

  it("mengembalikan null bila rows kosong", () => {
    expect(hitungRataRataKeseluruhan([])).toBeNull()
  })
})

describe("kelasBelumLengkap", () => {
  it("mengembalikan kelas-kelas yang masih ada siswa belum diisi", () => {
    expect(kelasBelumLengkap(rows)).toEqual([1, 3])
  })

  it("mengembalikan array kosong bila semua lengkap", () => {
    const allDone = rows.map((r) => ({ ...r, jumlah_belum: 0 }))
    expect(kelasBelumLengkap(allDone)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Tes data grafik
// ---------------------------------------------------------------------------
describe("siapkanDataGrafikKomponen", () => {
  it("menghasilkan label 'Kelas N' dan nilai komponen rounded 1 desimal", () => {
    const data = siapkanDataGrafikKomponen([buatRow(1)])
    expect(data[0].kelas).toBe("Kelas 1")
    expect(data[0].Praktek).toBe(80)
    expect(data[0].UH).toBe(75)
    expect(data[0].ASTS).toBe(78)
    expect(data[0].ASAS).toBe(82)
  })

  it("mengisi 0 untuk kelas yang belum ada nilai (jumlah_lengkap === 0)", () => {
    const kelasKosong = buatRow(3, {
      jumlah_lengkap: 0,
      avg_praktek: 50,
      avg_uh: 60,
      avg_asts: 55,
      avg_asas: 45,
    })
    const data = siapkanDataGrafikKomponen([kelasKosong])
    expect(data[0].Praktek).toBe(0)
    expect(data[0].UH).toBe(0)
  })
})

describe("siapkanDataGrafikJenisKelamin", () => {
  it("menjumlahkan total laki dan perempuan semua kelas", () => {
    const data = siapkanDataGrafikJenisKelamin(rows)
    const laki = data.find((d) => d.name === "Laki-laki")
    const perempuan = data.find((d) => d.name === "Perempuan")
    expect(laki?.value).toBe(15 + 15 + 14)
    expect(perempuan?.value).toBe(15 + 15 + 14)
  })

  it("mengembalikan 0,0 bila rows kosong", () => {
    const data = siapkanDataGrafikJenisKelamin([])
    expect(data[0].value).toBe(0)
    expect(data[1].value).toBe(0)
  })
})

describe("siapkanDataGrafikKetuntasan", () => {
  it("mengembalikan Tuntas dan Belum Tuntas per kelas", () => {
    const data = siapkanDataGrafikKetuntasan([buatRow(1)])
    expect(data[0].kelas).toBe("Kelas 1")
    expect(data[0].Tuntas).toBe(20)
    expect(data[0]["Belum Tuntas"]).toBe(5)
  })
})
