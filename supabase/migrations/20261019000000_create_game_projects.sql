-- MetalGui project storage. Safe to re-run.
create table if not exists public.game_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  scene jsonb not null default '{"version":1,"objects":[],"settings":{"background":"#e9f2e6","gravity":9.8}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists game_projects_user_updated_idx on public.game_projects (user_id, updated_at desc);
alter table public.game_projects enable row level security;
drop policy if exists "Users can view their own projects" on public.game_projects;
create policy "Users can view their own projects" on public.game_projects for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own projects" on public.game_projects;
create policy "Users can create their own projects" on public.game_projects for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own projects" on public.game_projects;
create policy "Users can update their own projects" on public.game_projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own projects" on public.game_projects;
create policy "Users can delete their own projects" on public.game_projects for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.game_projects to authenticated;
create or replace function public.set_game_project_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists set_game_project_updated_at on public.game_projects;
create trigger set_game_project_updated_at before update on public.game_projects for each row execute function public.set_game_project_updated_at();
