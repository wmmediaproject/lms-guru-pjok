-- Migration: create_profiles
-- Profiles table for role-based access (admin only)

create table if not exists public.profiles (
  id   uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role = 'admin')
);

comment on table public.profiles is 'One row per auth.users entry; role field used by RLS policies.';
comment on column public.profiles.id is 'Same as auth.users.id';
comment on column public.profiles.role is 'Currently only ''admin'' is supported';
