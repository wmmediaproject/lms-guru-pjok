import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import {
  DEFAULT_BOBOT,
  DEFAULT_KKM,
  hitungNilaiAkhir,
  hitungNilaiDanPredikat,
  tentukanPredikat,
} from "./nilai-akhir"

// Reference simulation of PostgreSQL numeric round((p1*w1 + p2*w2 + p3*w3 + p4*w4)/100.0, 2)
function sqlReferenceHitungNilaiAkhir(
  p_praktek: number | null,
  p_uh: number | null,
  p_asts: number | null,
  p_asas: number | null,
  w_praktek: number,
  w_uh: number,
  w_asts: number,
  w_asas: number,
): number | null {
  if (
    p_praktek === null ||
    p_uh === null ||
    p_asts === null ||
    p_asas === null
  ) {
    return null
  }
  const sum =
    p_praktek * w_praktek +
    p_uh * w_uh +
    p_asts * w_asts +
    p_asas * w_asas
  return Number((Math.round((sum / 100 + 1e-9) * 100) / 100).toFixed(2))
}

function sqlReferenceTentukanPredikat(
  p_nilai_akhir: number | null,
  p_kkm: number,
): "Tuntas" | "Belum Tuntas" | null {
  if (p_nilai_akhir === null) return null
  return p_nilai_akhir >= p_kkm ? "Tuntas" : "Belum Tuntas"
}

describe("Fungsi Murni Perhitungan Nilai Akhir & Predikat (src/lib/hitung/nilai-akhir.ts)", () => {
  it("mengembalikan null apabila salah satu dari 4 komponen bernilai null atau undefined", () => {
    expect(
      hitungNilaiAkhir({
        nilai_praktek: 80,
        nilai_uh: 85,
        nilai_asts: 90,
        nilai_asas: null,
      }),
    ).toBeNull()

    expect(
      hitungNilaiAkhir({
        nilai_praktek: null,
        nilai_uh: 85,
        nilai_asts: 90,
        nilai_asas: 80,
      }),
    ).toBeNull()

    expect(
      hitungNilaiAkhir({
        nilai_praktek: 80,
        nilai_uh: undefined,
        nilai_asts: 90,
        nilai_asas: 80,
      }),
    ).toBeNull()
  })

  it("membedakan nilai 0 dari kosong (0 adalah angka valid, bukan null)", () => {
    const hasil = hitungNilaiAkhir(
      {
        nilai_praktek: 0,
        nilai_uh: 80,
        nilai_asts: 80,
        nilai_asas: 80,
      },
      DEFAULT_BOBOT,
    )
    expect(hasil).toBe(60)
  })

  it("menghitung rata-rata tertimbang dengan bobot default (25/25/25/25) dan membulatkan 2 desimal", () => {
    expect(
      hitungNilaiAkhir({
        nilai_praktek: 80,
        nilai_uh: 75,
        nilai_asts: 85,
        nilai_asas: 90,
      }),
    ).toBe(82.5)

    // Pembulatan 2 desimal: (81*25 + 82*25 + 83*25 + 83*25)/100 = 82.25
    expect(
      hitungNilaiAkhir({
        nilai_praktek: 81,
        nilai_uh: 82,
        nilai_asts: 83,
        nilai_asas: 83,
      }),
    ).toBe(82.25)

    // Pembulatan desimal pecahan: (80.33*30 + 75.5*20 + 82.15*25 + 79.9*25)/100 = 79.7115 -> 79.71
    expect(
      hitungNilaiAkhir(
        {
          nilai_praktek: 80.33,
          nilai_uh: 75.5,
          nilai_asts: 82.15,
          nilai_asas: 79.9,
        },
        {
          bobot_praktek: 30,
          bobot_uh: 20,
          bobot_asts: 25,
          bobot_asas: 25,
        },
      ),
    ).toBe(79.71)
  })

  it("menentukan predikat Tuntas jika >= KKM dan Belum Tuntas jika < KKM", () => {
    expect(tentukanPredikat(null, DEFAULT_KKM)).toBeNull()
    expect(tentukanPredikat(75, 75)).toBe("Tuntas")
    expect(tentukanPredikat(75.01, 75)).toBe("Tuntas")
    expect(tentukanPredikat(74.99, 75)).toBe("Belum Tuntas")

    // Ketika KKM dinaikkan menjadi 80, nilai 78 berubah menjadi Belum Tuntas
    expect(tentukanPredikat(78, 75)).toBe("Tuntas")
    expect(tentukanPredikat(78, 80)).toBe("Belum Tuntas")
  })

  it("menghasilkan output yang 100% identik antara fungsi TS dan referensi fungsi DB SQL untuk beragam skenario", () => {
    const testCases = [
      {
        nilai: { nilai_praktek: 80, nilai_uh: 70, nilai_asts: 75, nilai_asas: 75 },
        bobot: { bobot_praktek: 25, bobot_uh: 25, bobot_asts: 25, bobot_asas: 25 },
        kkm: 75,
      },
      {
        nilai: { nilai_praktek: 85.5, nilai_uh: 72.25, nilai_asts: 68.75, nilai_asas: 90 },
        bobot: { bobot_praktek: 40, bobot_uh: 20, bobot_asts: 20, bobot_asas: 20 },
        kkm: 78,
      },
      {
        nilai: { nilai_praktek: 74.9, nilai_uh: 74.9, nilai_asts: 75.1, nilai_asas: 75.0 },
        bobot: { bobot_praktek: 25, bobot_uh: 25, bobot_asts: 25, bobot_asas: 25 },
        kkm: 75,
      },
      {
        nilai: { nilai_praktek: 90, nilai_uh: null, nilai_asts: 85, nilai_asas: 88 },
        bobot: { bobot_praktek: 25, bobot_uh: 25, bobot_asts: 25, bobot_asas: 25 },
        kkm: 75,
      },
    ]

    for (const tc of testCases) {
      const tsRes = hitungNilaiDanPredikat(tc.nilai, tc.bobot, tc.kkm)
      const dbNilaiAkhir = sqlReferenceHitungNilaiAkhir(
        tc.nilai.nilai_praktek,
        tc.nilai.nilai_uh,
        tc.nilai.nilai_asts,
        tc.nilai.nilai_asas,
        tc.bobot.bobot_praktek,
        tc.bobot.bobot_uh,
        tc.bobot.bobot_asts,
        tc.bobot.bobot_asas,
      )
      const dbPredikat = sqlReferenceTentukanPredikat(dbNilaiAkhir, tc.kkm)

      expect(tsRes.nilai_akhir).toBe(dbNilaiAkhir)
      expect(tsRes.predikat).toBe(dbPredikat)
    }
  })

  it("memverifikasi migrasi SQL 20261011000009 memiliki fungsi hitung_nilai_akhir, tentukan_predikat, trigger grades, trigger settings, dan set_active_period", () => {
    const sqlPath = path.resolve(
      import.meta.dirname,
      "../../../supabase/migrations/20261011000009_grades_calc_and_period_rpc.sql",
    )
    const sql = fs.readFileSync(sqlPath, "utf-8")

    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+public\.hitung_nilai_akhir/i)
    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+public\.tentukan_predikat/i)
    expect(sql).toMatch(/create\s+trigger\s+grades_compute_before_write/i)
    expect(sql).toMatch(/create\s+trigger\s+settings_recompute_all_grades/i)
    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+public\.set_active_period/i)
  })
})
