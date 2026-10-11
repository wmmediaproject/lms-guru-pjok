-- Migration: upsert_students_csv_rpc
-- Performs batch upsert of students by NISN in a single atomic transaction
-- and returns the exact count of newly inserted vs updated rows.

create or replace function public.upsert_students_csv(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_input    integer := 0;
  v_existing_count integer := 0;
  v_inserted_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: hanya admin yang dapat mengimpor data siswa'
      using errcode = '42501';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Payload impor CSV harus berupa array JSON'
      using errcode = '22023';
  end if;

  v_total_input := jsonb_array_length(p_rows);

  if v_total_input = 0 then
    return jsonb_build_object(
      'inserted', 0,
      'updated', 0
    );
  end if;

  if v_total_input > 1000 then
    raise exception 'Jumlah baris melebihi batas maksimal 1.000 baris per impor'
      using errcode = '22023';
  end if;

  -- Hitung berapa NISN dari input yang sudah ada di tabel students sebelum upsert
  select count(*)
  into v_existing_count
  from public.students s
  where s.nisn in (
    select distinct (elem->>'nisn')
    from jsonb_array_elements(p_rows) as elem
    where elem->>'nisn' is not null
  );

  -- Lakukan batch upsert dalam satu pernyataan atomik berdasarkan NISN
  insert into public.students (nisn, nama, kelas, jenis_kelamin)
  select
    (elem->>'nisn')::text,
    (elem->>'nama')::text,
    (elem->>'kelas')::smallint,
    case
      when elem->>'jenis_kelamin' in ('L', 'P') then (elem->>'jenis_kelamin')::text
      else null
    end
  from jsonb_array_elements(p_rows) as elem
  on conflict (nisn) do update
  set
    nama          = excluded.nama,
    kelas         = excluded.kelas,
    jenis_kelamin = excluded.jenis_kelamin,
    updated_at    = now();

  v_inserted_count := greatest(0, v_total_input - v_existing_count);

  return jsonb_build_object(
    'inserted', v_inserted_count,
    'updated', v_existing_count
  );
end;
$$;
