# Roadmap Eksekusi Agent — LMS Guru PJOK

Acuan: `prd.md` (v1.0, pertanyaan terbuka sudah terjawab). Simpan `prd.md` dan `roadmap.md` di root repo.
Prinsip: **satu fase = satu sesi Claude Code = satu branch = satu PR**. Setiap fase punya prompt siap tempel, definisi selesai, dan cara verifikasi.

---

## A. Persiapan Manual (sebelum fase 0)

| # | Langkah | Catatan |
|---|---|---|
| 1 | Buat repo Git `lms-guru-pjok`, branch `main` | Branch kerja per fase: `feat/NN-nama` |
| 2 | Buat project Supabase | Simpan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| 3 | Nonaktifkan **Sign ups** di Supabase Auth, lalu buat 1 user admin manual (email + kata sandi) | Registrasi publik tidak ada |
| 4 | Hubungkan repo ke Vercel, isi env var yang sama | Preview per branch |
| 5 | Pasang Claude Code, jalankan `claude` di root repo | |
| 6 | (Opsional) Hubungkan MCP Supabase | Agar agent bisa menjalankan migrasi dan memeriksa tabel |

### A.1 `CLAUDE.md` (buat di root repo, isi persis seperti ini)

```markdown
# LMS Guru PJOK — Aturan Proyek

Sumber kebenaran: @prd.md dan @roadmap.md. Jika ada konflik, PRD menang. Jika PRD ambigu, TANYA dulu.

## Stack
Next.js 16.2.7 (App Router), React 19.2.4, TypeScript strict, Tailwind 4, shadcn/ui,
Supabase (@supabase/ssr), TanStack Query + Table, zustand, react-hook-form + zod,
recharts, sonner, next-themes. Tambahan: papaparse, exceljs, jspdf + jspdf-autotable. Deploy Vercel.

## Aturan Wajib
1. SEMUA UI memakai komponen shadcn. Komponen custom hanya komposisi primitif shadcn/Radix.
2. SEMUA teks UI Bahasa Indonesia (label, placeholder, toast, error, empty state).
3. Warna hanya lewat CSS variables/token tema. Jangan hard-code warna.
4. Tema terang/gelap, default mengikuti perangkat.
5. Proteksi rute memakai `proxy.ts` (Next.js 16), bukan `middleware.ts`.
6. Jangan pakai service_role key di kode klien. RLS aktif di semua tabel.
7. Validasi zod di klien DAN server. Skema zod dibagi pakai satu sumber.
8. Perubahan skema DB hanya lewat file baru di `supabase/migrations/`; jangan edit migrasi lama.
9. Logika hitung (Nilai Akhir, predikat, periode berikutnya, parser CSV) = fungsi murni + unit test.
10. Satu fase per sesi. Jangan mengerjakan fase berikutnya sebelum diminta.
11. Tidak menambah dependensi di luar PRD tanpa konfirmasi.

## Perintah
`pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test`

## Definition of Done (tiap fase)
typecheck + lint + build + test lulus; fitur diuji manual sesuai kriteria fase;
tulis ringkasan (selesai / diuji / butuh keputusan); commit Conventional Commits.
```

### A.2 Cara Menjalankan Tiap Fase

1. `/clear` → mulai sesi bersih.
2. Masuk **Plan Mode** (Shift+Tab dua kali), tempel prompt fase, tinjau rencana, setujui.
3. Setelah selesai, jalankan **Verifikasi** fase tersebut dan **Checklist Lintas Fase** (bagian C).
4. Commit, buka PR, merge ke `main`, lanjut fase berikutnya.

Tip: untuk pekerjaan independen dalam satu fase (mis. migrasi DB dan komponen UI), minta agent memakai **subagent paralel**.

---

## B. Ringkasan Fase

| Fase | Nama | Bergantung pada | Cakupan PRD |
|---|---|---|---|
| 0 | Fondasi proyek | — | §3, §7 |
| 1 | Database, Auth & Proteksi rute | 0 | §2, §4.3, §6 |
| 2 | Layout Dashboard & Sidebar | 1 | §4.4 |
| 3 | Periode & Pengaturan (bobot, KKM) | 1, 2 | §4.8, §5.1 |
| 4 | Kelola Kelas & Data Siswa | 2, 3 | §4.5, §5.2 |
| 5 | Impor CSV | 4 | §4.6 |
| 6 | Nilai Siswa + Nilai Akhir & Predikat | 3, 4 | §4.7, §5.3 |
| 7 | Ekspor Excel/PDF & Naik Kelas Massal | 4, 6 | §4.10, §4.11 |
| 8 | Hero Section & PWA | 1, 2 | §4.1, §4.2 |
| 9 | Dashboard | 4, 6 | §4.9 |
| 10 | QA, Polesan & Rilis | semua | §8, §10 |

