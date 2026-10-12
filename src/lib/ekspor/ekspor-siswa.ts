import Papa from "papaparse"
import type { Student } from "@/lib/supabase/types"

export type FormatEksporSiswa = "xlsx" | "pdf" | "csv"

export interface BarisEksporSiswa {
  no: number
  nisn: string
  nama: string
  kelas: number
  jenis_kelamin: "L" | "P" | null
  label_jenis_kelamin: string
}

export interface RingkasanEksporSiswaKelas {
  total: number
  laki_laki: number
  perempuan: number
  belum_diisi: number
}

export interface DataEksporSiswaKelas {
  kelas: number
  namaSheet: string
  baris: BarisEksporSiswa[]
  ringkasan: RingkasanEksporSiswaKelas
}

export interface OpsiGeneratorEksporSiswa {
  namaSekolah?: string | null
  daftarKelas: ReadonlyArray<DataEksporSiswaKelas>
}

export function formatLabelJenisKelamin(jk: "L" | "P" | null | undefined): string {
  if (jk === "L") return "Laki-laki (L)"
  if (jk === "P") return "Perempuan (P)"
  return "Belum diisi"
}

export function buatNamaFileEksporSiswa(params: {
  kelas: number | "semua"
  format: FormatEksporSiswa
}): string {
  const { kelas, format } = params
  const labelKelas = kelas === "semua" ? "Semua_Kelas" : `Kelas${kelas}`
  return `Data_Siswa_PJOK_${labelKelas}.${format}`
}

export function bentukDataEksporSiswaKelas(
  kelas: number,
  students: ReadonlyArray<Pick<Student, "nisn" | "nama" | "kelas" | "jenis_kelamin">>,
): DataEksporSiswaKelas {
  const sorted = [...students].sort((a, b) =>
    a.nama.localeCompare(b.nama, "id-ID"),
  )

  let laki_laki = 0
  let perempuan = 0
  let belum_diisi = 0

  const baris: BarisEksporSiswa[] = sorted.map((s, idx) => {
    const jk = s.jenis_kelamin ?? null
    if (jk === "L") laki_laki += 1
    else if (jk === "P") perempuan += 1
    else belum_diisi += 1

    return {
      no: idx + 1,
      nisn: String(s.nisn),
      nama: s.nama,
      kelas: s.kelas,
      jenis_kelamin: jk,
      label_jenis_kelamin: formatLabelJenisKelamin(jk),
    }
  })

  return {
    kelas,
    namaSheet: `Kelas ${kelas}`,
    baris,
    ringkasan: {
      total: baris.length,
      laki_laki,
      perempuan,
      belum_diisi,
    },
  }
}

/**
 * Menghasilkan konten CSV daftar siswa (kompatibel penuh dengan format Impor CSV).
 */
export function buatCsvDataSiswa(
  daftarKelas: ReadonlyArray<DataEksporSiswaKelas>,
): string {
  const rows = daftarKelas.flatMap((dk) =>
    dk.baris.map((b) => ({
      nisn: String(b.nisn),
      nama: b.nama,
      kelas: b.kelas,
      jenis_kelamin: b.jenis_kelamin ?? "",
    })),
  )

  const csvBody = Papa.unparse(rows, {
    quotes: true,
    header: true,
    columns: ["nisn", "nama", "kelas", "jenis_kelamin"],
  })

  return `\uFEFF${csvBody}`
}

/**
 * Menghasilkan buffer file Excel (.xlsx) daftar siswa per kelas dengan `exceljs`.
 */
