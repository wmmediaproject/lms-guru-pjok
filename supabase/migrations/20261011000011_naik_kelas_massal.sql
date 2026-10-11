-- Migration: naik_kelas_massal
-- 1. Menambahkan kolom status ('aktif' | 'lulus') pada public.students
-- 2. Menambahkan kolom last_promoted_at pada public.settings untuk pengaman eksekusi ganda
-- 3. Membuat fungsi RPC satu transaksi public.promote_students_massal() yang memindahkan
--    siswa aktif dari kelas tertinggi (Kelas 6 -> lulus, 5 -> 6, 4 -> 5, 3 -> 4, 2 -> 3, 1 -> 2)
--    tanpa mengubah catatan historis di public.grades.

alter table public.students
  add column if not exists status text not null default 'aktif'
  check (status in ('aktif', 'lulus'));

create index if not exists students_status_idx on public.students (status);

comment on column public.students.status is 'Status siswa: aktif (masih bersekolah di Kelas 1-6) atau lulus (alumni Kelas 6 setelah kenaikan kelas massal)';

alter table public.settings
  add column if not exists last_promoted_at timestamptz null;

comment on column public.settings.last_promoted_at is 'Waktu terakhir fitur Naik Kelas Massal dijalankan (pengaman eksekusi ganda)';

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

  -- Hitung jumlah siswa aktif per kelas sebelum pemindahan
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

  -- 1. Siswa Kelas 6 aktif ditandai lulus terlebih dahulu (nilai di public.grades tetap utuh)
  update public.students
  set status = 'lulus'
  where kelas = 6
    and status = 'aktif';

  -- 2. Pindahkan siswa aktif secara berurutan mulai dari kelas tertinggi (5->6, 4->5, 3->4, 2->3, 1->2)
  --    agar tidak pernah terjadi tumpukan kelas dalam transaksi yang sama
  for v_kelas in reverse 5..1 loop
    update public.students
    set kelas = v_kelas + 1
    where kelas = v_kelas
      and status = 'aktif';
  end loop;

  -- 3. Catat waktu eksekusi terakhir pada tabel settings
  update public.settings
  set last_promoted_at = v_now;

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

revoke all on function public.promote_students_massal() from public;
grant execute on function public.promote_students_massal() to authenticated;
