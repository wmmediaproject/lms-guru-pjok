import {
  formatNamaGuruEkspor,
  formatSelNilaiEkspor,
} from "@/lib/ekspor/format-ekspor"
import type { OpsiGeneratorEkspor } from "@/lib/ekspor/ekspor-excel"

/**
 * Menghasilkan Blob PDF rekap nilai PJOK dalam orientasi landscape
 * menggunakan `jspdf` dan `jspdf-autotable` yang dimuat secara dynamic import.
 */
export async function buatBlobPdfNilai(
  opsi: OpsiGeneratorEkspor,
): Promise<Blob> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ])

  const autoTable = autoTableModule.default ?? autoTableModule
  const namaGuru = formatNamaGuruEkspor(opsi.namaGuru)

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  opsi.daftarKelas.forEach((dataKelas, index) => {
    if (index > 0) {
      doc.addPage("a4", "landscape")
    }

    const judulSekolah = opsi.namaSekolah?.trim()
      ? `REKAP NILAI PJOK — ${opsi.namaSekolah.trim().toUpperCase()}`
      : "REKAP NILAI PJOK SEKOLAH DASAR"

    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.text(judulSekolah, 14, 15)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(
      `Kelas: Kelas ${dataKelas.kelas}   |   Periode: ${opsi.namaPeriode}   |   KKM: ${opsi.kkm}   |   Guru: ${namaGuru}`,
      14,
      21,
    )

    const bodyRows: string[][] = dataKelas.baris.map((b) => [
      String(b.no),
      b.nama,
      String(b.nisn),
      String(b.kelas),
      formatSelNilaiEkspor(b.nilai_praktek),
      formatSelNilaiEkspor(b.nilai_uh),
      formatSelNilaiEkspor(b.nilai_asts),
      formatSelNilaiEkspor(b.nilai_asas),
      formatSelNilaiEkspor(b.nilai_akhir),
      b.predikat ?? "",
      b.keterangan || "",
    ])

    const { ringkasan } = dataKelas
    const footRows: string[][] = [
      [
        "",
        "Rata-rata Kelas",
        "",
        "",
        formatSelNilaiEkspor(ringkasan.rata_praktek),
        formatSelNilaiEkspor(ringkasan.rata_uh),
        formatSelNilaiEkspor(ringkasan.rata_asts),
        formatSelNilaiEkspor(ringkasan.rata_asas),
        formatSelNilaiEkspor(ringkasan.rata_nilai_akhir),
        `Tuntas: ${ringkasan.jumlah_tuntas} | Belum Tuntas: ${ringkasan.jumlah_belum_tuntas}`,
        `Total Siswa: ${ringkasan.total_siswa}`,
      ],
    ]

    autoTable(doc, {
      startY: 26,
      showHead: "everyPage",
      showFoot: "lastPage",
      head: [
        [
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
        ],
      ],
      body: bodyRows,
      foot: footRows,
      styles: {
        fontSize: 8.5,
        cellPadding: 2,
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
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "left", cellWidth: 48 },
        2: { halign: "center", cellWidth: 26 },
        3: { halign: "center", cellWidth: 14 },
        4: { halign: "center", cellWidth: 18 },
        5: { halign: "center", cellWidth: 18 },
        6: { halign: "center", cellWidth: 18 },
        7: { halign: "center", cellWidth: 18 },
        8: { halign: "center", cellWidth: 22 },
        9: { halign: "center", cellWidth: 26 },
        10: { halign: "left" },
      },
    })
  })

  return doc.output("blob")
}
