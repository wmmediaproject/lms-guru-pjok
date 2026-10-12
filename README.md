# LMS Guru PJOK — Sistem Manajemen Nilai PJOK SD (Kelas 1–6)

Aplikasi web progresif (PWA) berbasis **Next.js 16 (App Router)** dan **Supabase (PostgreSQL + Auth + RLS)** yang dirancang khusus untuk membantu Guru Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK) Sekolah Dasar mengelola data siswa, rekapitulasi nilai 4 komponen, perhitungan Nilai Akhir & Predikat otomatis, kenaikan kelas massal, serta ekspor laporan ke Excel dan PDF dalam satu tempat.

---

## Fitur Utama

1. **Autentikasi Admin Tunggal & Proteksi Rute (`proxy.ts` + Supabase RLS)**
   - Hanya akun guru berstatus `admin` pada tabel `profiles` yang dapat mengakses `/dashboard/*` serta membaca/menulis data.
   - Seluruh tabel (`periods`, `students`, `grades`, `settings`, `profiles`), *view* (`security_invoker = true`), dan fungsi RPC dilindungi oleh Row Level Security (RLS).
2. **Manajemen Periode Semester & Tahun Ajaran**
   - Pemilih periode aktif di bilah atas (*Header*) yang tersimpan di penyimpanan lokal/kuki.
   - Pembuatan periode berikutnya secara otomatis (`Semester Ganjil YYYY-YYYY+1` ↔ `Semester Genap YYYY-YYYY+1`) serta proteksi penghapusan periode yang sudah memiliki data nilai.
3. **Kelola Kelas (Kelas 1–6) & Impor CSV Massal**
   - Kartu ringkasan jumlah siswa aktif (Laki-laki, Perempuan, Belum Diisi) per kelas.
   - Tambah, ubah, dan hapus siswa per kelas dengan peringatan riwayat nilai.
   - Impor data siswa via CSV (`nisn, nama, kelas, jenis_kelamin`) dengan deteksi otomatis pemisah koma (`,`) atau titik koma (`;`), pratinjau validasi per baris, unduh daftar baris gagal, dan *upsert* atomik berdasarkan `nisn`.
4. **Input Nilai Bergaya Spreadsheet & Kalkulasi Otomatis**
   - Empat komponen penilaian: **Nilai Praktek**, **Nilai UH**, **Nilai ASTS**, dan **Nilai ASAS** (rentang `0–100`, mendukung hingga 2 desimal) serta kolom **Keterangan**.
   - **Nilai Akhir** dan **Predikat** (`Tuntas` / `Belum Tuntas`) dihitung secara otomatis baik di sisi klien (pratinjau instan) maupun di sisi database (trigger `grades_compute_before_write`).
   - Siswa yang belum memiliki nilai lengkap ditampilkan sebagai **"Belum ada nilai"** (nilai kosong disimpan sebagai `NULL`, bukan `0`).
   - Navigasi papan ketik (*Tab*, *Enter*, dan tombol panah) serta penyimpanan otomatis (*debounced auto-save* 600 ms) dan tombol **Simpan Nilai** eksplisit.
5. **Pengaturan Bobot Komponen, KKM, Tampilan & Profil Admin**
   - Pengaturan persentase bobot keempat komponen (total wajib tepat `100%`) dan KKM (`0–100`). Saat disimpan, trigger database (`settings_recalc_all_grades`) menghitung ulang seluruh catatan nilai siswa secara otomatis.
   - Pengaturan nama sekolah, tema tampilan (**Terang**, **Gelap**, **Sistem**), profil admin (Nama Lengkap, NIP, No. HP), dan ubah kata sandi.
6. **Naik Kelas Massal Akhir Tahun Ajaran**
   - Memindahkan siswa aktif naik satu tingkat (`Kelas 1 → 2` s.d. `Kelas 5 → 6`) dan menandai siswa `Kelas 6` sebagai **Lulus** (`status = 'lulus'`) dalam satu transaksi database (`promote_students_massal`) tanpa mengubah catatan nilai historis (`grades.kelas_saat_nilai`).
