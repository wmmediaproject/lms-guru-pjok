-- Migration: create_periods
-- Creates the periods table with required constraints

create table if not exists public.periods (
  id          uuid primary key default gen_random_uuid(),
  tahun_mulai integer not null,
  semester    text    not null check (semester in ('ganjil', 'genap')),
  nama        text    not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),

  constraint periods_tahun_semester_unique unique (tahun_mulai, semester)
);

-- Partial unique index: only one period can be active at a time
create unique index if not exists periods_one_active_idx
  on public.periods (is_active)
  where is_active = true;

comment on table public.periods is 'Semester periods. Only one period can be active at a time.';
comment on column public.periods.tahun_mulai is 'Year the period starts, e.g. 2026 for TA 2026-2027';
comment on column public.periods.semester is 'ganjil (Jul-Dec) or genap (Jan-Jun)';
comment on column public.periods.is_active is 'Only one row may be true (enforced by partial unique index)';