export async function buatBufferExcelSiswa(
  opsi: OpsiGeneratorEksporSiswa,
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
      { key: "no", width: 8 },
      { key: "nisn", width: 18 },
      { key: "nama", width: 34 },
      { key: "kelas", width: 12 },
      { key: "jenis_kelamin", width: 20 },
    ]

    const judulSekolah = opsi.namaSekolah?.trim()
      ? `DATA SISWA PJOK — ${opsi.namaSekolah.trim().toUpperCase()}`
      : "DATA SISWA PJOK SEKOLAH DASAR"
    const titleRow = sheet.addRow([judulSekolah])
    titleRow.font = { bold: true, size: 13 }
    sheet.mergeCells("A1:E1")

    const { ringkasan } = dataKelas
    const subRow = sheet.addRow([
      `Kelas: Kelas ${dataKelas.kelas}   |   Total: ${ringkasan.total} Siswa (L: ${ringkasan.laki_laki}, P: ${ringkasan.perempuan}, Belum Diisi: ${ringkasan.belum_diisi})`,
    ])
    subRow.font = { italic: true, size: 10 }
    sheet.mergeCells("A2:E2")

    sheet.addRow([])

    const headerRow = sheet.addRow([
      "No",
      "NISN",
      "Nama Siswa",
      "Kelas",
      "Jenis Kelamin",
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

    for (const b of dataKelas.baris) {
      const row = sheet.addRow([
        b.no,
        String(b.nisn),
        b.nama,
        `Kelas ${b.kelas}`,
        b.label_jenis_kelamin,
      ])

      const nisnCell = row.getCell(2)
      nisnCell.value = String(b.nisn)
      nisnCell.numFmt = "@"
      nisnCell.alignment = { horizontal: "center", vertical: "middle" }

      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" }
      row.getCell(3).alignment = { horizontal: "left", vertical: "middle" }
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" }
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" }

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= 5) {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          }
        }
      })
    }

    sheet.addRow([])
    const summaryRow = sheet.addRow([
      "",
      "Ringkasan Kelas",
      `Total: ${ringkasan.total} Siswa`,
      `L: ${ringkasan.laki_laki} | P: ${ringkasan.perempuan}`,
      `Belum Diisi: ${ringkasan.belum_diisi}`,
    ])
    summaryRow.font = { bold: true }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as ArrayBuffer
}

/**
 * Menghasilkan Blob PDF daftar siswa per kelas menggunakan `jspdf` dan `jspdf-autotable`.
 */
export async function buatBlobPdfSiswa(
  opsi: OpsiGeneratorEksporSiswa,
): Promise<Blob> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ])

  const autoTable = autoTableModule.default ?? autoTableModule

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  opsi.daftarKelas.forEach((dataKelas, index) => {
    if (index > 0) {
      doc.addPage("a4", "portrait")
    }

    const judulSekolah = opsi.namaSekolah?.trim()
      ? `DATA SISWA PJOK — ${opsi.namaSekolah.trim().toUpperCase()}`
      : "DATA SISWA PJOK SEKOLAH DASAR"

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(judulSekolah, 14, 15)

    const { ringkasan } = dataKelas
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9.5)
    doc.text(
      `Kelas: Kelas ${dataKelas.kelas}   |   Total: ${ringkasan.total} Siswa (Laki-laki: ${ringkasan.laki_laki}, Perempuan: ${ringkasan.perempuan}, Belum Diisi: ${ringkasan.belum_diisi})`,
      14,
      21,
    )

    const bodyRows: string[][] = dataKelas.baris.map((b) => [
      String(b.no),
      String(b.nisn),
      b.nama,
      `Kelas ${b.kelas}`,
      b.label_jenis_kelamin,
    ])

    const footRows: string[][] = [
      [
        "",
        "Ringkasan",
        `Total Siswa: ${ringkasan.total}`,
        `L: ${ringkasan.laki_laki} | P: ${ringkasan.perempuan}`,
        `Belum Diisi: ${ringkasan.belum_diisi}`,
      ],
    ]

    autoTable(doc, {
      startY: 26,
      showHead: "everyPage",
      showFoot: "lastPage",
      head: [["No", "NISN", "Nama Siswa", "Kelas", "Jenis Kelamin"]],
      body: bodyRows,
      foot: footRows,
      styles: {
        fontSize: 9,
        cellPadding: 2.2,
        valign: "middle",
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        1: { halign: "center", cellWidth: 32 },
        2: { halign: "left" },
        3: { halign: "center", cellWidth: 24 },
        4: { halign: "center", cellWidth: 36 },
      },
    })
  })

  return doc.output("blob")
}
