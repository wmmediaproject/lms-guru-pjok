-- Migration: create_settings
-- Singleton settings table for KKM and grade weights

create table if not exists public.settings (
  id            uuid primary key default gen_random_uuid(),
  nama_sekolah  text    null,
  kkm           numeric(5,2) not null default 75,
  bobot_praktek numeric(5,2) not null default 25,
  bobot_uh      numeric(5,2) not null default 25,
  bobot_asts    numeric(5,2) not null default 25,
  bobot_asas    numeric(5,2) not null default 25,
  updated_at    timestamptz not null default now(),

  -- All weights must sum to exactly 100
  constraint settings_bobot_total_100
    check (bobot_praktek + bobot_uh + bobot_asts + bobot_asas = 100),

  -- KKM must be a valid grade range
  constraint settings_kkm_range
    check (kkm between 0 and 100),

  -- Individual weights must be in range
  constraint settings_bobot_range
    check (
      bobot_praktek between 0 and 100 and
      bobot_uh      between 0 and 100 and
      bobot_asts    between 0 and 100 and
      bobot_asas    between 0 and 100
    )
);

comment on table public.settings is 'Singleton row for app-wide settings (KKM and grade weights).';
comment on column public.settings.kkm is 'Kriteria Ketuntasan Minimal, default 75';
comment on column public.settings.bobot_praktek is 'Bobot nilai praktek (persen, total semua bobot = 100)';