Catatan: nomor fase di sini sedikit berbeda dari tabel PRD §9 (Auth & Layout dipecah, Ekspor & Naik Kelas jadi fase 7), tetapi cakupannya sama. Dashboard tetap **dikerjakan terakhir** sebelum QA.

---

## Fase 0 — Fondasi Proyek

**Branch:** `feat/00-fondasi`

**Tugas**
1. Inisialisasi Next.js 16.2.7 (App Router, TS strict, Tailwind 4, ESLint, alias `@/*`) dengan `pnpm`.
2. Inisialisasi shadcn; tambahkan: `button input label form select table dialog alert-dialog sheet sidebar tabs card badge skeleton tooltip dropdown-menu popover command sonner textarea separator breadcrumb`.
3. Pasang dependensi: `@supabase/ssr @supabase/supabase-js @tanstack/react-query @tanstack/react-table zustand react-hook-form @hookform/resolvers zod recharts sonner next-themes @teispace/next-themes lucide-react @hugeicons/react papaparse exceljs jspdf jspdf-autotable` (+ tipe yang diperlukan, Vitest, Playwright sebagai dev).
4. **Tema sporty** di `globals.css`: token `--primary` oranye/merah energik, `--accent` lime/biru stadion, `--radius` tegas; definisi terang **dan** gelap; font heading bold condensed (mis. Barlow Condensed/Oswald) + body (Inter/Geist) via `next/font`.
5. Root layout: `<html lang="id" suppressHydrationWarning>`, ThemeProvider (default `system`), QueryClientProvider, Toaster.
6. Struktur: `src/app`, `src/components/{ui,shared}`, `src/features/{kelas,siswa,nilai,periode,pengaturan,dashboard}`, `src/lib/{supabase,validators,hitung,csv,ekspor}`, `src/hooks`, `src/stores`, `supabase/migrations`.
7. Skrip `typecheck`, `test` (Vitest), `.env.example`, `.gitignore`.

**Prompt**
```
Baca @prd.md, @roadmap.md, dan @CLAUDE.md. Kerjakan HANYA Fase 0 (Fondasi Proyek).
Inisialisasi Next.js 16.2.7 + Tailwind 4 + shadcn, pasang semua dependensi dari PRD §3
(termasuk papaparse, exceljs, jspdf, jspdf-autotable), atur tema sporty (token warna terang/gelap,
font bold condensed), provider global (theme default system, react-query, sonner), struktur
folder sesuai roadmap, skrip typecheck/test, dan .env.example. Mulai dengan rencana singkat.
Jangan membuat fitur di luar fondasi.
```

**Verifikasi:** `pnpm build` lulus; halaman `/` placeholder berganti terang/gelap mengikuti perangkat tanpa kedip; heading tampil bold condensed.

---

## Fase 1 — Database, Auth & Proteksi Rute

**Branch:** `feat/01-db-auth`

**Tugas**
1. Migrasi SQL sesuai PRD §6:
   - `periods` (unik `(tahun_mulai, semester)`, partial unique index satu `is_active = true`).
   - `students` (NISN unik & hanya angka, `kelas` check 1–6, `jenis_kelamin` null default).
   - `grades` (unik `(student_id, period_id)`, semua nilai check 0–100, `keterangan` ≤ 300 karakter, FK `student_id` on delete cascade).
   - `settings` (singleton, default bobot 25/25/25/25, `kkm` 75, constraint jumlah bobot = 100).
   - `profiles` (role `admin`).
   - Trigger `updated_at` di semua tabel.
2. Fungsi `is_admin()` dan **RLS** semua tabel: hanya admin terautentikasi.
3. Seed: dua periode (Ganjil 2026-2027 **aktif**, Genap 2026-2027), satu baris `settings`, satu baris `profiles` untuk admin.
4. Klien Supabase `lib/supabase/{client,server}.ts` (`@supabase/ssr`); generate tipe TS dari skema.
5. `proxy.ts`: segarkan sesi; `/dashboard/*` tanpa login → `/masuk`; `/masuk` saat sudah login → `/dashboard`.
6. Halaman `/masuk`: form email + kata sandi (RHF + zod), error Bahasa Indonesia ("Email atau kata sandi salah"), Server Action masuk/keluar.
7. Tes RLS: pengguna anonim ditolak untuk baca/tulis semua tabel.

