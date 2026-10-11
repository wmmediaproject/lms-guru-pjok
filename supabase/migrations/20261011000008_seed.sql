-- Migration: seed
-- Initial seed data for the application:
-- 1. Two periods: Ganjil 2026-2027 (active) & Genap 2026-2027 (inactive)
-- 2. Default singleton row in settings (KKM 75, weights 25/25/25/25)
-- 3. Admin profile in profiles for the admin user in auth.users

-- ============================================================
-- 1. Seed: periods
-- ============================================================
insert into public.periods (id, tahun_mulai, semester, nama, is_active)
values
  (
    'a1b2c3d4-0001-0001-0001-000000000001',
    2026,
    'ganjil',
    'Semester Ganjil 2026-2027',
    true
  ),
  (
    'a1b2c3d4-0002-0002-0002-000000000002',
    2026,
    'genap',
    'Semester Genap 2026-2027',
    false
  )
on conflict (tahun_mulai, semester) do nothing;

-- ============================================================
-- 2. Seed: settings (singleton)
-- Default weights 25/25/25/25 and KKM = 75
-- ============================================================
insert into public.settings (
  id,
  nama_sekolah,
  kkm,
  bobot_praktek,
  bobot_uh,
  bobot_asts,
  bobot_asas
)
values (
  'b2c3d4e5-0001-0001-0001-000000000001',
  null,
  75,
  25,
  25,
  25,
  25
)
on conflict (id) do nothing;

-- ============================================================
-- 3. Seed: profiles (admin)
-- Assigns admin role to the existing user in auth.users
-- ============================================================
insert into public.profiles (id, role)
select id, 'admin'
from auth.users
order by created_at asc
limit 1
on conflict (id) do nothing;
