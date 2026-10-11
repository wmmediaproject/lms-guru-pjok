-- Migration: sync_auth_users_profiles
-- 1. Sinkronisasi seluruh user yang sudah ada di auth.users ke tabel public.profiles sebagai 'admin'
-- 2. Trigger otomatis pada auth.users agar setiap user baru di Supabase Auth otomatis masuk ke public.profiles
-- 3. Fungsi RPC ensure_admin_profile() dan kebijakan RLS agar user terautentikasi selalu sinkron dengan public.profiles

-- 1. Backfill seluruh user yang ada di auth.users ke public.profiles
insert into public.profiles (id, role)
select id, 'admin'
from auth.users
on conflict (id) do update
set role = 'admin';

-- 2. Trigger otomatis saat user baru ditambahkan di auth.users
create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'admin')
  on conflict (id) do update
  set role = 'admin';
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sync_profile on auth.users;
create trigger on_auth_user_created_sync_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user_profile();

-- 3. Fungsi bantu RPC untuk memastikan user yang sedang login terdaftar di public.profiles
create or replace function public.ensure_admin_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Akses ditolak: belum login'
      using errcode = '42501';
  end if;

  insert into public.profiles (id, role)
  values (auth.uid(), 'admin')
  on conflict (id) do update
  set role = 'admin';
end;
$$;

revoke all on function public.ensure_admin_profile() from public;
grant execute on function public.ensure_admin_profile() to authenticated;