**Prompt**
```
Kerjakan HANYA Fase 1 (Database, Auth & Proteksi rute). Buat migrasi SQL untuk periods,
students, grades, settings, profiles persis sesuai PRD §6 (constraint check 0-100, kelas 1-6,
unik, partial unique index periode aktif, constraint jumlah bobot = 100, trigger updated_at).
Buat fungsi is_admin() dan RLS admin-only untuk semua tabel. Seed: periode Ganjil & Genap
2026-2027 (Ganjil aktif), satu baris settings default, profiles admin. Buat klien Supabase,
generate tipe, proxy.ts, dan halaman /masuk dengan form tervalidasi + Server Action.
Tulis tes yang membuktikan akses anonim ditolak. Jangan membuat UI dashboard.
```

**Verifikasi:** login admin berhasil; `/dashboard` tanpa login diarahkan ke `/masuk`; kueri anonim ke semua tabel ditolak; mengubah bobot menjadi total ≠ 100 ditolak oleh DB.

---

## Fase 2 — Layout Dashboard & Sidebar

**Branch:** `feat/02-layout-sidebar`

**Tugas**
1. Layout `/dashboard` dengan `Sidebar` shadcn: mode ikon di desktop, `Sheet` di mobile.
2. Menu: **Dashboard**, **Kelola Kelas** (submenu Kelas 1–6), **Nilai Siswa**, **Pengaturan**; item aktif ditandai.
3. **Persistensi collapse:** cookie `sidebar_state` dibaca di server pada layout (tanpa flash), cadangan `localStorage`; pulih saat aplikasi dibuka kembali.
4. Header: `SidebarTrigger`, breadcrumb, slot pemilih periode, `ThemeToggle` (Terang/Gelap/Sistem), menu pengguna + **Keluar**; nama sekolah tampil jika sudah diisi (nanti dari `settings`).
5. Komponen reusable: `PageHeader`, `EmptyState`, `ThemeToggle`.
6. Halaman placeholder: `/dashboard`, `/dashboard/kelas`, `/dashboard/nilai`, `/dashboard/pengaturan`.

**Prompt**
```
Kerjakan HANYA Fase 2 (Layout & Sidebar). Bangun layout /dashboard dengan Sidebar shadcn
collapsible; status collapse tersimpan di cookie (dibaca di server agar tanpa flash) dan
pulih saat aplikasi dibuka ulang. Menu: Dashboard, Kelola Kelas (submenu Kelas 1-6), Nilai Siswa,
Pengaturan. Tambahkan header (breadcrumb, theme toggle, slot periode, menu pengguna + Keluar),
komponen PageHeader/EmptyState/ThemeToggle, dan halaman placeholder. Semua teks Bahasa Indonesia.
```

**Verifikasi:** collapse → refresh → status sama; tutup-buka tab → sama; mobile memakai Sheet; ganti tema tanpa kedip.

---

## Fase 3 — Periode & Pengaturan (Bobot, KKM)

**Branch:** `feat/03-periode-pengaturan`

**Tugas**
1. Fungsi murni `lib/hitung/periode.ts`: `namaPeriode()`, `periodeBerikutnya()` (Genap 2026-2027 → Ganjil 2027-2028 → Genap 2027-2028 …), **unit test**.
2. `/dashboard/pengaturan` dengan `Tabs`: **Periode**, **Penilaian**, **Tampilan**, **Akun**.
3. Tab Periode: tabel, tambah/ubah/hapus (hapus ditolak jika sudah ada nilai), **Buat Periode Berikutnya**, **Jadikan Aktif** (hanya satu aktif, atomik).
4. Tab Penilaian (`WeightSettingsForm`): bobot Praktek/UH/ASTS/ASAS (persen) dan **KKM** (default 75); validasi total bobot = 100% dengan penjumlah langsung di form; simpan ke `settings`.
5. **Hitung ulang saat pengaturan berubah:** trigger/fungsi DB sehingga perubahan bobot/KKM menghitung ulang `nilai_akhir` dan `predikat` semua baris `grades` (fungsi DB `hitung_nilai_akhir` dibuat di fase ini agar dipakai Fase 6). Aturan: Nilai Akhir hanya terhitung bila **keempat** komponen terisi; dibulatkan 2 desimal; Tuntas bila ≥ KKM.
6. Tab Tampilan: tema, nama sekolah (opsional), reset status sidebar. Tab Akun: ganti kata sandi.
7. `PeriodSelect` reusable di header (zustand + cookie), default periode aktif; hook `usePeriods`, `useActivePeriod`, `useSettings`.
8. Fungsi murni TS `hitungNilaiAkhir(nilai, bobot)` dan `tentukanPredikat(nilaiAkhir, kkm)` + unit test (kasus: ada komponen kosong, pembulatan, tepat di KKM).

