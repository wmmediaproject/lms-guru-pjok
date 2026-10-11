-- Migration: create_grades
-- Creates the grades table with value constraints and FK cascade

create table if not exists public.grades (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.students (id) on delete cascade,
  period_id        uuid not null references public.periods (id) on delete restrict,
  kelas_saat_nilai smallint not null check (kelas_saat_nilai between 1 and 6),

  -- Component grades: nullable (null ≠ 0; means "not yet entered")
  nilai_praktek    numeric(5,2) null check (nilai_praktek between 0 and 100),
  nilai_uh         numeric(5,2) null check (nilai_uh between 0 and 100),
  nilai_asts       numeric(5,2) null check (nilai_asts between 0 and 100),
  nilai_asas       numeric(5,2) null check (nilai_asas between 0 and 100),

  -- Computed and stored; null when any component is missing
  nilai_akhir      numeric(5,2) null check (nilai_akhir between 0 and 100),
  predikat         text null check (predikat in ('Tuntas', 'Belum Tuntas')),

  keterangan       text null check (char_length(keterangan) <= 300),
  updated_at       timestamptz not null default now(),

  constraint grades_student_period_unique unique (student_id, period_id)
);

create index if not exists grades_student_id_idx on public.grades (student_id);
create index if not exists grades_period_id_idx  on public.grades (period_id);

comment on table public.grades is 'Nilai siswa per periode. Null pada komponen berarti belum diinput (bukan 0).';
comment on column public.grades.kelas_saat_nilai is 'Snapshot kelas siswa saat nilai diinput; tidak berubah saat naik kelas';
comment on column public.grades.nilai_akhir is 'Dihitung: Σ(komponen × bobot/100), dibulatkan 2 desimal. Null jika ada komponen kosong.';
