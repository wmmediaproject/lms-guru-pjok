import { describe, expect, it, vi, beforeEach } from "vitest"
import {
  MAX_CSV_ROWS,
  MAX_CSV_SIZE_BYTES,
  buatCsvBarisGagal,
  normalisasiJenisKelamin,
  normalisasiNisn,
  parseStudentCsvText,
} from "@/lib/csv/parse"

const mockRpc = vi.fn()
const mockFrom = vi.fn()

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/supabase/sync-admin-profile", () => ({
  ensureAdminProfile: vi.fn(async () => true),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc: mockRpc,
    from: mockFrom,
  })),
}))

describe("normalisasiNisn", () => {
  it("mempertahankan angka nol di depan sebagai string", () => {
    expect(normalisasiNisn("0012345678")).toBe("0012345678")
    expect(normalisasiNisn("  0098765432  ")).toBe("0098765432")
  })

  it("menghapus tanda kutip tunggal awalan ala Excel ('0012345678)", () => {
    expect(normalisasiNisn("'0012345678")).toBe("0012345678")
    expect(normalisasiNisn(" ' 0012345678 ")).toBe("0012345678")
  })

  it("mengembalikan string kosong untuk null atau undefined", () => {
    expect(normalisasiNisn(null)).toBe("")
    expect(normalisasiNisn(undefined)).toBe("")
  })
})

describe("normalisasiJenisKelamin", () => {
  it("menormalisasi variasi Laki-laki menjadi 'L'", () => {
    expect(normalisasiJenisKelamin("L")).toEqual({ valid: true, value: "L" })
    expect(normalisasiJenisKelamin("l")).toEqual({ valid: true, value: "L" })
    expect(normalisasiJenisKelamin("Laki-laki")).toEqual({
      valid: true,
      value: "L",
    })
    expect(normalisasiJenisKelamin("laki laki")).toEqual({
      valid: true,
      value: "L",
    })
    expect(normalisasiJenisKelamin("LAKILAKI")).toEqual({
      valid: true,
      value: "L",
    })
  })

  it("menormalisasi variasi Perempuan menjadi 'P'", () => {
    expect(normalisasiJenisKelamin("P")).toEqual({ valid: true, value: "P" })
    expect(normalisasiJenisKelamin("p")).toEqual({ valid: true, value: "P" })
    expect(normalisasiJenisKelamin("Perempuan")).toEqual({
      valid: true,
      value: "P",
    })
    expect(normalisasiJenisKelamin("  perempuan ")).toEqual({
      valid: true,
      value: "P",
    })
  })

  it("menormalisasi nilai kosong atau tanda strip menjadi null", () => {
    expect(normalisasiJenisKelamin("")).toEqual({ valid: true, value: null })
    expect(normalisasiJenisKelamin("   ")).toEqual({ valid: true, value: null })
    expect(normalisasiJenisKelamin("-")).toEqual({ valid: true, value: null })
    expect(normalisasiJenisKelamin(null)).toEqual({ valid: true, value: null })
    expect(normalisasiJenisKelamin(undefined)).toEqual({
      valid: true,
      value: null,
    })
  })

  it("menolak nilai jenis kelamin yang tidak dikenal", () => {
    const res = normalisasiJenisKelamin("Pria/Wanita")
    expect(res.valid).toBe(false)
    if (!res.valid) {
      expect(res.error).toContain("Jenis kelamin tidak valid")
    }
  })
})