**Prompt**
```
Kerjakan HANYA Fase 3 (Periode & Pengaturan). (1) Fungsi murni periodeBerikutnya/namaPeriode
dengan unit test (tahun ajaran mulai Juli: Ganjil Jul-Des, Genap Jan-Jun). (2) Halaman
Pengaturan bertab: Periode, Penilaian, Tampilan, Akun. CRUD periode, Jadikan Aktif (atomik),
Buat Periode Berikutnya, hapus ditolak bila ada nilai. (3) Tab Penilaian: form bobot 4 komponen
(total harus 100%) dan KKM default 75, tersimpan di tabel settings. (4) Buat fungsi DB + trigger
yang menghitung nilai_akhir & predikat di grades (hanya jika 4 komponen terisi, bulat 2 desimal,
Tuntas bila >= KKM) dan menghitung ulang semua grades ketika settings berubah (lewat migrasi
baru). (5) Fungsi TS murni hitungNilaiAkhir & tentukanPredikat dengan unit test yang
hasilnya identik dengan logika DB. (6) PeriodSelect di header dengan hook usePeriods/
useActivePeriod/useSettings. Semua teks Bahasa Indonesia.
```

**Verifikasi:** unit test lulus; periode aktif default = Ganjil 2026-2027; "Buat Periode Berikutnya" menghasilkan Ganjil 2027-2028 setelah Genap 2026-2027; bobot total ≠ 100 ditolak; mengubah KKM memperbarui predikat data yang sudah ada.

---

## Fase 4 — Kelola Kelas & Data Siswa

**Branch:** `feat/04-kelas-siswa`

**Tugas**
1. `/dashboard/kelas`: kartu Kelas 1–6 (jumlah siswa, jumlah L/P).
2. `/dashboard/kelas/[kelas]`: `DataTable` siswa (`@tanstack/react-table`): cari nama/NISN, urut, paginasi; parameter di luar 1–6 → 404.
3. Form tambah/ubah siswa (`Dialog`/`Sheet`): NISN (angka, unik), Nama, Kelas, Jenis Kelamin (**default kosong**). Skema zod bersama klien-server.
4. Hapus siswa lewat `AlertDialog`; peringatan ekstra jika siswa sudah memiliki nilai (nilai ikut terhapus).
5. Pindah kelas lewat edit.
6. Komponen reusable: `DataTable` generik, `ClassSelect`, `ConfirmDialog`.
7. Server Actions + invalidasi TanStack Query; toast Bahasa Indonesia; error NISN duplikat jelas.

**Prompt**
```
Kerjakan HANYA Fase 4 (Kelola Kelas & Siswa). Bangun /dashboard/kelas (kartu Kelas 1-6
dengan jumlah siswa & L/P) dan /dashboard/kelas/[kelas] (DataTable siswa: cari, urut, paginasi;
404 bila kelas di luar 1-6). CRUD siswa lewat Dialog dengan skema zod bersama klien-server
(NISN angka & unik, jenis kelamin default kosong). Hapus siswa dengan AlertDialog dan
peringatan ekstra bila sudah punya nilai. Buat komponen reusable DataTable, ClassSelect,
ConfirmDialog. Semua teks Bahasa Indonesia.
```

**Verifikasi:** NISN ganda ditolak dengan pesan jelas; jenis kelamin boleh kosong; hapus siswa bernilai menampilkan peringatan; cari & paginasi berfungsi.

---

## Fase 5 — Impor CSV

**Branch:** `feat/05-impor-csv`

**Tugas**
1. `CsvImportDialog`: area unggah + **Unduh Template CSV** (`nisn,nama,kelas,jenis_kelamin`); tersedia di halaman indeks kelas dan halaman kelas.
2. `lib/csv/parse.ts` (fungsi murni): `papaparse` dengan delimiter `,`/`;`, BOM UTF-8, header tidak peka huruf besar/kecil; batas 2 MB dan 1.000 baris.
3. Normalisasi: `L/Laki-laki` → `L`, `P/Perempuan` → `P`, kosong → null; **NISN selalu string** (jangan hilangkan nol di depan); kelas 1–6.
4. Pratinjau per baris: valid / error (alasan) / duplikat NISN dalam file.
5. Simpan lewat RPC/Server Action **satu transaksi**: upsert berdasarkan NISN; baris error dilewati.
6. Ringkasan: ditambah, diperbarui, dilewati + unduh CSV baris gagal.
7. Unit test parser (delimiter `;`, BOM, NISN berawalan 0, jenis kelamin variasi, baris kosong, header berbeda kapitalisasi).

