import { test, expect } from "@playwright/test"

test.describe("Alur Utama E2E LMS Guru PJOK (Fase 10)", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("http://127.0.0.1:54329/__reset")
  })

  test("login -> impor CSV -> input nilai (Nilai Akhir & Predikat) -> ubah bobot/KKM -> ekspor -> ganti periode -> naik kelas -> logout", async ({
    page,
  }) => {
    // 1. Proteksi rute & Login
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/masuk/)

    await page.getByLabel("Email").fill("guru@sekolah.sch.id")
    await page.getByLabel("Kata Sandi").fill("password123")
    await page.getByRole("button", { name: "Masuk" }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(
      page.getByRole("heading", { name: "Dashboard", exact: true }),
    ).toBeVisible()

    // 2. Impor CSV pada halaman Kelola Kelas
    await page.goto("/dashboard/kelas")
    await expect(
      page.getByRole("heading", { name: "Kelola Kelas" }),
    ).toBeVisible()

    await page.getByRole("button", { name: /Impor CSV/i }).click()
    await expect(
      page.getByRole("heading", { name: /Impor Data Siswa via CSV/i }),
    ).toBeVisible()

    const csvContent = [
      "nisn,nama,kelas,jenis_kelamin",
      "0012345601,Andi Pratama,1,L",
      "0012345602,Bunga Citra,1,P",
    ].join("\n")

    const fileInput = page.locator("#csv-upload-input")
    await fileInput.setInputFiles({
      name: "siswa-uji.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent, "utf-8"),
    })

    await expect(page.getByText(/Pratinjau Validasi \(2 Baris\)/i)).toBeVisible()
    await expect(page.getByText("Andi Pratama")).toBeVisible()
    await expect(page.getByText("Bunga Citra")).toBeVisible()

    await page
      .getByRole("button", { name: /Simpan & Impor \(2 Siswa\)/i })
      .click()

    await expect(
      page.getByRole("heading", { name: /Ringkasan Hasil Impor CSV/i }),
    ).toBeVisible()
    await page.getByRole("button", { name: "Selesai" }).click()

    // 3. Input Nilai (Nilai Akhir & Predikat)
    await page.goto("/dashboard/nilai?kelas=1")
    await expect(page.getByText("Andi Pratama")).toBeVisible()
    await expect(page.getByText("Bunga Citra")).toBeVisible()

    const inputPraktek = page.getByLabel("Nilai Praktek Andi Pratama")
    const inputUh = page.getByLabel("Nilai UH Andi Pratama")
    const inputAsts = page.getByLabel("Nilai ASTS Andi Pratama")
    const inputAsas = page.getByLabel("Nilai ASAS Andi Pratama")

    await inputPraktek.fill("80")
    await inputUh.fill("80")
    await inputAsts.fill("70")
    await inputAsas.fill("70")

    // Dengan bobot default 25/25/25/25 & KKM 75: Nilai Akhir = 75.00, Predikat = Tuntas
    const andiRow = page.locator("tr", { hasText: "Andi Pratama" })
    await expect(andiRow).toContainText("75.00")
    await expect(andiRow).toContainText("Tuntas")

    // Tunggu penyimpanan otomatis selesai ("Tersimpan ✓")
    await expect(andiRow).toContainText("Tersimpan", {
      timeout: 10_000,
    })

    // 4. Ubah Bobot / KKM di halaman Pengaturan
    await page.goto("/dashboard/pengaturan")
    await expect(
      page.getByRole("heading", { name: "Pengaturan" }),
    ).toBeVisible()

    await page.getByRole("tab", { name: "Penilaian" }).click()
    await page.getByLabel("Bobot Nilai Praktek (%)").fill("10")
    await page.getByLabel("Bobot Nilai UH (%)").fill("10")
    await page.getByLabel("Bobot Nilai ASTS (%)").fill("40")
    await page.getByLabel("Bobot Nilai ASAS (%)").fill("40")
    await page.getByLabel("Kriteria Ketuntasan Minimal (KKM)").fill("75")

    await expect(page.getByText(/100% \(Sesuai — 100%\)/i)).toBeVisible()
    await page
      .getByRole("button", { name: /Simpan Pengaturan Penilaian/i })
      .click()

    // Kembali ke halaman Nilai Siswa & verifikasi kalkulasi ulang (80*10 + 80*10 + 70*40 + 70*40)/100 = 72.00 (Belum Tuntas)
    await page.goto("/dashboard/nilai?kelas=1")
    const andiRowUpdated = page.locator("tr", { hasText: "Andi Pratama" })
    await expect(andiRowUpdated).toContainText("72.00")
    await expect(andiRowUpdated).toContainText("Belum Tuntas")

    // 5. Ekspor Nilai ke Excel (.xlsx) dan PDF (.pdf)
    const exportBtn = page.getByRole("button", {
      name: /Ekspor rekap nilai siswa ke Excel atau PDF/i,
    })
    await exportBtn.click()
    const [excelDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("menuitem", { name: /Excel \(\.xlsx\) — Kelas 1/i }).click(),
    ])
    expect(excelDownload.suggestedFilename()).toMatch(/\.xlsx$/)

    await exportBtn.click()
    const [pdfDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("menuitem", { name: /PDF \(\.pdf\) — Kelas 1/i }).click(),
    ])
    expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/)

    // 6. Ganti Periode Semester di Header
    const periodTrigger = page
      .getByRole("combobox", {
        name: /Pilih periode semester/i,
      })
      .first()
    await periodTrigger.click()
    await page
      .getByRole("option", { name: /Semester Genap 2026-2027/i })
      .click()

    // Pada Semester Genap, Andi Pratama belum memiliki nilai ("Belum diisi")
    await expect(andiRowUpdated).toContainText("Belum diisi")

    // Kembalikan ke Semester Ganjil 2026-2027 -> nilai 72.00 tetap ada
    await periodTrigger.click()
    await page
      .getByRole("option", { name: /Semester Ganjil 2026-2027/i })
      .click()
    await expect(andiRowUpdated).toContainText("72.00")

    // 7. Naik Kelas Massal (Data Uji)
    await page.goto("/dashboard/kelas")
    await page.getByRole("button", { name: /Naik Kelas Massal/i }).click()
    await expect(
      page.getByText(/Pratinjau Pemindahan Siswa Aktif/i),
    ).toBeVisible()

    await page
      .getByLabel(/Ketik NAIK KELAS untuk konfirmasi/i)
      .fill("NAIK KELAS")
    await page
      .getByRole("button", { name: /Jalankan Naik Kelas Massal/i })
      .click()

    await expect(
      page.getByText(/Total 3 siswa berhasil diproses/i),
    ).toBeVisible()
    await page.getByRole("button", { name: "Selesai" }).click()

    // Siswa Kelas 1 (2 siswa) kini berpindah ke Kelas 2
    await page.goto("/dashboard/nilai?kelas=2")
    await expect(page.getByText("Andi Pratama")).toBeVisible()
    await expect(page.getByText("Bunga Citra")).toBeVisible()

    // 8. Logout melalui Menu Pengguna di Header
    await page.getByRole("button", { name: "Menu pengguna" }).click()
    await page.getByRole("menuitem", { name: "Keluar" }).click()
    await expect(page).toHaveURL(/\/masuk/)

    // Verifikasi proteksi rute pasca-logout
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/masuk/)
  })
})
