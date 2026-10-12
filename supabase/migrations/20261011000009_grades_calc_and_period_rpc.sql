-- Migration: grades_calc_and_period_rpc
-- 1. Pure DB functions hitung_nilai_akhir & tentukan_predikat (identical to TS logic)
-- 2. Trigger on public.grades to auto-compute nilai_akhir & predikat before insert/update
-- 3. Trigger on public.settings to recompute all rows in public.grades when weights or KKM change
-- 4. Atomic RPC public.set_active_period(p_period_id uuid)

-- ============================================================
-- 1. Fungsi murni DB: hitung_nilai_akhir
-- Menghasilkan NULL apabila salah satu dari keempat komponen bernilai NULL.
-- Jika keempat komponen terisi, hitung rata-rata tertimbang dan bulatkan 2 desimal.
-- ============================================================
create or replace function public.hitung_nilai_akhir(
  p_praktek numeric,
  p_uh numeric,
  p_asts numeric,
  p_asas numeric,
  p_bobot_praktek numeric,
  p_bobot_uh numeric,
  p_bobot_asts numeric,
  p_bobot_asas numeric
)
returns numeric
language sql
immutable
as $$
  select case
    when p_praktek is null
      or p_uh is null
      or p_asts is null
      or p_asas is null
    then null
    else round(
      (
        p_praktek * p_bobot_praktek +
        p_uh      * p_bobot_uh +
        p_asts    * p_bobot_asts +
        p_asas    * p_bobot_asas
      ) / 100.0,
      2
    )
  end;
$$;

-- ============================================================
-- 2. Fungsi murni DB: tentukan_predikat
-- Menghasilkan NULL bila nilai_akhir NULL, 'Tuntas' bila >= KKM, 'Belum Tuntas' bila < KKM.
-- ============================================================
create or replace function public.tentukan_predikat(
  p_nilai_akhir numeric,
  p_kkm numeric
)
returns text
language sql
immutable
as $$
  select case
    when p_nilai_akhir is null then null
    when p_nilai_akhir >= p_kkm then 'Tuntas'
    else 'Belum Tuntas'
  end;
$$;

-- ============================================================
-- 3. Trigger BEFORE INSERT OR UPDATE pada public.grades
-- Menghitung otomatis nilai_akhir & predikat memakai pengaturan aktif di public.settings
-- ============================================================
create or replace function public.grades_compute_nilai_akhir_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bobot_praktek numeric := 25;
  v_bobot_uh      numeric := 25;
  v_bobot_asts    numeric := 25;
  v_bobot_asas    numeric := 25;
  v_kkm           numeric := 75;
begin
  select
    bobot_praktek,
    bobot_uh,
    bobot_asts,
    bobot_asas,
    kkm
  into
    v_bobot_praktek,
    v_bobot_uh,
    v_bobot_asts,
    v_bobot_asas,
    v_kkm
  from public.settings
  limit 1;

  v_bobot_praktek := coalesce(v_bobot_praktek, 25);
  v_bobot_uh      := coalesce(v_bobot_uh, 25);
  v_bobot_asts    := coalesce(v_bobot_asts, 25);
  v_bobot_asas    := coalesce(v_bobot_asas, 25);
  v_kkm           := coalesce(v_kkm, 75);

  new.nilai_akhir := public.hitung_nilai_akhir(
    new.nilai_praktek,
    new.nilai_uh,
    new.nilai_asts,
    new.nilai_asas,
    v_bobot_praktek,
    v_bobot_uh,
    v_bobot_asts,
    v_bobot_asas
  );

  new.predikat := public.tentukan_predikat(new.nilai_akhir, v_kkm);

  return new;
end;
$$;

drop trigger if exists grades_compute_before_write on public.grades;
create trigger grades_compute_before_write
  before insert or update of nilai_praktek, nilai_uh, nilai_asts, nilai_asas
  on public.grades
  for each row
  execute function public.grades_compute_nilai_akhir_trigger();

-- ============================================================
-- 4. Trigger AFTER UPDATE pada public.settings
-- Menghitung ulang nilai_akhir & predikat seluruh baris public.grades saat bobot/KKM berubah
-- ============================================================
create or replace function public.settings_recompute_all_grades_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    old.bobot_praktek is distinct from new.bobot_praktek or
    old.bobot_uh      is distinct from new.bobot_uh or
    old.bobot_asts    is distinct from new.bobot_asts or
    old.bobot_asas    is distinct from new.bobot_asas or
    old.kkm           is distinct from new.kkm
  ) then
    update public.grades g
    set
      nilai_akhir = public.hitung_nilai_akhir(
        g.nilai_praktek,
        g.nilai_uh,
        g.nilai_asts,
        g.nilai_asas,
        new.bobot_praktek,
        new.bobot_uh,
        new.bobot_asts,
        new.bobot_asas
      ),
      predikat = public.tentukan_predikat(
        public.hitung_nilai_akhir(
          g.nilai_praktek,
          g.nilai_uh,
          g.nilai_asts,
          g.nilai_asas,
          new.bobot_praktek,
          new.bobot_uh,
          new.bobot_asts,
          new.bobot_asas
        ),
        new.kkm
      )
    where g.id is not null;
  end if;

  return new;
end;
$$;

drop trigger if exists settings_recompute_all_grades on public.settings;
create trigger settings_recompute_all_grades
  after update of bobot_praktek, bobot_uh, bobot_asts, bobot_asas, kkm
  on public.settings
  for each row
  execute function public.settings_recompute_all_grades_trigger();

-- ============================================================
-- 5. Fungsi RPC Atomik: set_active_period(p_period_id uuid)
-- Menjamin tepat satu periode aktif dalam satu transaksi atomik
-- ============================================================
create or replace function public.set_active_period(p_period_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: hanya admin yang dapat mengubah periode aktif'
      using errcode = '42501';
  end if;

  if not exists (select 1 from public.periods where id = p_period_id) then
    raise exception 'Periode tidak ditemukan'
      using errcode = 'P0002';
  end if;

  -- Nonaktifkan periode aktif saat ini terlebih dahulu agar tidak melanggar partial unique index
  update public.periods
  set is_active = false
  where is_active = true
    and id <> p_period_id;

  -- Aktifkan periode target
  update public.periods
  set is_active = true
  where id = p_period_id
    and is_active = false;
end;
$$;