**Prompt**
```
Kerjakan HANYA Fase 5 (Impor CSV). Buat CsvImportDialog: unduh template, unggah, parse
dengan papaparse (delimiter , dan ;, BOM UTF-8, header tidak peka huruf besar/kecil), normalisasi
jenis kelamin (L/P/Laki-laki/Perempuan/kosong) dan NISN (tetap string, nol di depan utuh),
pratinjau validasi per baris, simpan sebagai upsert berdasarkan NISN dalam SATU transaksi,
tampilkan ringkasan (ditambah/diperbarui/dilewati) dan unduhan CSV baris gagal. Batas 2 MB
dan 1.000 baris. Tulis unit test untuk parser dan normalisasi.
```

**Verifikasi:** NISN berawalan 0 tetap utuh; impor ulang file sama memperbarui, bukan menggandakan; file rusak memberi pesan jelas; satu baris error tidak menggagalkan baris lain.

---

## Fase 6 — Nilai Siswa + Nilai Akhir & Predikat

**Branch:** `feat/06-nilai-siswa`

**Tugas**
1. `/dashboard/nilai`: pilih **Kelas** dan **Periode** (default aktif); tabel memuat **semua siswa kelas itu**, termasuk yang belum punya catatan nilai (LEFT JOIN).
2. Kolom: Nama, Kelas, Nilai Praktek, Nilai UH, Nilai ASTS, Nilai ASAS, **Nilai Akhir**, **Predikat**, Keterangan. NISN sebagai kolom opsional/tooltip.
3. `GradeCell`: input inline 0–100 (maks. 2 desimal), kosong default (bukan 0), navigasi Tab/Enter/panah, validasi langsung.
4. Keterangan ≤ 300 karakter dengan penghitung; `Popover`/`Dialog` untuk teks panjang.
5. **Simpan otomatis** debounce ±800 ms via upsert `(student_id, period_id)`, menyimpan `kelas_saat_nilai`; indikator per baris "Menyimpan…/Tersimpan ✓/Gagal" dengan coba ulang; gagal → toast + sel tetap ditandai belum tersimpan.
6. Nilai Akhir & Predikat: ditampilkan dari hasil DB (trigger Fase 3) dan **pratinjau instan** memakai fungsi murni `hitungNilaiAkhir`/`tentukanPredikat` saat mengetik; Nilai Akhir **kosong** jika ada komponen kosong; Predikat sebagai `Badge` (hijau Tuntas / merah Belum Tuntas, tidak bergantung pada warna saja: sertakan teks).
7. Peringatan keluar halaman jika ada perubahan belum tersimpan; cari nama; filter "Belum ada nilai"; kolom Nama sticky di mobile.
8. Nilai periode lama tetap dapat diedit (tanpa kunci).
9. Tes: upsert idempoten, penolakan nilai di luar rentang (klien & DB), kecocokan hasil hitung TS dan DB.

**Prompt**
```
Kerjakan HANYA Fase 6 (Nilai Siswa). Bangun /dashboard/nilai: pilih kelas & periode (default
periode aktif); tabel semua siswa kelas itu (termasuk yang belum punya nilai) dengan kolom
Nama, Kelas, Praktek, UH, ASTS, ASAS, Nilai Akhir, Predikat, Keterangan. Nilai kosong default
(0-100, maks 2 desimal), input inline dengan navigasi keyboard. Simpan otomatis debounce 800ms
via upsert (student_id, period_id) + kelas_saat_nilai, indikator status per baris dan coba
ulang. Nilai Akhir & Predikat: pakai hasil DB, plus pratinjau instan dengan fungsi murni dari
Fase 3; Nilai Akhir kosong bila ada komponen kosong; Predikat sebagai Badge dengan teks
Tuntas/Belum Tuntas. Tambah peringatan perubahan belum tersimpan, cari nama, filter
"Belum ada nilai", kolom Nama sticky di mobile. Tulis tes upsert idempoten, validasi rentang,
dan kecocokan hitung TS vs DB.
```

**Verifikasi:** isi sebagian kolom → tersimpan, Nilai Akhir kosong; isi keempatnya → Nilai Akhir & Predikat muncul sesuai bobot/KKM; ubah bobot di Pengaturan → nilai akhir semua siswa ikut berubah; pindah periode tidak memengaruhi periode lain; nilai 101 ditolak.

---

## Fase 7 — Ekspor Excel/PDF & Naik Kelas Massal

**Branch:** `feat/07-ekspor-naik-kelas`