7. **Ekspor Laporan ke Excel (`.xlsx`) & PDF (`.pdf`)**
   - Ekspor nilai per kelas atau seluruh kelas (1–6) lengkap dengan header identitas sekolah, periode semester, rincian bobot & KKM, serta baris ringkasan rata-rata dan jumlah Tuntas/Belum Tuntas.
   - Pustaka `exceljs` dan `jspdf` dimuat secara dinamis (*dynamic import*) hanya saat tombol ekspor diklik.
8. **Dashboard Analitik & PWA**
   - Kartu metrik utama, daftar kelas yang masih perlu dilengkapi nilainya, grafik rata-rata 4 komponen per kelas, dan grafik distribusi ketuntasan.
   - Mendukung instalasi aplikasi ke perangkat (*Install App* / `manifest.webmanifest`).

---

## Tumpukan Teknologi

- **Framework:** Next.js 16.2+ (App Router, TypeScript `strict`)
- **UI & Styling:** Tailwind CSS v4, shadcn/ui, Lucide Icons, `next-themes`
- **Tipografi:** Barlow Condensed (Heading), Plus Jakarta Sans (Body), JetBrains Mono (Angka/NISN)
- **Database & Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`, PostgreSQL RLS)
- **State & Form:** TanStack Query v5, TanStack Table v9, Zustand, React Hook Form + Zod
- **Visualisasi & Berkas:** Recharts, PapaParse (CSV), ExcelJS (`.xlsx`), jsPDF + AutoTable (`.pdf`)
- **Pengujian:** Vitest + Testing Library (Unit/Integrasi), Playwright (End-to-End)

---

## Prasyarat

- **Node.js** versi `20.x` atau lebih baru
- **pnpm** versi `9.x` atau `10.x`
- Proyek **Supabase** aktif (Cloud atau Supabase CLI lokal)

---

## Konfigurasi Variabel Lingkungan

Salin berkas `.env.example` menjadi `.env.local` di direktori akar proyek:

```bash
cp .env.example .env.local
```

Isi variabel berikut pada `.env.local`:

```env
# URL dan Anon Key dari Dashboard Supabase -> Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://project-id-anda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Opsional (HANYA digunakan di server untuk sinkronisasi otomatis profil admin pertama)
# Jangan pernah mengekspos kunci ini dengan awalan NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Migrasi Database & Seed Awal

Seluruh skema database, constraint, indeks, kebijakan RLS, trigger kalkulasi nilai, view, dan fungsi RPC tersedia secara berurutan di folder `supabase/migrations/`:

1. `20261011000001_create_periods.sql` — Tabel `periods` & partial unique index periode aktif tunggal
2. `20261011000002_create_students.sql` — Tabel `students` (NISN unik hanya angka, kelas 1–6)
3. `20261011000003_create_grades.sql` — Tabel `grades` (`ON DELETE CASCADE`, komponen 0–100, `kelas_saat_nilai`)
4. `20261011000004_create_settings.sql` — Tabel `settings` (constraint total 4 bobot = 100)
5. `20261011000005_create_profiles.sql` — Tabel `profiles` (`role = 'admin'`)
6. `20261011000006_triggers_and_indexes.sql` — Trigger `updated_at` & indeks pencarian
7. `20261011000007_rls_and_functions.sql` — Fungsi `public.is_admin()` & kebijakan RLS di semua tabel
8. `20261011000008_seed_initial_data.sql` — Seed awal pengaturan default (bobot 25/25/25/25, KKM 75) & periode aktif awal
9. `20261011000009_grades_calc_and_period_rpc.sql` — Trigger kalkulasi `nilai_akhir` & `predikat` otomatis serta RPC `set_active_period`
10. `20261011000010_upsert_students_csv_rpc.sql` — RPC `upsert_students_csv` satu transaksi
11. `20261011000011_naik_kelas_massal.sql` — Kolom `status` (`aktif` / `lulus`) & RPC `promote_students_massal`
12. `20261011000012_ensure_admin_profile_rpc.sql` — Trigger & RPC `ensure_admin_profile`
13. `20261012000013_dashboard_views.sql` — View ringkasan dashboard & RPC `get_dashboard_summary`
14. `20261012000014_security_hardening_views_and_rpc.sql` — Hardening `security_invoker = true` pada semua view & pembatasan hak eksekusi RPC

