-- Migration: create_students
-- Creates the students table

create table if not exists public.students (
  id             uuid primary key default gen_random_uuid(),
  nisn           text    not null,
  nama           text    not null,
  kelas          smallint not null check (kelas between 1 and 6),
  jenis_kelamin  text    null check (jenis_kelamin in ('L', 'P')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- NISN must be globally unique and contain only digits
  constraint students_nisn_unique unique (nisn),
  constraint students_nisn_digits check (nisn ~ '^[0-9]+$')
);

comment on table public.students is 'Siswa Kelas 1-6';
comment on column public.students.nisn is 'Nomor Induk Siswa Nasional; string of digits, globally unique';
comment on column public.students.kelas is 'Kelas 1-6 (no rombel in v1)';
comment on column public.students.jenis_kelamin is 'L = Laki-laki, P = Perempuan, null = belum diisi';
