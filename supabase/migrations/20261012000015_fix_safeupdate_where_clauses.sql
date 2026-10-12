-- =============================================================================
-- Migration: fix_safeupdate_where_clauses
-- Menambahkan klausa WHERE eksplisit pada perintah UPDATE di dalam fungsi trigger
-- settings_recompute_all_grades_trigger() dan RPC promote_students_massal()
-- agar kompatibel dengan ekstensi pg_safeupdate di Supabase (SQLSTATE 21000).
-- =============================================================================

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

create or replace function public.promote_students_massal()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c1 integer := 0;
  v_c2 integer := 0;
  v_c3 integer := 0;
  v_c4 integer := 0;
  v_c5 integer := 0;
  v_c6 integer := 0;
  v_now timestamptz := now();
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: hanya admin yang dapat menjalankan kenaikan kelas massal'
      using errcode = '42501';
  end if;

  select
    count(*) filter (where kelas = 1),
    count(*) filter (where kelas = 2),
    count(*) filter (where kelas = 3),
    count(*) filter (where kelas = 4),
    count(*) filter (where kelas = 5),
    count(*) filter (where kelas = 6)
  into v_c1, v_c2, v_c3, v_c4, v_c5, v_c6
  from public.students
  where status = 'aktif';

  update public.students
  set status = 'lulus'
  where kelas = 6
    and status = 'aktif';

  for v_kelas in reverse 5..1 loop
    update public.students
    set kelas = v_kelas + 1
    where kelas = v_kelas
      and status = 'aktif';
  end loop;

  update public.settings
  set last_promoted_at = v_now
  where id is not null;

  return jsonb_build_object(
    'promoted_1_to_2', v_c1,
    'promoted_2_to_3', v_c2,
    'promoted_3_to_4', v_c3,
    'promoted_4_to_5', v_c4,
    'promoted_5_to_6', v_c5,
    'graduated_kelas_6', v_c6,
    'total_affected', (v_c1 + v_c2 + v_c3 + v_c4 + v_c5 + v_c6),
    'executed_at', v_now
  );
end;
$$;

revoke all on function public.promote_students_massal() from public, anon;
grant execute on function public.promote_students_massal() to authenticated;
