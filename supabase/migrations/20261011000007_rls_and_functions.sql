-- Migration: rls_and_functions
-- is_admin() function and RLS policies for all tables

-- ============================================================
-- Helper function: is_admin()
-- Returns true if the calling user has a profiles row with role = 'admin'
-- Uses SECURITY DEFINER so it can read the profiles table regardless of caller's RLS
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- ============================================================
-- Enable RLS on every data table
-- ============================================================
alter table public.periods  enable row level security;
alter table public.students enable row level security;
alter table public.grades   enable row level security;
alter table public.settings enable row level security;
alter table public.profiles enable row level security;

-- ============================================================
-- Drop any existing policies before recreating (idempotent)
-- ============================================================
drop policy if exists "Admin can read periods"   on public.periods;
drop policy if exists "Admin can insert periods"  on public.periods;
drop policy if exists "Admin can update periods"  on public.periods;
drop policy if exists "Admin can delete periods"  on public.periods;

drop policy if exists "Admin can read students"   on public.students;
drop policy if exists "Admin can insert students"  on public.students;
drop policy if exists "Admin can update students"  on public.students;
drop policy if exists "Admin can delete students"  on public.students;

drop policy if exists "Admin can read grades"    on public.grades;
drop policy if exists "Admin can insert grades"   on public.grades;
drop policy if exists "Admin can update grades"   on public.grades;
drop policy if exists "Admin can delete grades"   on public.grades;

drop policy if exists "Admin can read settings"   on public.settings;
drop policy if exists "Admin can insert settings"  on public.settings;
drop policy if exists "Admin can update settings"  on public.settings;
drop policy if exists "Admin can delete settings"  on public.settings;

drop policy if exists "Admin can read own profile" on public.profiles;

-- ============================================================
-- periods policies
-- ============================================================
create policy "Admin can read periods"
  on public.periods for select
  using (public.is_admin());

create policy "Admin can insert periods"
  on public.periods for insert
  with check (public.is_admin());

create policy "Admin can update periods"
  on public.periods for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin can delete periods"
  on public.periods for delete
  using (public.is_admin());

-- ============================================================
-- students policies
-- ============================================================
create policy "Admin can read students"
  on public.students for select
  using (public.is_admin());

create policy "Admin can insert students"
  on public.students for insert
  with check (public.is_admin());

create policy "Admin can update students"
  on public.students for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin can delete students"
  on public.students for delete
  using (public.is_admin());

-- ============================================================
-- grades policies
-- ============================================================
create policy "Admin can read grades"
  on public.grades for select
  using (public.is_admin());

create policy "Admin can insert grades"
  on public.grades for insert
  with check (public.is_admin());

create policy "Admin can update grades"
  on public.grades for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin can delete grades"
  on public.grades for delete
  using (public.is_admin());

-- ============================================================
-- settings policies
-- ============================================================
create policy "Admin can read settings"
  on public.settings for select
  using (public.is_admin());

create policy "Admin can insert settings"
  on public.settings for insert
  with check (public.is_admin());

create policy "Admin can update settings"
  on public.settings for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin can delete settings"
  on public.settings for delete
  using (public.is_admin());

-- ============================================================
-- profiles policies (admin reads own row only)
-- ============================================================
create policy "Admin can read own profile"
  on public.profiles for select
  using (id = auth.uid() and public.is_admin());
