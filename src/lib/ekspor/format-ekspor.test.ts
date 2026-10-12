import { describe, expect, it } from "vitest"
import ExcelJS from "exceljs"
import type { StudentGradeRow } from "@/lib/hitung/nilai-siswa"
import {
  bentukDataEksporKelas,
  buatNamaFileEkspor,
  formatSelNilaiEkspor,
  sanitizeNamaPeriodeUntukFile,
} from "@/lib/ekspor/format-ekspor"
import { buatBufferExcelNilai } from "@/lib/ekspor/ekspor-excel"
import { buatBlobPdfNilai } from "@/lib/ekspor/ekspor-pdf"
import {
  bentukDataEksporSiswaKelas,
  buatBlobPdfSiswa,
  buatBufferExcelSiswa,
  buatCsvDataSiswa,
  buatNamaFileEksporSiswa,
} from "@/lib/ekspor/ekspor-siswa"

const SAMPLE_ROWS: StudentGradeRow[] = [
  {
    student_id: "s-1",
    nisn: "0012345678",
    nama: "Andi Pratama",
    kelas: 1,
    jenis_kelamin: "L",
    grade_id: "g-1",
    period_id: "p-1",
    kelas_saat_nilai: 1,
    nilai_praktek: 85,
    nilai_uh: 80,
    nilai_asts: 75,
    nilai_asas: 80,
    nilai_akhir: 80,
    predikat: "Tuntas",
    keterangan: "Sangat aktif dan sportif",
    updated_at: "2026-07-02T00:00:00Z",
  },
  {
    student_id: "s-2",
    nisn: "0012345679",
    nama: "Bunga Citra",
    kelas: 1,
    jenis_kelamin: "P",
    grade_id: "g-2",
    period_id: "p-1",
    kelas_saat_nilai: 1,
    nilai_praktek: 70,
    nilai_uh: 65,
    nilai_asts: 70,
    nilai_asas: 75,
    nilai_akhir: 70,
    predikat: "Belum Tuntas",
    keterangan: "Perlu latihan daya tahan",
    updated_at: "2026-07-02T00:00:00Z",
  },
  {
    student_id: "s-3",
    nisn: "0012345680",
    nama: "Cahyo Nugroho",
    kelas: 1,
    jenis_kelamin: "L",
    grade_id: null,
    period_id: "p-1",
    kelas_saat_nilai: 1,
    nilai_praktek: 90,
    nilai_uh: null,
    nilai_asts: null,
    nilai_asas: null,
    nilai_akhir: null,
    predikat: null,
    keterangan: null,
    updated_at: null,
  },
]

