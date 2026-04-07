create table if not exists public.dashboard_projects (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  owner text not null default '',
  priority text not null,
  progress integer not null default 0,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.dashboard_schedules (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id text not null references public.dashboard_projects (id) on delete cascade,
  title text not null,
  date date not null,
  time time not null,
  priority text not null,
  kind text not null check (kind in ('major', 'general')),
  repeat_type text not null default 'none' check (repeat_type in ('none', 'daily', 'weekday', 'weekly', 'monthly', 'yearly', 'custom')),
  repeat_custom text not null default '',
  repeat_custom_label text not null default '',
  memo text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists dashboard_projects_user_id_idx on public.dashboard_projects (user_id);
create index if not exists dashboard_projects_start_date_idx on public.dashboard_projects (start_date);
create index if not exists dashboard_projects_end_date_idx on public.dashboard_projects (end_date);
create index if not exists dashboard_schedules_user_id_idx on public.dashboard_schedules (user_id);
create index if not exists dashboard_schedules_project_id_idx on public.dashboard_schedules (project_id);
create index if not exists dashboard_schedules_date_idx on public.dashboard_schedules (date);

create or replace function public.set_dashboard_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_dashboard_projects_updated_at on public.dashboard_projects;
create trigger set_dashboard_projects_updated_at
before update on public.dashboard_projects
for each row
execute procedure public.set_dashboard_updated_at();

drop trigger if exists set_dashboard_schedules_updated_at on public.dashboard_schedules;
create trigger set_dashboard_schedules_updated_at
before update on public.dashboard_schedules
for each row
execute procedure public.set_dashboard_updated_at();

alter table public.dashboard_projects enable row level security;
alter table public.dashboard_schedules enable row level security;

drop policy if exists "dashboard_projects_select_own" on public.dashboard_projects;
create policy "dashboard_projects_select_own"
on public.dashboard_projects
for select
using (auth.uid() = user_id);

drop policy if exists "dashboard_projects_insert_own" on public.dashboard_projects;
create policy "dashboard_projects_insert_own"
on public.dashboard_projects
for insert
with check (auth.uid() = user_id);

drop policy if exists "dashboard_projects_update_own" on public.dashboard_projects;
create policy "dashboard_projects_update_own"
on public.dashboard_projects
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "dashboard_projects_delete_own" on public.dashboard_projects;
create policy "dashboard_projects_delete_own"
on public.dashboard_projects
for delete
using (auth.uid() = user_id);

drop policy if exists "dashboard_schedules_select_own" on public.dashboard_schedules;
create policy "dashboard_schedules_select_own"
on public.dashboard_schedules
for select
using (auth.uid() = user_id);

drop policy if exists "dashboard_schedules_insert_own" on public.dashboard_schedules;
create policy "dashboard_schedules_insert_own"
on public.dashboard_schedules
for insert
with check (auth.uid() = user_id);

drop policy if exists "dashboard_schedules_update_own" on public.dashboard_schedules;
create policy "dashboard_schedules_update_own"
on public.dashboard_schedules
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "dashboard_schedules_delete_own" on public.dashboard_schedules;
create policy "dashboard_schedules_delete_own"
on public.dashboard_schedules
for delete
using (auth.uid() = user_id);