### 7A. Ekspor Nilai (PRD §4.10)

**Tugas**
1. `ExportButton` (`DropdownMenu`): **Excel (.xlsx)** dan **PDF**, tersedia di halaman Nilai Siswa.
2. Data ekspor mengikuti **kelas & periode** yang sedang tampil: Nama, NISN, Kelas, Praktek, UH, ASTS, ASAS, Nilai Akhir, Predikat, Keterangan. Sel kosong tetap kosong (bukan 0).
3. Excel (`exceljs`): header terformat, lebar kolom wajar, baris ringkasan (rata-rata per komponen, jumlah Tuntas/Belum Tuntas); opsi **semua kelas** → satu sheet per kelas. NISN sebagai teks.
4. PDF (`jspdf` + `jspdf-autotable`): **landscape**, header nama sekolah (jika diisi), kelas, periode, tabel rapi dan paginasi header berulang.
5. Nama file: `Nilai_PJOK_Kelas{N}_{Periode}.xlsx` / `.pdf` (periode aman untuk nama file, mis. `Ganjil_2026-2027`).
6. Pustaka berat dimuat dengan **dynamic import** saat dipakai; indikator loading; unduh otomatis setelah selesai.
7. Unit test pembentuk data ekspor (fungsi murni) dan nama file.

### 7B. Naik Kelas Massal (PRD §4.11)

**Keputusan yang harus diambil dulu (agent wajib bertanya sebelum menulis kode):** PRD NK-3 menyebut siswa Kelas 6 "tetap / ditandai lulus / hapus / arsip" tanpa memilih. Rekomendasi: tambah kolom `students.status` (`aktif` | `lulus`) lewat migrasi baru; siswa Kelas 6 default ditandai `lulus` (tidak dihapus agar nilai historis aman), daftar siswa menyaring status `aktif` secara default dengan opsi menampilkan lulus.

**Tugas**
1. `NaikKelasDialog` (`AlertDialog` berlangkah) di Pengaturan atau Kelola Kelas.
2. Pratinjau: jumlah siswa per kelas yang akan dipindah (1→2, 2→3, …, 5→6) dan jumlah siswa Kelas 6 beserta pilihan penanganan (sesuai keputusan di atas); konfirmasi eksplisit (mis. ketik "NAIK KELAS").
3. Eksekusi **satu transaksi** (RPC); gagal → tidak ada perubahan. Urutan update harus benar (mulai dari kelas tertinggi agar tidak bertumpuk).
4. Ringkasan hasil per kelas.
5. Nilai historis tidak berubah (`kelas_saat_nilai` tetap); tidak mengubah/menghapus catatan `grades`.
6. Pengaman: cegah eksekusi ganda tidak sengaja (tombol dinonaktifkan saat proses; catat waktu eksekusi terakhir di `settings` atau tampilkan peringatan jika dijalankan lagi dalam waktu dekat).
7. Tes: pemindahan benar, Kelas 6 sesuai pilihan, rollback saat gagal, `grades` tidak berubah.

**Prompt**
```
Kerjakan HANYA Fase 7 (Ekspor & Naik Kelas Massal).
Bagian 7A Ekspor: ExportButton (DropdownMenu Excel/PDF) di halaman Nilai Siswa. Ekspor
mengikuti kelas & periode tampil, kolom: Nama, NISN, Kelas, Praktek, UH, ASTS, ASAS,
Nilai Akhir, Predikat, Keterangan. Excel pakai exceljs (header terformat, baris ringkasan
rata-rata & jumlah Tuntas/Belum Tuntas, opsi semua kelas = satu sheet per kelas, NISN teks).
PDF pakai jspdf + jspdf-autotable (landscape, header nama sekolah/kelas/periode). Nama file
Nilai_PJOK_Kelas{N}_{Periode}.xlsx/.pdf. Muat pustaka dengan dynamic import, tampilkan
loading. Tulis unit test pembentuk data & nama file.
Bagian 7B Naik Kelas: SEBELUM menulis kode, tanyakan kepada saya penanganan siswa Kelas 6
(rekomendasi: kolom students.status aktif|lulus, Kelas 6 ditandai lulus) memakai
AskUserQuestion. Setelah dijawab, buat NaikKelasDialog dengan pratinjau jumlah per kelas,
konfirmasi eksplisit, eksekusi dalam satu transaksi (RPC, update dari kelas tertinggi),
ringkasan hasil, pengaman eksekusi ganda, dan pastikan tabel grades tidak berubah.
Tulis tes termasuk rollback.
```

