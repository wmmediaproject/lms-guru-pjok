-- Migration: triggers_updated_at
-- Adds updated_at auto-update trigger to all tables that have the column

-- Generic trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- students
create trigger students_set_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

-- grades
create trigger grades_set_updated_at
  before update on public.grades
  for each row execute function public.set_updated_at();

-- settings
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();
