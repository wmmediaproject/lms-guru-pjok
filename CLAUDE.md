# LMS Guru PJOK — Aturan Proyek

Aplikasi web + PWA untuk guru PJOK (admin tunggal) mengelola siswa Kelas 1–6, nilai, periode semester, ekspor, dan naik kelas.

**Sumber kebenaran:** @prd.md (apa yang dibangun) dan @roadmap.md (urutan fase dan prompt).  
Jika ada konflik, PRD menang. Jika PRD ambigu atau belum memutuskan sesuatu, **berhenti dan TANYA dulu**; jangan menebak.

---

## 1. Stack

Next.js 16.2.7 (App Router), React 19.2.4, TypeScript strict, Tailwind 4, shadcn/ui, Supabase (@supabase/ssr), TanStack Query + Table, zustand, react-hook-form + zod, recharts, sonner, next-themes. Tambahan: papaparse, exceljs, jspdf + jspdf-autotable. Deploy Vercel.

| Area | Teknologi |
|---|---|
| Framework | Next.js 16.2.7 (App Router), React 19.2.4, TypeScript strict |
| Styling & UI | Tailwind 4, shadcn/ui, radix-ui, lucide-react, @hugeicons/react |
| Backend | Supabase (PostgreSQL, Auth, RLS) via `@supabase/ssr` + `@supabase/supabase-js` |
| Data klien | @tanstack/react-query, @tanstack/react-table, zustand |
| Form & validasi | react-hook-form, @hookform/resolvers, zod |
| Chart & toast | recharts, sonner |
| Tema | next-themes, @teispace/next-themes |
| Tambahan (disetujui PRD §3.2) | papaparse, exceljs, jspdf + jspdf-autotable |
| Tes | Vitest (unit), Playwright (e2e) |
| Deploy | Vercel |

Package manager: **pnpm**. Jangan menambah dependensi di luar PRD tanpa konfirmasi.

---

## 2. Perintah

`pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test`

```bash
pnpm dev          # server pengembangan
pnpm build        # build produksi
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest (unit)
pnpm test:e2e     # Playwright (e2e)
```

---

## 3. Aturan Wajib

### 11 Aturan Utama
1. **SEMUA UI memakai komponen shadcn.** Komponen custom hanya komposisi primitif shadcn/Radix. Tambah komponen lewat CLI shadcn, jangan menulis ulang primitifnya.
2. **SEMUA teks UI Bahasa Indonesia** (label, placeholder, toast, error, empty state, `aria-label`). Kode, nama variabel, dan komentar boleh Bahasa Inggris; nama domain boleh Indonesia (`nilai`, `kelas`, `periode`).
3. **Warna hanya lewat CSS variables/token tema** (`--primary`, `--accent`, dst.). Jangan hard-code warna.
4. **Tema terang/gelap**, default mengikuti perangkat (`system`), tanpa kedip saat muat.
5. **Proteksi rute memakai `proxy.ts`** (Next.js 16), **bukan** `middleware.ts`.
6. **Jangan pakai service_role key di kode klien.** RLS aktif di semua tabel; hanya admin terautentikasi yang boleh baca/tulis. Jangan menaruhnya di variabel `NEXT_PUBLIC_*`.
7. **Validasi zod di klien DAN server.** Skema zod dibagi pakai satu sumber (`src/lib/validators`).
8. **Perubahan skema DB hanya lewat file baru di `supabase/migrations/`;** jangan edit migrasi lama.
9. **Logika hitung (Nilai Akhir, predikat, periode berikutnya, parser CSV) = fungsi murni + unit test.** Hasil versi TypeScript dan versi DB (trigger) harus identik.
10. **Satu fase per sesi.** Jangan mengerjakan fase berikutnya sebelum diminta.
11. **Tidak menambah dependensi di luar PRD tanpa konfirmasi.**

### Detail UI, Tampilan & PWA
- **Tema visual sporty:** heading bold condensed huruf kapital, `--radius` tegas, aksen energik. Tetap rapi dan terbaca.
- **Mobile-first:** dioptimalkan mulai 360 px. Tabel lebar bisa digulir horizontal dengan kolom Nama sticky.
- **Aksesibilitas status:** status penting (Tuntas/Belum Tuntas, tersimpan/gagal) tidak boleh hanya dibedakan dengan warna; sertakan teks atau ikon.
- **Hero landing page (`/`):** setinggi layar (`h-dvh`), tanpa scroll. Tombol Masuk berubah menjadi **Kelola Nilai** (`/dashboard`) saat sudah login.
- **PWA & Install App:** tombol Install App hanya tampil bila browser mendukung dan aplikasi belum terpasang; hilang setelah terpasang atau saat berjalan standalone.
- **Service worker:** hanya meng-cache aset statis; **jangan cache data nilai/API**.
- **Sidebar:** status collapse sidebar tersimpan (cookie `sidebar_state`, dibaca di server) dan dipulihkan saat aplikasi dibuka kembali.

### Detail Data, Mutasi & Keamanan
- **Transaksi atomic:** mutasi memakai Server Actions/Route Handlers; operasi multi-baris (impor CSV, naik kelas) **dalam satu transaksi (RPC)** sehingga gagal = tidak ada perubahan.
- **Akses khusus admin:** tidak ada akun/registrasi publik. Jangan membuat fitur untuk peran selain admin.