describe("Fase 7A — Pembentuk Nama File & Data Ekspor Nilai", () => {
  it("sanitizeNamaPeriodeUntukFile dan buatNamaFileEkspor mengikuti pola Nilai_PJOK_Kelas{N}_{Periode}.xlsx/.pdf", () => {
    expect(sanitizeNamaPeriodeUntukFile("Semester Ganjil 2026-2027")).toBe(
      "Ganjil_2026-2027",
    )
    expect(
      buatNamaFileEkspor({
        kelas: 1,
        namaPeriode: "Semester Ganjil 2026-2027",
        format: "xlsx",
      }),
    ).toBe("Nilai_PJOK_Kelas1_Ganjil_2026-2027.xlsx")

    expect(
      buatNamaFileEkspor({
        kelas: 4,
        namaPeriode: "Semester Genap 2026-2027",
        format: "pdf",
      }),
    ).toBe("Nilai_PJOK_Kelas4_Genap_2026-2027.pdf")

    expect(
      buatNamaFileEkspor({
        kelas: "semua",
        namaPeriode: "Semester Ganjil 2026-2027",
        format: "xlsx",
      }),
    ).toBe("Nilai_PJOK_KelasSemua_Ganjil_2026-2027.xlsx")
  })

  it("bentukDataEksporKelas mempertahankan sel kosong sebagai null (bukan 0), NISN string, dan menghitung ringkasan dengan benar", () => {
    const hasil = bentukDataEksporKelas(1, SAMPLE_ROWS)

    expect(hasil.namaSheet).toBe("Kelas 1")
    expect(hasil.baris).toHaveLength(3)

    // Siswa ke-3 belum lengkap: UH/ASTS/ASAS/Nilai Akhir tetap null (bukan 0)
    expect(hasil.baris[2]).toEqual({
      no: 3,
      nama: "Cahyo Nugroho",
      nisn: "0012345680",
      kelas: 1,
      nilai_praktek: 90,
      nilai_uh: null,
      nilai_asts: null,
      nilai_asas: null,
      nilai_akhir: null,
      predikat: null,
      keterangan: "",
    })
    expect(formatSelNilaiEkspor(hasil.baris[2]!.nilai_uh)).toBe("")

    // Ringkasan rata-rata & jumlah ketuntasan
    expect(hasil.ringkasan).toEqual({
      total_siswa: 3,
      rata_praktek: 81.67, // (85 + 70 + 90) / 3 = 81.666... -> 81.67
      rata_uh: 72.5, // (80 + 65) / 2
      rata_asts: 72.5, // (75 + 70) / 2
      rata_asas: 77.5, // (80 + 75) / 2
      rata_nilai_akhir: 75, // (80 + 70) / 2
      jumlah_tuntas: 1,
      jumlah_belum_tuntas: 1,
      jumlah_belum_lengkap: 1,
    })
  })

  it("buatBufferExcelNilai menghasilkan file .xlsx dengan satu sheet per kelas, keterangan guru dari Nama Lengkap / Nama Profil, NISN teks berawalan 0, dan baris ringkasan", async () => {
    const kelas1 = bentukDataEksporKelas(1, SAMPLE_ROWS)
    const kelas2 = bentukDataEksporKelas(2, [])

    const buffer = await buatBufferExcelNilai({
      namaSekolah: "SDN 1 Nusantara",
      namaGuru: "Budi Santoso, S.Pd.",
      namaPeriode: "Semester Ganjil 2026-2027",
      kkm: 75,
      daftarKelas: [kelas1, kelas2],
    })

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)

    expect(wb.worksheets.map((w) => w.name)).toEqual(["Kelas 1", "Kelas 2"])

    const sheet1 = wb.getWorksheet("Kelas 1")!
    // Baris 2 memuat subjudul termasuk keterangan Guru
    expect(String(sheet1.getRow(2).getCell(1).value)).toContain(
      "Guru: Budi Santoso, S.Pd.",
    )

    // Baris 5 adalah siswa pertama (Andi Pratama), kolom 3 adalah NISN
    const nisnCell = sheet1.getRow(5).getCell(3)
    expect(nisnCell.value).toBe("0012345678")
    expect(nisnCell.numFmt).toBe("@")

    // Baris 7 adalah siswa ketiga (Cahyo Nugroho) yang nilai UH-nya kosong ("", bukan 0)
    const uhKosongCell = sheet1.getRow(7).getCell(6)
    expect(uhKosongCell.value).toBe("")
  })

  it("buatBlobPdfNilai menghasilkan Blob PDF landscape yang valid beserta keterangan guru", async () => {
    const kelas1 = bentukDataEksporKelas(1, SAMPLE_ROWS)

    const blob = await buatBlobPdfNilai({
      namaSekolah: "SDN 1 Nusantara",
      namaGuru: "Budi Santoso, S.Pd.",
      namaPeriode: "Semester Ganjil 2026-2027",
      kkm: 75,
      daftarKelas: [kelas1],
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(100)
    const pdfText = new TextDecoder("latin1").decode(await blob.arrayBuffer())
    expect(pdfText).toContain("Guru: Budi Santoso, S.Pd.")
  })

  it("mendukung ekspor data siswa ke Excel (.xlsx), PDF (.pdf), dan CSV (.csv) dengan NISN berawalan nol tetap utuh", async () => {
    expect(buatNamaFileEksporSiswa({ kelas: "semua", format: "xlsx" })).toBe(
      "Data_Siswa_PJOK_Semua_Kelas.xlsx",
    )
    expect(buatNamaFileEksporSiswa({ kelas: 3, format: "csv" })).toBe(
      "Data_Siswa_PJOK_Kelas3.csv",
    )

    const dataKelas1 = bentukDataEksporSiswaKelas(1, [
      { nisn: "0012345678", nama: "Andi Pratama", kelas: 1, jenis_kelamin: "L" },
      { nisn: "0012345679", nama: "Bunga Citra", kelas: 1, jenis_kelamin: "P" },
    ])

    expect(dataKelas1.ringkasan).toEqual({
      total: 2,
      laki_laki: 1,
      perempuan: 1,
      belum_diisi: 0,
    })

    const csv = buatCsvDataSiswa([dataKelas1])
    expect(csv).toContain("0012345678")
    expect(csv).toContain("Andi Pratama")

    const excelBuffer = await buatBufferExcelSiswa({
      namaSekolah: "SDN 1 Nusantara",
      daftarKelas: [dataKelas1],
    })
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(excelBuffer)
    expect(wb.getWorksheet("Kelas 1")?.getRow(5).getCell(2).value).toBe(
      "0012345678",
    )

    const pdfBlob = await buatBlobPdfSiswa({
      namaSekolah: "SDN 1 Nusantara",
      daftarKelas: [dataKelas1],
    })
    expect(pdfBlob).toBeInstanceOf(Blob)
    expect(pdfBlob.size).toBeGreaterThan(100)
  })
})