**Verifikasi:** file .xlsx & .pdf terbuka normal, isi cocok dengan layar; nama file sesuai pola; naik kelas memindahkan Kelas N→N+1 dengan benar; Kelas 6 sesuai keputusan; nilai riwayat tetap menampilkan kelas lamanya; simulasi error menghasilkan rollback total.

---

## Fase 8 — Hero Section & PWA

**Branch:** `feat/08-hero-pwa`

**Tugas**
1. Halaman `/` (hero): `h-dvh`, **tanpa scroll** (vertikal & horizontal) di 360×640 hingga 1920×1080; headline bold condensed besar ("KELOLA NILAI PJOK, LEBIH CEPAT & RAPI."), subheadline, grafis sporty ringan (diagonal/pola lintasan/ikon), tanpa gambar berat; terang/gelap.
2. Tombol: belum login → **Masuk** (`/masuk`); sudah login → **Kelola Nilai** (`/dashboard`). Status login dibaca di server.
3. `app/manifest.ts`: nama, `short_name`, `start_url`, `display: standalone`, `theme_color`, `background_color`, ikon 192/512 + maskable (buat ikon sporty sederhana).
4. `public/sw.js`: cache app shell/aset statis saja (data nilai & API tidak di-cache); registrasi aman dan versi cache untuk pembaruan.
5. Hook `useInstallPrompt`: tangkap `beforeinstallprompt`, deteksi `display-mode: standalone`, event `appinstalled`, `navigator.getInstalledRelatedApps()` bila ada.
6. `InstallAppButton`: **tampil hanya** bila bisa dipasang dan belum terpasang; **hilang** setelah terpasang atau saat standalone; tidak tampil di browser tak didukung (opsional petunjuk "Tambahkan ke Layar Utama" untuk iOS).
7. Audit Lighthouse (installable).

**Prompt**
```
Kerjakan HANYA Fase 8 (Hero & PWA). Buat hero di "/" setinggi layar (h-dvh, tanpa scroll)
bertema sporty dengan headline bold condensed, tombol Masuk (/masuk) yang berubah menjadi
"Kelola Nilai" (/dashboard) bila sudah login (dibaca di server), dan tombol Install App.
Tambahkan app/manifest.ts + ikon 192/512/maskable, public/sw.js (hanya cache aset statis, tidak
cache data), hook useInstallPrompt, dan InstallAppButton yang hanya tampil bila belum terpasang
(sembunyikan saat standalone, setelah appinstalled, atau bila tak didukung). Semua teks Bahasa
Indonesia.
```

**Verifikasi:** Chrome Android & desktop menampilkan Install App; setelah terpasang tombol hilang (juga di jendela standalone); hero tidak bisa di-scroll di berbagai ukuran; Lighthouse installable lulus.

---

## Fase 9 — Dashboard (dikerjakan terakhir sebelum QA)

**Branch:** `feat/09-dashboard`

**Tugas**
1. Kartu ringkasan: total siswa, siswa per kelas, persentase kelengkapan nilai periode terpilih.
2. Grafik `recharts`: rata-rata Praktek/UH/ASTS/ASAS per kelas (bar), sebaran Laki-laki vs Perempuan; tambahan wajar: jumlah Tuntas vs Belum Tuntas per kelas.
3. Daftar **Perlu Dilengkapi** (kelas/siswa dengan nilai kosong) dengan tautan ke `/dashboard/nilai?kelas=N`.
4. Pintasan: Impor CSV, Input Nilai, Tambah Siswa; tombol Ekspor (PRD §4.10 menyebut tersedia di Dashboard).
5. Agregasi lewat view/RPC SQL; mengikuti periode terpilih; `Skeleton` saat memuat; `EmptyState` bila belum ada data.
6. Warna chart memakai token tema (terbaca di terang & gelap).
7. Siswa berstatus `lulus` (jika diputuskan di Fase 7B) tidak dihitung dalam total siswa aktif.

**Prompt**
```
Kerjakan HANYA Fase 9 (Dashboard). Buat kartu ringkasan (total siswa, siswa per kelas,
persentase kelengkapan nilai), grafik recharts (rata-rata Praktek/UH/ASTS/ASAS per kelas,
sebaran L/P, jumlah Tuntas vs Belum Tuntas per kelas), daftar "Perlu Dilengkapi" dengan tautan
ke /dashboard/nilai?kelas=N, pintasan aksi cepat, dan tombol Ekspor. Gunakan view/RPC SQL untuk
agregasi, ikuti periode terpilih, tambah skeleton dan empty state, dan pakai token warna tema
untuk chart. Abaikan siswa berstatus lulus dari total aktif bila kolom status ada.
```