### Detail Logika Bisnis & Domain PJOK
- **Nilai kosong ≠ 0:** kolom nilai default `null`. Nilai Akhir hanya dihitung jika keempat komponen (Praktek, UH, ASTS, ASAS) terisi.
- **Perhitungan Nilai Akhir:** Nilai Akhir = Σ(komponen × bobot), bulat 2 desimal. Predikat **Tuntas** jika ≥ KKM, selain itu **Belum Tuntas**. Bobot dan KKM dari tabel `settings` (default 25/25/25/25 dan 75; total bobot harus 100).
- **Sinkronisasi settings:** saat `settings` berubah, `nilai_akhir` dan `predikat` semua `grades` dihitung ulang (di DB).
- **Format NISN:** NISN selalu string (jangan konversi ke angka; nol di depan harus utuh), unik secara global.
- **Kelas siswa:** kelas bernilai 1–6 (tanpa rombel). Saat nilai disimpan, salin kelas siswa ke `grades.kelas_saat_nilai`; naik kelas **tidak boleh** mengubah catatan `grades`.
- **Format periode:** mengikuti tahun ajaran (Ganjil = Juli–Desember, Genap = Januari–Juni); format nama `Semester {Ganjil|Genap} {TahunMulai}-{TahunSelesai}`. Hanya **satu** periode aktif. Periode awal: Ganjil 2026-2027 (aktif), Genap 2026-2027.
- **Edit & Simpan Otomatis:** nilai disimpan per periode dan **selalu bisa diedit**, termasuk periode lama (tanpa kunci). Penyimpanan nilai memakai **simpan otomatis** (debounce ±800 ms, upsert `(student_id, period_id)`) dengan indikator status.

---

## 4. Definition of Done (Tiap Fase)

typecheck + lint + build + test lulus; fitur diuji manual sesuai kriteria fase; tulis ringkasan (selesai / diuji / butuh keputusan); commit Conventional Commits.

Kriteria lengkap:
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` lulus tanpa error.
- Fitur diuji manual sesuai bagian "Verifikasi" fase tersebut (tema terang & gelap, 360 px & desktop).
- RLS tetap menolak akses anonim.
- Ringkasan akhir berisi: **apa yang selesai**, **apa yang diuji**, **hal yang butuh keputusan**.
- Commit menggunakan Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).

---

## 5. Struktur Folder

```
src/
  app/                    # rute App Router (/, /masuk, /dashboard/...)
  components/
    ui/                   # primitif shadcn (hasil CLI)
    shared/               # komposisi reusable: PageHeader, DataTable, EmptyState,
                          # PeriodSelect, ClassSelect, ConfirmDialog, ThemeToggle, ...
  features/               # kelas, siswa, nilai, periode, pengaturan, dashboard
                          # (komponen, actions, hooks khusus fitur)
  lib/
    supabase/             # client.ts, server.ts, tipe DB
    validators/           # skema zod bersama
    hitung/               # fungsi murni (periode, nilai akhir, predikat) + tes
    csv/                  # parser & normalisasi + tes
    ekspor/               # pembentuk data & nama file ekspor + tes
  hooks/  stores/
supabase/migrations/      # file SQL bertanggal, hanya ditambah, tidak diubah
```

---

## 6. Gaya Kode

- **TypeScript strict:** hindari `any` (pakai `unknown` + zod). Tipe DB di-generate dari Supabase, bukan ditulis tangan.
- **Server Components default:** `"use client"` hanya bila perlu interaksi/hook.
- **TanStack Query:** pembacaan data interaktif lewat TanStack Query (kunci query konsisten: `['siswa', kelas]`, `['nilai', kelas, periodeId]`, dst.); invalidasi setelah mutasi.
- **Form & Validasi:** RHF + zod; pesan error validasi Bahasa Indonesia.
- **Dynamic import:** pustaka berat (`exceljs`, `jspdf`) dimuat dengan dynamic import saat dipakai.
- **Komit:** memakai Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).

---

## 7. Cara Kerja per Fase

1. **Satu fase = satu sesi = satu branch (`feat/NN-nama`) = satu PR.** Jangan mengerjakan fase berikutnya sebelum diminta.
2. Mulai dengan **Plan Mode**; minta persetujuan sebelum mengubah skema DB atau mengambil keputusan produk.
3. Kerjakan hanya cakupan fase di @roadmap.md; catat hal di luar cakupan sebagai saran, jangan langsung dibuat.
4. Penuhi semua kriteria pada **Definition of Done** sebelum menyelesaikan sesi.

---

## 8. Keputusan yang Masih Terbuka

- **Penanganan siswa Kelas 6 saat naik kelas** (PRD NK-3 belum memilih).  
  Rekomendasi: kolom `students.status` (`aktif` | `lulus`), Kelas 6 ditandai `lulus`, tidak dihapus.  
  👉 **Tanyakan kepada pemilik proyek sebelum mengerjakan Fase 7B.**

---

## 9. Jangan Dilakukan (Non-Goals & Larangan)

- Menambah fitur di luar Non-Goals PRD §1.3: login selain admin, absensi/jadwal/materi, cetak rapor resmi, mode offline penuh, rombel.
- Menyimpan atau mencetak kredensial, `service_role`, atau data siswa nyata ke repo, log, atau tes.
- Memakai data siswa nyata sebagai seed; gunakan data fiktif.
- Menghapus atau menimpa migrasi lama, atau menonaktifkan RLS untuk "mempermudah" pengembangan.