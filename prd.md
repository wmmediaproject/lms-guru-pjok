# PRD — LMS Guru PJOK

**Nama proyek web:** LMS Guru PJOK
**Mata pelajaran:** Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)
**Versi dokumen:** 1.0 (Draft)
**Tanggal:** 11 Oktober 2026
**Platform:** Web responsif + PWA (Android & Desktop)

---

## Daftar Isi

- [1. Ringkasan Produk](#1-ringkasan-produk)
  - [1.1 Latar Belakang & Masalah](#11-latar-belakang--masalah)
  - [1.2 Tujuan](#12-tujuan)
  - [1.3 Non-Goals (di luar cakupan v1)](#13-non-goals-di-luar-cakupan-v1)
- [2. Persona & Hak Akses](#2-persona--hak-akses)
- [3. Tech Stack](#3-tech-stack)
  - [3.1 Teknologi Utama](#31-teknologi-utama)
  - [3.2 Tambahan yang Diusulkan](#32-tambahan-yang-diusulkan)
  - [3.3 Catatan Teknis Next.js 16](#33-catatan-teknis-nextjs-16)
- [4. Fitur & Kebutuhan Fungsional](#4-fitur--kebutuhan-fungsional)
  - [4.1 Hero Section (Landing Page `/`)](#41-hero-section-landing-page-)
  - [4.2 PWA (Android & Desktop)](#42-pwa-android--desktop)
  - [4.3 Autentikasi](#43-autentikasi)
  - [4.4 Layout Aplikasi & Sidebar](#44-layout-aplikasi--sidebar)
  - [4.5 Kelola Kelas & Data Siswa](#45-kelola-kelas--data-siswa)
  - [4.6 Impor Data Siswa via CSV](#46-impor-data-siswa-via-csv)
  - [4.7 Nilai Siswa](#47-nilai-siswa)
  - [4.8 Pengaturan](#48-pengaturan)
  - [4.9 Dashboard (`/dashboard`)](#49-dashboard-dashboard)
  - [4.10 Ekspor Nilai](#410-ekspor-nilai)
  - [4.11 Naik Kelas Massal](#411-naik-kelas-massal)
- [5. Aturan Bisnis](#5-aturan-bisnis)
  - [5.1 Periode Tahun Ajaran](#51-periode-tahun-ajaran)
  - [5.2 Kelas & Siswa](#52-kelas--siswa)
  - [5.3 Nilai & Nilai Akhir](#53-nilai--nilai-akhir)
- [6. Model Data (Supabase PostgreSQL)](#6-model-data-supabase-postgresql)
  - [`periods`](#periods)
  - [`students`](#students)
  - [`grades`](#grades)
  - [`settings`](#settings)
  - [`profiles` (opsional, untuk role)](#profiles-opsional-untuk-role)
- [7. UI/UX](#7-uiux)
  - [7.1 Prinsip](#71-prinsip)
  - [7.2 Design Token (diatur lewat CSS variables shadcn)](#72-design-token-diatur-lewat-css-variables-shadcn)
  - [7.3 Tema Terang/Gelap](#73-tema-teranggelap)
  - [7.4 Komponen shadcn yang Dipakai](#74-komponen-shadcn-yang-dipakai)
- [8. Kebutuhan Non-Fungsional](#8-kebutuhan-non-fungsional)
- [9. Roadmap Pengerjaan](#9-roadmap-pengerjaan)
- [10. Kriteria Penerimaan (Acceptance Criteria)](#10-kriteria-penerimaan-acceptance-criteria)
- [11. Asumsi](#11-asumsi)
- [12. Pertanyaan Terbuka (Terjawab)](#12-pertanyaan-terbuka-terjawab)

---

## 1. Ringkasan Produk

LMS Guru PJOK adalah aplikasi web untuk mengelola data kelas, data siswa, dan nilai mata pelajaran PJOK pada jenjang Sekolah Dasar (Kelas 1–6). Aplikasi dipakai oleh satu peran saja, yaitu **admin** (guru PJOK). Admin dapat mengimpor data siswa lewat CSV, menginput dan mengedit nilai kapan saja per kelas, serta memantau ringkasan nilai lewat dashboard.

Aplikasi dapat dipasang (install) sebagai PWA di Android dan desktop, dan mengikuti periode tahun ajaran pemerintah Indonesia (Semester Ganjil / Genap).

### 1.1 Latar Belakang & Masalah

- Guru PJOK umumnya mengampu banyak kelas sekaligus (Kelas 1–6), sehingga rekap nilai tersebar di buku nilai, Excel, dan catatan terpisah.
- Nilai praktek, UH, ASTS, dan ASAS sering diinput bertahap, sehingga guru butuh fleksibilitas input kapan saja.
- Guru perlu menulis keterangan singkat per siswa untuk keperluan rapor/deskripsi capaian.
- Data siswa biasanya sudah tersedia dalam bentuk Excel/CSV dari sekolah, sehingga impor massal harus mudah.

### 1.2 Tujuan

1. Mengelola data siswa Kelas 1–6 secara terpusat (tambah, ubah, hapus, impor CSV).
2. Menginput dan mengedit nilai PJOK per kelas dan per periode secara fleksibel.
3. Menghitung **Nilai Akhir** otomatis berdasarkan bobot yang dapat diatur admin, serta menampilkan predikat ketuntasan (KKM 75).
4. **Mengekspor** rekap nilai ke Excel dan PDF untuk keperluan rapor dan dokumentasi.
5. Mengelola periode tahun ajaran (Semester Ganjil/Genap) dan menyimpan riwayat nilai per periode.
6. Menyediakan fitur **naik kelas massal** di akhir tahun ajaran.
7. Menyediakan aplikasi yang dapat di-install dan nyaman dipakai di HP maupun desktop.

### 1.3 Non-Goals (di luar cakupan v1)

- Login siswa, orang tua, atau guru lain (hanya admin).
- Absensi, jadwal, materi pembelajaran, atau tugas online.
- Cetak rapor resmi (tersedia ekspor rekap nilai ke Excel/PDF, bukan format rapor sekolah).
- Mode offline penuh untuk input data (v1 hanya instalasi PWA dan cache aset).
- Rombel/kelas paralel (mis. 4A, 4B).
- Pendaftaran akun publik.

---

## 2. Persona & Hak Akses

| Peran | Deskripsi | Hak Akses |
|---|---|---|
| **Admin** | Guru PJOK pengelola aplikasi | Seluruh fitur: kelola kelas, siswa, nilai, periode, dan pengaturan |
| Pengunjung (belum masuk) | Siapa saja yang membuka website | Hanya melihat Hero section/landing page dan tombol Masuk / Install App |

**Aturan akses:**
- Semua rute `/dashboard/*` hanya dapat diakses setelah login. Jika belum login, diarahkan ke halaman Masuk.
- Tidak ada fitur registrasi. Akun admin dibuat manual lewat Supabase (seed) dan dikunci dengan RLS.

---

## 3. Tech Stack

### 3.1 Teknologi Utama

| Kebutuhan | Teknologi |
|---|---|
| Framework aplikasi | `next` 16.2.7 (App Router) |
| UI library | `react` 19.2.4, `react-dom` 19.2.4 |
| Bahasa | `typescript` (strict mode) |
| Styling | `tailwindcss` 4 |
| Komponen UI & ikon | `shadcn`, `radix-ui`, `lucide-react`, `@hugeicons/react` |
| Backend/BaaS | Supabase (PostgreSQL, Auth, Storage, RLS) via `@supabase/ssr` dan `@supabase/supabase-js` |
| Data fetching & cache (client) | `@tanstack/react-query` |
| Tabel data admin | `@tanstack/react-table` |
| Global state ringan | `zustand` |
| Form & validasi | `react-hook-form`, `@hookform/resolvers`, `zod` |
| Chart dashboard | `recharts` |
| Toast | `sonner` |
| Tema (light/dark) | `next-themes`, `@teispace/next-themes` |
| Hosting & deploy | Vercel |

> **Aturan UI:** seluruh UI pada website **wajib** menggunakan komponen shadcn (Button, Input, Form, Table, Dialog, Sheet, Select, Tabs, Card, Badge, Calendar, Command, dll.). Komponen custom hanya boleh dibangun sebagai komposisi dari primitif shadcn/Radix.

### 3.2 Tambahan yang Diusulkan

| Kebutuhan | Teknologi | Alasan |
|---|---|---|
| Parsing CSV | `papaparse` | Parsing CSV di sisi klien yang andal (delimiter `,` dan `;`, BOM, kutip) |
| Ekspor Excel | `exceljs` atau `xlsx` (`SheetJS`) | Menghasilkan file .xlsx di sisi klien/server |
| Ekspor PDF | `jspdf` + `jspdf-autotable` | Menghasilkan file PDF tabel nilai di sisi klien |
| PWA | `app/manifest.ts` bawaan Next.js + service worker sederhana di `public/sw.js` | Installability tanpa dependensi berat |
| Font | `next/font` (heading bold condensed, mis. Barlow Condensed/Oswald; body Inter/Geist) | Kesan sporty dan performa font baik |

### 3.3 Catatan Teknis Next.js 16

- Proteksi rute memakai `proxy.ts` (pengganti `middleware.ts` di Next.js 16) untuk menyegarkan sesi Supabase dan mengarahkan pengguna yang belum login.
- Mutasi data memakai Server Actions atau Route Handlers; pembacaan data interaktif memakai TanStack Query.

---

## 4. Fitur & Kebutuhan Fungsional

### 4.1 Hero Section (Landing Page `/`)

**Tujuan:** Halaman pertama yang sporty, ringkas, dan langsung mengarahkan ke aksi.

| ID | Kebutuhan |
|---|---|
| H-1 | Tinggi hero maksimal **setinggi layar perangkat** (`h-dvh`, tanpa scroll vertikal maupun horizontal). |
| H-2 | Tema sporty: headline **font bold/condensed** berukuran besar, warna energik, elemen grafis olahraga (bentuk diagonal, pola garis lintasan lari, atau ikon olahraga dari Lucide/Hugeicons). Tanpa gambar berat. |
| H-3 | Tombol **Masuk** → `/masuk`. |
| H-4 | Tombol **Install App** (lihat bagian PWA). |
| H-5 | Jika admin **sudah login**, teks tombol Masuk berubah menjadi **Kelola Nilai** dan mengarah ke `/dashboard`. |
| H-6 | Mendukung tema gelap/terang dan tampil baik di layar HP (portrait) maupun desktop. |
| H-7 | Seluruh teks dalam Bahasa Indonesia. |

**Contoh copy:** Headline "KELOLA NILAI PJOK, LEBIH CEPAT & RAPI." — Subheadline "Satu tempat untuk data siswa dan nilai Kelas 1–6."

### 4.2 PWA (Android & Desktop)

| ID | Kebutuhan |
|---|---|
| P-1 | Aplikasi memenuhi syarat installable: `manifest` (nama, `short_name`, `start_url: /dashboard` atau `/`, `display: standalone`, `theme_color`, `background_color`, ikon 192/512 dan maskable), service worker, dan HTTPS. |
| P-2 | Tombol **Install App** di hero hanya tampil ketika browser mengirim event `beforeinstallprompt` (Android Chrome & desktop Chrome/Edge). Klik tombol memanggil `prompt()` yang tersimpan. |
| P-3 | Tombol **disembunyikan** jika aplikasi sudah terpasang: terdeteksi lewat `matchMedia('(display-mode: standalone)')`, event `appinstalled`, atau `navigator.getInstalledRelatedApps()` bila tersedia. |
| P-4 | Tombol juga tidak ditampilkan jika browser tidak mendukung install (mis. iOS Safari). Opsional: tampilkan petunjuk "Tambahkan ke Layar Utama". |
| P-5 | Service worker menyimpan cache aset statis (app shell). Data nilai selalu diambil dari server (tidak di-cache agresif agar tidak basi). |
| P-6 | Aplikasi tampil layaknya aplikasi native saat dibuka dari ikon (tanpa address bar). |

### 4.3 Autentikasi

| ID | Kebutuhan |
|---|---|
| A-1 | Halaman `/masuk` dengan email + kata sandi (Supabase Auth), form `react-hook-form` + `zod`. |
| A-2 | Sesi disimpan lewat cookie (`@supabase/ssr`). Tombol **Keluar** tersedia di sidebar/menu pengguna. |
| A-3 | Pesan error dalam Bahasa Indonesia (mis. "Email atau kata sandi salah"). |
| A-4 | Akun admin dibuat manual; semua tabel dilindungi RLS yang hanya mengizinkan role admin. |

### 4.4 Layout Aplikasi & Sidebar

| ID | Kebutuhan |
|---|---|
| L-1 | Layout dashboard memakai komponen `Sidebar` shadcn. |
| L-2 | Sidebar **dapat di-collapse** (mode ikon) di desktop dan berupa `Sheet` di mobile. |
| L-3 | **Status collapse tersimpan** (cookie/localStorage, mis. `sidebar_state`) dan **dipulihkan saat aplikasi dibuka kembali**. Disarankan cookie agar status terbaca di server dan tidak terjadi kedipan (flash) saat render pertama. |
| L-4 | Menu: **Dashboard**, **Kelola Kelas** (dapat diperluas berisi daftar Kelas 1–6), **Nilai Siswa**, **Pengaturan**. |
| L-5 | Header berisi pemilih **periode aktif** (Select), tombol ganti tema, dan menu pengguna. |
| L-6 | Item menu aktif ditandai jelas; mendukung navigasi keyboard. |

### 4.5 Kelola Kelas & Data Siswa

**Rute:** `/dashboard/kelas` dan `/dashboard/kelas/[kelas]` (1–6).

| ID | Kebutuhan |
|---|---|
| K-1 | Menu **Kelola Kelas** menampilkan daftar Kelas 1 sampai 6 (sebagai submenu sidebar dan kartu ringkasan di halaman indeks: jumlah siswa, jumlah L/P). |
| K-2 | Klik sebuah kelas membuka **tabel siswa** kelas tersebut (`@tanstack/react-table`): pencarian (nama/NISN), pengurutan, paginasi. |
| K-3 | Admin dapat **menambah, mengubah, dan menghapus** siswa lewat `Dialog`/`Sheet` dengan form tervalidasi. Hapus memakai `AlertDialog` konfirmasi. |
| K-4 | **Data siswa:** NISN, Nama, Kelas, Jenis Kelamin. Jenis Kelamin **default kosong** (nilai: Laki-laki / Perempuan / kosong). |
| K-5 | Validasi: NISN wajib, hanya angka, **unik**; Nama wajib; Kelas wajib (1–6). |
| K-6 | Admin dapat **memindahkan siswa ke kelas lain** (mis. saat naik kelas) lewat edit data. |
| K-7 | Tersedia aksi **Impor CSV** (lihat 4.6) di halaman kelas dan halaman indeks. |

### 4.6 Impor Data Siswa via CSV

| ID | Kebutuhan |
|---|---|
| C-1 | Tombol **Impor CSV** membuka `Dialog` dengan area unggah file dan tombol **Unduh Template CSV**. |
| C-2 | Kolom CSV: `nisn`, `nama`, `kelas`, `jenis_kelamin`. Kolom `jenis_kelamin` boleh kosong; nilai yang diterima: `L`, `P`, `Laki-laki`, `Perempuan` (tidak peka huruf besar/kecil). |
| C-3 | Parsing di klien (`papaparse`): mendukung delimiter `,` dan `;`, encoding UTF-8 (termasuk BOM), dan header tidak peka huruf besar/kecil. |
| C-4 | Sebelum disimpan, tampilkan **pratinjau** dan hasil validasi per baris: valid, error (dengan alasan), dan duplikat NISN. |
| C-5 | Perilaku data yang sudah ada: **upsert berdasarkan NISN** (NISN sudah ada → data diperbarui; belum ada → ditambahkan). Baris error dilewati dan dilaporkan. |
| C-6 | Setelah selesai, tampilkan ringkasan: jumlah ditambah, diperbarui, dilewati, dan unduhan daftar baris gagal. |
| C-7 | Batas ukuran file 2 MB dan maksimal 1.000 baris per impor (cukup untuk sekolah dasar). |
| C-8 | Penyimpanan dilakukan dalam satu transaksi/batch agar konsisten. |

### 4.7 Nilai Siswa

**Rute:** `/dashboard/nilai` (dengan filter kelas, mengikuti periode aktif).

| ID | Kebutuhan |
|---|---|
| N-1 | Admin memilih **Kelas (1–6)** dan **Periode** (default periode aktif); tabel menampilkan seluruh siswa di kelas tersebut. |
| N-2 | Kolom tabel: **Nama**, **Kelas**, **Nilai Praktek**, **Nilai UH**, **Nilai ASTS**, **Nilai ASAS**, **Nilai Akhir**, **Predikat**, **Keterangan**. (NISN tersedia sebagai kolom opsional/tooltip.) |
| N-3 | Semua kolom nilai **kosong secara default** (bukan 0). Nilai berupa angka 0–100 (desimal opsional, maks. 2 digit). |
| N-4 | **Input inline** di sel tabel (`Input` shadcn), dapat berpindah sel dengan Tab/Enter/panah. Admin dapat mengisi sebagian kolom saja dan melengkapinya kapan saja. |
| N-5 | **Keterangan singkat** untuk siswa berupa teks (maks. 300 karakter) dengan penghitung karakter. Contoh: "Ananda sangat baik dalam memahami…". Tersedia `Dialog`/`Popover` untuk mengedit teks yang lebih panjang. |
| N-6 | Nilai dapat **diedit kapan pun** tanpa kunci, termasuk pada periode sebelumnya. |
| N-7 | **Simpan otomatis** (debounce ±800 ms) dengan indikator "Tersimpan ✓" / "Menyimpan…". Gagal simpan menampilkan toast error dan sel tetap ditandai belum tersimpan. |
| N-8 | Pencarian nama siswa dan filter "Belum ada nilai". |
| N-9 | Validasi: di luar 0–100 atau bukan angka ditolak dengan pesan jelas. |
| N-10 | Peringatan jika admin berpindah halaman saat masih ada perubahan belum tersimpan. |
| N-11 | **Nilai Akhir** dihitung otomatis dari rata-rata berbobot (Praktek × W₁ + UH × W₂ + ASTS × W₃ + ASAS × W₄). Bobot dapat diatur di Pengaturan (default masing-masing 25%). Nilai Akhir hanya tampil jika **semua** komponen terisi. |
| N-12 | **Predikat** otomatis berdasarkan KKM (default 75): **Tuntas** (≥ KKM) atau **Belum Tuntas** (< KKM). Ditampilkan sebagai `Badge` berwarna (hijau/merah). |
| N-13 | Tombol **Ekspor** di halaman nilai untuk mengunduh rekap kelas aktif ke Excel (.xlsx) atau PDF (lihat 4.10). |

### 4.8 Pengaturan

**Rute:** `/dashboard/pengaturan`

| ID | Kebutuhan |
|---|---|
| S-1 | **Kelola Periode:** daftar periode (Tahun Ajaran + Semester), tambah, ubah, hapus (hanya jika belum ada nilai), dan tetapkan **periode aktif**. |
| S-2 | Periode awal (seed): **Semester Ganjil 2026-2027** (aktif), **Semester Genap 2026-2027**. |
| S-3 | Tombol **Buat Periode Berikutnya** menghasilkan periode otomatis mengikuti kalender pendidikan (lihat 5.1): Genap 2026-2027 → Ganjil 2027-2028 → Genap 2027-2028, dan seterusnya. |
| S-4 | **Bobot Nilai Akhir:** admin dapat mengatur persentase bobot masing-masing komponen (Praktek, UH, ASTS, ASAS). Total bobot harus = 100%. Default: masing-masing 25%. |
| S-5 | **KKM (Kriteria Ketuntasan Minimal):** admin dapat mengatur nilai KKM. Default: **75**. Digunakan untuk menentukan predikat Tuntas/Belum Tuntas. |
| S-6 | Pengaturan lain (v1): tema (Sistem/Terang/Gelap), nama sekolah (opsional, tampil di header), ganti kata sandi, dan Reset status sidebar. |
| S-7 | Periode aktif tersimpan di database (satu periode aktif pada satu waktu) dan menjadi default di seluruh halaman. |

### 4.9 Dashboard (`/dashboard`)

> Dibangun **terakhir** pada roadmap, setelah data kelas, siswa, nilai, dan periode stabil.

| ID | Kebutuhan |
|---|---|
| D-1 | Kartu ringkasan: total siswa, jumlah siswa per kelas, persentase kelengkapan nilai pada periode aktif. |
| D-2 | Grafik (`recharts`): rata-rata Nilai Praktek/UH/ASTS/ASAS per kelas (bar chart); sebaran siswa laki-laki vs perempuan. |
| D-3 | Daftar "Perlu Dilengkapi": kelas atau siswa yang nilainya masih kosong. |
| D-4 | Pintasan cepat: Impor CSV, Input Nilai, Tambah Siswa. |
| D-5 | Mengikuti periode aktif; dapat diganti lewat pemilih periode di header. |

### 4.10 Ekspor Nilai

**Tersedia di:** halaman Nilai Siswa (`/dashboard/nilai`) dan Dashboard.

| ID | Kebutuhan |
|---|---|
| E-1 | Tombol **Ekspor** dengan pilihan format: **Excel (.xlsx)** dan **PDF**. |
| E-2 | Ekspor mencakup: Nama, NISN, Kelas, Nilai Praktek, Nilai UH, Nilai ASTS, Nilai ASAS, **Nilai Akhir**, **Predikat**, dan Keterangan. |
| E-3 | Ekspor mengikuti **kelas dan periode** yang sedang ditampilkan. |
| E-4 | File Excel: satu sheet per kelas (jika ekspor semua kelas), header tabel terformat, dan baris ringkasan (rata-rata, jumlah tuntas/belum tuntas). |
| E-5 | File PDF: tabel terformat rapi dengan header nama sekolah (jika diisi di Pengaturan), kelas, dan periode. Orientasi landscape untuk memuat semua kolom. |
| E-6 | Nama file otomatis: `Nilai_PJOK_Kelas{N}_{Periode}.xlsx` / `.pdf`. |
| E-7 | Tampilkan indikator loading saat membuat file; file diunduh otomatis setelah selesai. |

### 4.11 Naik Kelas Massal

**Rute:** `/dashboard/pengaturan` atau `/dashboard/kelas` (aksi khusus).

| ID | Kebutuhan |
|---|---|
| NK-1 | Tombol **Naik Kelas Massal** tersedia di halaman Pengaturan atau Kelola Kelas. |
| NK-2 | Klik tombol memindahkan **seluruh siswa** dari Kelas N ke Kelas N+1 (Kelas 1→2, 2→3, …, 5→6). |
| NK-3 | Siswa Kelas 6 **tidak dipindahkan** (tetap di Kelas 6 atau ditandai lulus). Admin diminta konfirmasi terpisah untuk menangani siswa Kelas 6 (hapus/arsip/tetap). |
| NK-4 | Sebelum eksekusi, tampilkan **pratinjau** jumlah siswa per kelas yang akan dipindahkan dan minta konfirmasi lewat `AlertDialog`. |
| NK-5 | Proses dilakukan dalam satu transaksi. Jika gagal, tidak ada perubahan yang diterapkan. |
| NK-6 | Setelah berhasil, tampilkan ringkasan: jumlah siswa yang dipindahkan per kelas. |
| NK-7 | Fitur ini **tidak memengaruhi** catatan nilai yang sudah ada (karena `kelas_saat_nilai` sudah disalin ke tabel `grades`). |

---

## 5. Aturan Bisnis

### 5.1 Periode Tahun Ajaran

- Tahun ajaran mengikuti kalender pendidikan pemerintah dan **dimulai bulan Juli**.
- **Semester Ganjil:** Juli – Desember (tahun pertama). **Semester Genap:** Januari – Juni (tahun kedua).
- Format penamaan: `Semester {Ganjil|Genap} {TahunMulai}-{TahunSelesai}`, mis. *Semester Ganjil 2026-2027*.
- Periode pertama yang aktif: **Semester Ganjil 2026-2027**.
- Urutan berikutnya: Genap 2026-2027 → Ganjil 2027-2028 → Genap 2027-2028 → dst.
- Nilai disimpan **per periode**; berpindah periode tidak menghapus atau mengubah nilai periode lain.
- Kombinasi (tahun ajaran, semester) harus unik.

### 5.2 Kelas & Siswa

- Kelas bernilai 1–6 (tanpa rombel/paralel pada v1).
- NISN bersifat unik secara global.
- Kelas siswa pada saat nilai diinput disalin ke catatan nilai (`kelas_saat_nilai`), sehingga riwayat nilai tetap benar meskipun siswa naik kelas.
- Menghapus siswa yang sudah memiliki nilai membutuhkan konfirmasi tambahan (nilai ikut terhapus).

### 5.3 Nilai & Nilai Akhir

- Rentang nilai 0–100; kosong berarti belum diinput (berbeda dari 0).
- Satu catatan nilai per siswa per periode (`unique(student_id, period_id)`).
- **Nilai Akhir** = (Nilai Praktek × Bobot Praktek) + (Nilai UH × Bobot UH) + (Nilai ASTS × Bobot ASTS) + (Nilai ASAS × Bobot ASAS), dibulatkan 2 desimal.
- Bobot default: masing-masing **25%** (total 100%). Admin dapat mengubah bobot di Pengaturan.
- Nilai Akhir hanya dihitung jika **keempat komponen** sudah terisi; jika ada yang kosong, Nilai Akhir ditampilkan kosong.
- **KKM** (Kriteria Ketuntasan Minimal) default **75**. Predikat: **Tuntas** jika Nilai Akhir ≥ KKM, **Belum Tuntas** jika < KKM.
- Nilai Akhir dihitung secara otomatis (computed) dan disimpan di kolom `nilai_akhir` pada tabel `grades` untuk kemudahan query dan ekspor.
- Penyimpanan nilai menggunakan **simpan otomatis** (debounce ±800 ms) dengan indikator status.

---

## 6. Model Data (Supabase PostgreSQL)

### `periods`
| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid PK | |
| tahun_mulai | int | mis. 2026 |
| semester | text | `ganjil` \| `genap` |
| nama | text | mis. "Semester Ganjil 2026-2027" |
| is_active | boolean | hanya satu `true` (partial unique index) |
| created_at | timestamptz | |

Unik: `(tahun_mulai, semester)`.

### `students`
| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid PK | |
| nisn | text | unik, hanya angka |
| nama | text | wajib |
| kelas | smallint | check 1–6 |
| jenis_kelamin | text null | `L` \| `P` \| null (default null) |
| created_at / updated_at | timestamptz | |

### `grades`
| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid PK | |
| student_id | uuid FK → students (on delete cascade) | |
| period_id | uuid FK → periods | |
| kelas_saat_nilai | smallint | snapshot kelas |
| nilai_praktek | numeric(5,2) null | check 0–100 |
| nilai_uh | numeric(5,2) null | check 0–100 |
| nilai_asts | numeric(5,2) null | check 0–100 |
| nilai_asas | numeric(5,2) null | check 0–100 |
| nilai_akhir | numeric(5,2) null | dihitung otomatis dari bobot; check 0–100 |
| predikat | text null | `Tuntas` \| `Belum Tuntas`; dihitung berdasarkan KKM |
| keterangan | text null | maks. 300 karakter |
| updated_at | timestamptz | |

Unik: `(student_id, period_id)`.

### `settings`
| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid PK | singleton row |
| nama_sekolah | text null | tampil di header dan ekspor PDF |
| kkm | numeric(5,2) | default 75 |
| bobot_praktek | numeric(5,2) | default 25 (persen) |
| bobot_uh | numeric(5,2) | default 25 (persen) |
| bobot_asts | numeric(5,2) | default 25 (persen) |
| bobot_asas | numeric(5,2) | default 25 (persen) |
| updated_at | timestamptz | |

Konstraint: `bobot_praktek + bobot_uh + bobot_asts + bobot_asas = 100`.

### `profiles` (opsional, untuk role)
| Kolom | Tipe |
|---|---|
| id | uuid PK (= auth.users.id) |
| role | text (`admin`) |

**RLS:** semua tabel hanya dapat dibaca/ditulis oleh pengguna terautentikasi dengan role `admin`.

---

## 7. UI/UX

### 7.1 Prinsip

- **Tema sporty** pada identitas visual (warna, tipografi, aksen), tetapi **komponen tetap reusable** berbasis shadcn.
- Teks UI seluruhnya **Bahasa Indonesia** (label, placeholder, toast, error, empty state).
- Mobile-first; tabel lebar dapat digulir horizontal pada layar kecil dengan kolom Nama tetap terlihat (sticky).

### 7.2 Design Token (diatur lewat CSS variables shadcn)

| Token | Arah |
|---|---|
| `--primary` | Oranye/merah energik (aksi utama) |
| `--accent` | Hijau lime/biru stadion (aksen dan chart) |
| `--radius` | Sedang–tegas (sporty namun rapi) |
| Heading | Font bold condensed, huruf kapital untuk hero dan judul halaman |
| Body | Sans-serif netral, mudah dibaca |

Semua warna didefinisikan untuk **mode terang dan gelap**; pengaturan warna hanya lewat token, bukan hard-code di komponen.

### 7.3 Tema Terang/Gelap

- Default **mengikuti perangkat** (`system`) memakai `next-themes`.
- Pengguna dapat memilih Terang / Gelap / Sistem; pilihan tersimpan.
- Tanpa kedipan tema saat muat awal (`suppressHydrationWarning`, script bawaan next-themes).

### 7.4 Komponen shadcn yang Dipakai

`Button`, `Input`, `Form`, `Label`, `Select`, `Table`, `Dialog`, `AlertDialog`, `Sheet`, `Sidebar`, `Tabs`, `Card`, `Badge`, `Skeleton`, `Tooltip`, `DropdownMenu`, `Popover`, `Command`, `Sonner (Toast)`, `Textarea`, `Separator`, `Breadcrumb`.

Komponen komposisi reusable (dibangun dari primitif di atas): `PageHeader`, `DataTable`, `EmptyState`, `PeriodSelect`, `ClassSelect`, `CsvImportDialog`, `GradeCell`, `InstallAppButton`, `ThemeToggle`, `ExportButton`, `NaikKelasDialog`, `WeightSettingsForm`.

---

## 8. Kebutuhan Non-Fungsional

| Aspek | Target |
|---|---|
| Performa | LCP hero < 2,5 dtk pada 4G; Lighthouse Performance ≥ 90 |
| PWA | Lighthouse PWA/Installable lulus |
| Responsif | 360 px s.d. layar desktop lebar |
| Aksesibilitas | Kontras WCAG AA, navigasi keyboard, label ARIA bawaan Radix |
| Keamanan | RLS aktif di semua tabel, validasi di klien (zod) **dan** server, tidak ada kunci `service_role` di klien |
| Keandalan | Penyimpanan nilai idempoten (upsert); indikator status simpan |
| Bahasa | Seluruh teks UI Bahasa Indonesia |
| Kompatibilitas | Chrome/Edge (Android & desktop) terbaru; Safari/Firefox tetap dapat dipakai sebagai web biasa |
| Deploy | Vercel (preview per branch, production dari `main`) |

---

## 9. Roadmap Pengerjaan

| Fase | Cakupan | Keluaran |
|---|---|---|
| **0. Fondasi** | Setup Next.js 16, Tailwind 4, shadcn, tema terang/gelap, font, Supabase client, `proxy.ts` | Kerangka proyek siap |
| **1. Auth & Layout** | Halaman Masuk, proteksi rute, layout dashboard, sidebar collapsible + persistensi status | Admin dapat login dan berpindah menu |
| **2. Periode & Pengaturan** | Skema `periods` + `settings`, seed Ganjil/Genap 2026-2027, CRUD periode, periode aktif, pemilih periode, pengaturan bobot & KKM | Periode dan pengaturan berjalan |
| **3. Kelola Kelas & Siswa** | Daftar Kelas 1–6, tabel siswa, CRUD siswa | Data siswa terkelola |
| **4. Impor CSV** | Template, parsing, pratinjau, validasi, upsert | Impor massal berfungsi |
| **5. Nilai Siswa** | Tabel nilai inline per kelas/periode, keterangan, simpan otomatis, Nilai Akhir & predikat otomatis | Input, edit, dan perhitungan nilai |
| **5b. Ekspor & Naik Kelas** | Ekspor nilai ke Excel/PDF, naik kelas massal | Ekspor dan manajemen kenaikan kelas |
| **6. Hero & PWA** | Hero sporty tanpa scroll, tombol Masuk/Kelola Nilai, manifest, service worker, tombol Install App | Dapat dipasang di Android & desktop |
| **7. Dashboard** | Kartu ringkasan, grafik, daftar "Perlu Dilengkapi" | Dashboard final |
| **8. QA & Rilis** | Uji lintas perangkat, Lighthouse, perbaikan, deploy produksi | Rilis v1 |

---

## 10. Kriteria Penerimaan (Acceptance Criteria)

1. **Hero:** Pada layar HP dan desktop, hero tampil penuh tanpa scroll. Belum login → tombol "Masuk"; sudah login → tombol "Kelola Nilai" menuju `/dashboard`.
2. **PWA:** Tombol "Install App" muncul di browser yang mendukung; setelah dipasang, tombol hilang saat dibuka kembali (termasuk di mode standalone).
3. **Sidebar:** Setelah di-collapse lalu halaman dimuat ulang atau aplikasi ditutup dan dibuka lagi, status collapse sama seperti sebelumnya.
4. **Periode:** Periode "Semester Ganjil 2026-2027" aktif secara default; admin dapat membuat Genap 2026-2027 dan periode berikutnya sesuai urutan.
5. **Kelas:** Kelas 1–6 tampil; klik kelas menampilkan siswa kelas tersebut; admin dapat tambah/ubah/hapus siswa. Jenis Kelamin default kosong.
6. **CSV:** File CSV valid diimpor dengan pratinjau; NISN duplikat memperbarui data; baris tidak valid dilaporkan tanpa menggagalkan baris lain.
7. **Nilai:** Kolom Nilai Praktek/UH/ASTS/ASAS kosong secara default; dapat diisi sebagian dan diedit kapan pun; keterangan tersimpan; nilai di luar 0–100 ditolak. Simpan otomatis dengan indikator status.
8. **Nilai Akhir:** Jika keempat komponen terisi, Nilai Akhir dihitung otomatis sesuai bobot. Predikat Tuntas/Belum Tuntas muncul berdasarkan KKM (default 75).
9. **Ekspor:** Admin dapat mengunduh rekap nilai per kelas/periode dalam format Excel (.xlsx) dan PDF. File berisi seluruh komponen nilai termasuk Nilai Akhir dan predikat.
10. **Naik Kelas:** Admin dapat memindahkan seluruh siswa naik satu tingkat secara massal. Siswa Kelas 6 ditangani terpisah. Nilai historis tidak berubah.
11. **Riwayat:** Berpindah periode menampilkan nilai periode tersebut tanpa memengaruhi periode lain.
12. **Tema:** Default mengikuti perangkat; dapat diganti ke terang/gelap dan tersimpan.
13. **Akses:** Pengguna yang belum login tidak dapat membuka `/dashboard/*` maupun membaca data lewat API.
14. **UI:** Semua teks berbahasa Indonesia dan seluruh komponen berbasis shadcn.

---

## 11. Asumsi

- Sekolah dasar, satu guru PJOK sebagai satu-satunya admin.
- Tidak ada rombel (1A/1B); hanya Kelas 1–6.
- Nilai berskala 0–100.
- Tahun ajaran dimulai Juli sesuai kalender pendidikan nasional.

## 12. Pertanyaan Terbuka (Terjawab)

| # | Pertanyaan | Keputusan | Dampak pada PRD |
|---|---|---|---|
| 1 | Apakah perlu Nilai Akhir? | ✅ **Ya** — rata-rata berbobot, bobot diatur admin (default 25%), KKM default 75. | Ditambahkan ke §4.7 (N-11, N-12), §4.8 (S-4, S-5), §5.3, §6 (`grades.nilai_akhir`, `settings`). |
| 2 | Apakah perlu rombel? | ❌ **Tidak** | Tetap di Non-Goals (§1.3). |
| 3 | Apakah perlu ekspor nilai? | ✅ **Ya** — Excel (.xlsx) dan PDF. | Ditambahkan sebagai §4.10 Ekspor Nilai, tech stack (`exceljs`, `jspdf`). |
| 4 | Apakah perlu naik kelas massal? | ✅ **Ya** | Ditambahkan sebagai §4.11 Naik Kelas Massal. |
| 5 | Preferensi simpan nilai? | ✅ **Simpan otomatis** (debounce ±800 ms) | Dikonfirmasi di §4.7 (N-7), §5.3. |
| 6 | Apakah perlu mode offline? | ❌ **Tidak** | Tetap di Non-Goals (§1.3). |