**Verifikasi:** angka dashboard cocok dengan data tabel; ganti periode memperbarui semua kartu & grafik; chart terbaca di tema gelap; tautan "Perlu Dilengkapi" membuka kelas yang benar.

---

## Fase 10 — QA, Polesan & Rilis

**Branch:** `chore/10-qa-rilis`

**Tugas**
1. Audit teks UI: 100% Bahasa Indonesia dan konsisten.
2. Audit UI: hanya shadcn/komposisinya; tidak ada warna hard-code.
3. Aksesibilitas: fokus keyboard, label ARIA, kontras AA di kedua tema, status tidak hanya dengan warna.
4. Uji lintas perangkat: Android Chrome, desktop Chrome/Edge, lebar 360 px.
5. Performa: Lighthouse ≥ 90 (Performance, PWA); periksa ukuran bundel (exceljs/jspdf dimuat dinamis).
6. Keamanan: tinjau RLS semua tabel & RPC, pastikan tidak ada `service_role` di bundel klien, header keamanan.
7. E2E Playwright: login → impor CSV → input nilai (Nilai Akhir & Predikat muncul) → ubah bobot/KKM → ekspor → ganti periode → naik kelas (di data uji) → logout.
8. Dokumentasi: `README.md` (setup, env, migrasi, seed, deploy, cara membuat admin) dan panduan singkat penggunaan.
9. Deploy produksi Vercel; uji instalasi PWA di URL produksi.
10. Telusuri **Kriteria Penerimaan PRD §10 (1–14)** satu per satu dan laporkan status.

**Prompt**
```
Kerjakan HANYA Fase 10 (QA & Rilis). Audit teks UI (harus 100% Bahasa Indonesia), penggunaan
shadcn dan token warna, aksesibilitas dasar, keamanan (RLS tabel & RPC, tidak ada service_role di
klien). Tambahkan tes e2e Playwright untuk alur: login -> impor CSV -> input nilai (Nilai Akhir &
Predikat) -> ubah bobot/KKM -> ekspor -> ganti periode -> naik kelas (data uji) -> logout. Tulis
README. Lalu telusuri Kriteria Penerimaan PRD §10 nomor 1-14, laporkan status tiap butir
(lulus/gagal/bukti), dan perbaiki yang gagal.
```

---

## C. Checklist Lintas Fase (jalankan di akhir setiap fase)

- [ ] `pnpm typecheck && pnpm lint && pnpm build && pnpm test` lulus
- [ ] Semua teks UI Bahasa Indonesia
- [ ] Hanya komponen shadcn; warna lewat token
- [ ] Benar di tema terang & gelap, mobile (360 px) & desktop
- [ ] RLS tetap menolak akses anonim
- [ ] Skema DB hanya berubah lewat migrasi baru
- [ ] Commit Conventional Commits → PR → merge ke `main`

## D. Aturan Kerja Agent

1. **Satu fase per sesi.** Jangan melompat ke fase berikutnya tanpa diminta.
2. **Rencana dulu** (Plan Mode); minta persetujuan sebelum perubahan skema DB atau keputusan produk.
3. **Berhenti dan bertanya** jika PRD ambigu (contoh: penanganan siswa Kelas 6 di Fase 7B).
4. Logika perhitungan hanya ditulis sekali sebagai fungsi murni dan dites; hasil TS dan DB harus identik.
5. Jangan menambah dependensi di luar PRD §3 tanpa konfirmasi.
6. Akhiri setiap fase dengan ringkasan: **selesai**, **diuji**, **butuh keputusan**.

## E. Peta Kebutuhan PRD → Fase

| Kebutuhan PRD | Fase |
|---|---|
| Hero, tombol Masuk/Kelola Nilai (H-1…H-7) | 8 |
| PWA & tombol Install App (P-1…P-6) | 8 |
| Auth & proteksi rute (A-1…A-4) | 1 |
| Sidebar collapsible persisten (L-1…L-6) | 2 |
| Kelola kelas & siswa (K-1…K-7) | 4 |
| Impor CSV (C-1…C-8) | 5 |
| Nilai siswa (N-1…N-10) | 6 |
| Nilai Akhir & Predikat (N-11, N-12) | 3 (logika) + 6 (UI) |
| Tombol ekspor di halaman nilai (N-13), Ekspor (E-1…E-7) | 7A |
| Periode, bobot, KKM, pengaturan (S-1…S-7) | 3 |
| Naik kelas massal (NK-1…NK-7) | 7B |
| Dashboard (D-1…D-5) | 9 |
| Non-fungsional & kriteria penerimaan (§8, §10) | 10 |