### Cara Menjalankan Migrasi:

- **Menggunakan Supabase CLI:**
  ```bash
  supabase link --project-ref <project-id-anda>
  supabase db push
  ```
- **Menggunakan SQL Editor di Dashboard Supabase:**
  Jalankan isi berkas SQL dari `000001` hingga `000014` secara berurutan di menu **SQL Editor**.

---

## Cara Membuat Akun Admin Guru

1. Buka **Supabase Dashboard** → **Authentication** → **Users** → klik **Add User** → **Create New User**.
2. Masukkan alamat **Email** dan **Password** guru PJOK, centang **Auto Confirm User**, lalu klik **Create User**.
3. Setelah migrasi `000012` terpasang, pengguna pertama yang masuk atau dibuat akan otomatis terdaftar sebagai `admin` di tabel `public.profiles`.
4. Jika Anda ingin menetapkan status admin secara manual melalui **SQL Editor**, jalankan:
   ```sql
   INSERT INTO public.profiles (id, role)
   SELECT id, 'admin'
   FROM auth.users
   WHERE email = 'guru@sekolah.sch.id'
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```

---

## Menjalankan Proyek Secara Lokal

Instal dependensi dan jalankan server pengembangan:

```bash
pnpm install
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di peramban Anda.

### Perintah Kualitas Kode & Pengujian

```bash
# Pemeriksaan tipe TypeScript
pnpm typecheck

# Pemeriksaan kualitas kode ESLint
pnpm lint

# Menjalankan seluruh unit & integration test (Vitest)
pnpm test

# Menjalankan pengujian End-to-End (Playwright)
pnpm test:e2e

# Mem-build aplikasi untuk produksi
pnpm build
```

---

## Panduan Deploy ke Vercel

1. Unggah repositori ini ke GitHub / GitLab / Bitbucket.
2. Buka [Vercel Dashboard](https://vercel.com/new) dan impor repositori proyek.
3. Pada bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(opsional, hanya untuk server)*
4. Klik **Deploy**. Setiap perubahan pada branch utama akan otomatis di-deploy oleh Vercel.

---

## Panduan Singkat Penggunaan

1. **Masuk (`/masuk`):** Gunakan email dan kata sandi akun admin guru untuk masuk ke Dashboard.
2. **Atur Periode & Bobot (`/dashboard/pengaturan`):** Pastikan periode semester aktif sudah sesuai (mis. *Semester Ganjil 2026-2027*) serta atur bobot komponen nilai (total 100%) dan KKM.
3. **Tambah / Impor Siswa (`/dashboard/kelas`):** Tambahkan siswa secara manual per kelas atau klik **Impor CSV** (unduh template CSV terlebih dahulu bila diperlukan).
4. **Input Nilai (`/dashboard/nilai`):** Pilih tab Kelas 1–6, masukkan nilai Praktek, UH, ASTS, dan ASAS pada sel tabel. Nilai Akhir dan Predikat (`Tuntas` / `Belum Tuntas`) akan langsung muncul dan tersimpan otomatis.
5. **Ekspor Laporan:** Klik tombol **Ekspor Nilai** di halaman Nilai Siswa untuk mengunduh laporan dalam format Excel (`.xlsx`) atau PDF (`.pdf`).
6. **Naik Kelas Massal (`/dashboard/kelas`):** Pada akhir tahun ajaran, klik **Naik Kelas Massal**, periksa pratinjau jumlah siswa, ketik `NAIK KELAS`, lalu jalankan proses pemindahan otomatis.