describe("parseStudentCsvText", () => {
  it("mem-parse CSV dengan delimiter koma (,) dan mempertahankan nol di depan NISN", () => {
    const csv = [
      "nisn,nama,kelas,jenis_kelamin",
      "0012345678,Budi Santoso,1,Laki-laki",
      "0012345679,Siti Aminah,2,Perempuan",
      "0012345680,Ahmad Fauzi,6,",
    ].join("\n")

    const result = parseStudentCsvText(csv)
    expect(result.ok).toBe(true)
    expect(result.summary).toEqual({
      total: 3,
      valid: 3,
      error: 0,
      duplicate: 0,
    })
    expect(result.validRows).toEqual([
      {
        nisn: "0012345678",
        nama: "Budi Santoso",
        kelas: 1,
        jenis_kelamin: "L",
      },
      {
        nisn: "0012345679",
        nama: "Siti Aminah",
        kelas: 2,
        jenis_kelamin: "P",
      },
      {
        nisn: "0012345680",
        nama: "Ahmad Fauzi",
        kelas: 6,
        jenis_kelamin: null,
      },
    ])
  })

  it("mendukung delimiter titik koma (;), UTF-8 BOM, dan header huruf besar/kecil", () => {
    const csvWithBomAndSemicolon =
      "\uFEFFNISN;Nama;KELAS;Jenis_Kelamin\n'0055566677;Rina Wati;4;Perempuan\n0055566678;Doni Pratama;5;L"

    const result = parseStudentCsvText(csvWithBomAndSemicolon)
    expect(result.ok).toBe(true)
    expect(result.validRows).toHaveLength(2)
    expect(result.validRows[0]).toEqual({
      nisn: "0055566677",
      nama: "Rina Wati",
      kelas: 4,
      jenis_kelamin: "P",
    })
    expect(result.validRows[1]).toEqual({
      nisn: "0055566678",
      nama: "Doni Pratama",
      kelas: 5,
      jenis_kelamin: "L",
    })
  })

  it("mendeteksi duplikat NISN di dalam file CSV yang sama dan melewati baris tidak valid tanpa membatalkan baris valid", () => {
    const csv = [
      "nisn,nama,kelas,jenis_kelamin",
      "0011111111,Siswa Valid Satu,1,L",
      "0011111111,Siswa Duplikat,2,P",
      "123ABC,Siswa NISN Salah,3,L",
      "0022222222,Siswa Kelas Tujuh,7,P",
      "0033333333,Siswa Valid Dua,3,",
    ].join("\n")

    const result = parseStudentCsvText(csv)
    expect(result.ok).toBe(true)
    expect(result.summary).toEqual({
      total: 5,
      valid: 2,
      error: 2,
      duplicate: 1,
    })
    expect(result.validRows.map((r) => r.nisn)).toEqual([
      "0011111111",
      "0033333333",
    ])
    expect(result.failedRows).toHaveLength(3)
    expect(result.failedRows[0]?.status).toBe("duplicate")
    expect(result.failedRows[0]?.errors[0]).toContain("Duplikat NISN")
    expect(result.failedRows[1]?.status).toBe("error")
    expect(result.failedRows[2]?.status).toBe("error")
  })

  it("menolak file CSV yang ukurannya melebihi 2 MB", () => {
    const csv = "nisn,nama,kelas,jenis_kelamin\n001,Budi,1,L"
    const result = parseStudentCsvText(csv, MAX_CSV_SIZE_BYTES + 1)
    expect(result.ok).toBe(false)
    expect(result.fatalError).toContain("2 MB")
  })

  it("menolak file CSV dengan jumlah baris melebihi 1.000 baris", () => {
    const lines = ["nisn,nama,kelas,jenis_kelamin"]
    for (let i = 1; i <= MAX_CSV_ROWS + 1; i++) {
      const nisn = String(i).padStart(10, "0")
      lines.push(`${nisn},Siswa ${i},1,L`)
    }

    const result = parseStudentCsvText(lines.join("\n"))
    expect(result.ok).toBe(false)
    expect(result.fatalError).toContain("1000")
  })

  it("menolak file CSV apabila header kolom wajib tidak lengkap", () => {
    const csv = "nisn,nama_lengkap\n0012345678,Budi Santoso"
    const result = parseStudentCsvText(csv)
    expect(result.ok).toBe(false)
    expect(result.fatalError).toContain("Header kolom CSV tidak sesuai")
  })

  it("buatCsvBarisGagal menghasilkan CSV dengan kolom alasan_gagal", () => {
    const csv = [
      "nisn,nama,kelas,jenis_kelamin",
      "123ABC,Budi,9,TidakTahu",
    ].join("\n")

    const parsed = parseStudentCsvText(csv)
    const failedCsv = buatCsvBarisGagal(parsed.failedRows)
    expect(failedCsv).toContain('"baris","nisn","nama","kelas","jenis_kelamin","alasan_gagal"')
    expect(failedCsv).toContain("123ABC")
    expect(failedCsv).toContain("NISN hanya boleh berisi angka")
  })
})

describe("imporSiswaCsvAction (upsert satu transaksi berdasarkan NISN)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("mengimpor baris valid lewat RPC upsert_students_csv dan bersifat idempoten saat diimpor ulang", async () => {
    const { imporSiswaCsvAction } = await import("@/features/siswa/actions")

    // Impor pertama: 2 siswa baru ditambah
    mockRpc.mockResolvedValueOnce({
      data: { inserted: 2, updated: 0 },
      error: null,
    })

    const rows = [
      { nisn: "0012345678", nama: "Budi Santoso", kelas: 1, jenis_kelamin: "L" as const },
      { nisn: "0012345679", nama: "Siti Aminah", kelas: 1, jenis_kelamin: "P" as const },
    ]

    const firstRes = await imporSiswaCsvAction(rows, 1)
    expect(firstRes.success).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith("upsert_students_csv", {
      p_rows: rows,
    })
    if (firstRes.success) {
      expect(firstRes.data).toEqual({
        ditambah: 2,
        diperbarui: 0,
        dilewati: 1,
      })
    }

    // Impor kedua dengan file yang sama: 0 ditambah, 2 diperbarui (tidak gagal & tidak menggandakan baris)
    mockRpc.mockResolvedValueOnce({
      data: { inserted: 0, updated: 2 },
      error: null,
    })

    const secondRes = await imporSiswaCsvAction(rows, 1)
    expect(secondRes.success).toBe(true)
    if (secondRes.success) {
      expect(secondRes.data).toEqual({
        ditambah: 0,
        diperbarui: 2,
        dilewati: 1,
      })
    }
  })

  it("tetap berhasil menyimpan lewat fallback batch upsert atomik apabila RPC upsert_students_csv belum dipasang di database remote", async () => {
    const { imporSiswaCsvAction } = await import("@/features/siswa/actions")

    // Simulasi RPC belum ada di schema cache Supabase remote (PGRST202)
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: {
        code: "PGRST202",
        message: "Could not find the function public.upsert_students_csv",
      },
    })

    const mockUpsertBatch = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [{ nisn: "0012345678" }], // 1 sudah ada, 1 baru
          error: null,
        }),
      }),
      upsert: mockUpsertBatch,
    })

    const rows = [
      { nisn: "0012345678", nama: "Budi Santoso", kelas: 1, jenis_kelamin: "L" as const },
      { nisn: "0012345679", nama: "Siti Aminah", kelas: 1, jenis_kelamin: "P" as const },
    ]

    const res = await imporSiswaCsvAction(rows, 0)
    expect(res.success).toBe(true)
    expect(mockUpsertBatch).toHaveBeenCalledWith(rows, { onConflict: "nisn" })
    if (res.success) {
      expect(res.data).toEqual({
        ditambah: 1,
        diperbarui: 1,
        dilewati: 0,
      })
    }
  })
})
