import type { DataEksporKelas } from "@/lib/ekspor/format-ekspor"

export interface OpsiGeneratorEkspor {
  namaSekolah?: string | null
  namaPeriode: string
  kkm: number
  daftarKelas: ReadonlyArray<DataEksporKelas>
}

/**
 * Menghasilkan buffer file Excel (.xlsx) dengan `exceljs` yang dimuat secara dynamic import.
 * Mendukung satu kelas (1 sheet) maupun semua kelas (1 sheet per kelas),
 * NISN berformat teks, sel kosong tetap kosong, serta baris ringkasan rata-rata & ketuntasan.
 */
export async function buatBufferExcelNilai(
  opsi: OpsiGeneratorEkspor,
): Promise<ArrayBuffer> {
  const ExcelJSImport = await import("exceljs")
  const ExcelJS = ExcelJSImport.default ?? ExcelJSImport

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "LMS Guru PJOK"
  workbook.created = new Date()

  for (const dataKelas of opsi.daftarKelas) {
    const sheet = workbook.addWorksheet(dataKelas.namaSheet, {
      views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.columns = [
      { key: "no", width: 6 },
      { key: "nama", width: 28 },
      { key: "nisn", width: 16 },
      { key: "kelas", width: 10 },
      { key: "nilai_praktek", width: 14 },
      { key: "nilai_uh", width: 14 },
      { key: "nilai_asts", width: 14 },
      { key: "nilai_asas", width: 14 },
      { key: "nilai_akhir", width: 15 },
      { key: "predikat", width: 16 },
      { key: "keterangan", width: 36 },
    ]

    // Baris 1: Judul Rekap & Nama Sekolah
    const judulSekolah = opsi.namaSekolah?.trim()
      ? `REKAP NILAI PJOK — ${opsi.namaSekolah.trim().toUpperCase()}`
      : "REKAP NILAI PJOK SEKOLAH DASAR"
    const titleRow = sheet.addRow([judulSekolah])
    titleRow.font = { bold: true, size: 13 }
    sheet.mergeCells("A1:K1")

    // Baris 2: Subjudul Kelas, Periode, & KKM
    const subRow = sheet.addRow([
      `Kelas: Kelas ${dataKelas.kelas}   |   Periode: ${opsi.namaPeriode}   |   KKM: ${opsi.kkm}`,
    ])
    subRow.font = { italic: true, size: 10 }
    sheet.mergeCells("A2:K2")

    // Baris 3: Spasi kosong
    sheet.addRow([])

    // Baris 4: Header Tabel
    const headerRow = sheet.addRow([
      "No",
      "Nama",
      "NISN",
      "Kelas",
      "Praktek",
      "UH",
      "ASTS",
      "ASAS",
      "Nilai Akhir",
      "Predikat",
      "Keterangan",
    ])
    headerRow.font = { bold: true, size: 10 }
    headerRow.alignment = { vertical: "middle", horizontal: "center" }
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E8F0" },
      }
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      }
    })

    // Baris Data Siswa
    for (const b of dataKelas.baris) {
      const row = sheet.addRow([
        b.no,
        b.nama,
        String(b.nisn),
        b.kelas,
        b.nilai_praktek ?? "",
        b.nilai_uh ?? "",
        b.nilai_asts ?? "",
        b.nilai_asas ?? "",
        b.nilai_akhir ?? "",
        b.predikat ?? "",
        b.keterangan || "",
      ])

      // Pastikan NISN disimpan sebagai teks agar nol di depan tidak hilang
      const nisnCell = row.getCell(3)
      nisnCell.value = String(b.nisn)
      nisnCell.numFmt = "@"
      nisnCell.alignment = { horizontal: "center" }

      row.getCell(1).alignment = { horizontal: "center" }
      row.getCell(4).alignment = { horizontal: "center" }

      for (const colIdx of [5, 6, 7, 8, 9]) {
        const scoreCell = row.getCell(colIdx)
        scoreCell.alignment = { horizontal: "center" }
        if (typeof scoreCell.value === "number") {
          scoreCell.numFmt = "0.##"
        }
      }

      row.getCell(10).alignment = { horizontal: "center" }

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= 11) {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          }
        }
      })
    }

    // Baris Ringkasan: Rata-rata
    const { ringkasan } = dataKelas
    const avgRow = sheet.addRow([
      "",
      "Rata-rata Kelas",
      "",
      "",
      ringkasan.rata_praktek ?? "",
      ringkasan.rata_uh ?? "",
      ringkasan.rata_asts ?? "",
      ringkasan.rata_asas ?? "",
      ringkasan.rata_nilai_akhir ?? "",
      "",
      "",
    ])
    avgRow.font = { bold: true }
    for (const colIdx of [5, 6, 7, 8, 9]) {
      const cell = avgRow.getCell(colIdx)
      cell.alignment = { horizontal: "center" }
      if (typeof cell.value === "number") {
        cell.numFmt = "0.00"
      }
    }

    // Baris Ringkasan: Jumlah Tuntas & Belum Tuntas
    const tuntasRow = sheet.addRow([
      "",
      "Ringkasan Ketuntasan",
      `Tuntas: ${ringkasan.jumlah_tuntas} siswa`,
      "",
      `Belum Tuntas: ${ringkasan.jumlah_belum_tuntas} siswa`,
      "",
      `Belum Lengkap: ${ringkasan.jumlah_belum_lengkap} siswa`,
      "",
      "",
      "",
      "",
    ])
    tuntasRow.font = { bold: true }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as ArrayBuffer
}
