-- Bookmarks table: tracks which public plans a user bookmarked
create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, plan_id)
);

-- Progress table: per-user completion of milestones on other users' plans
create table if not exists public.plan_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  milestone_id uuid not null references public.plan_milestones(id) on delete cascade,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, plan_id, milestone_id)
);

-- Optional: basic RLS, enable and allow owners (by user_id) to manage their rows
alter table public.bookmarks enable row level security;
alter table public.plan_progress enable row level security;

create policy if not exists "bookmarks_select_own" on public.bookmarks
for select using (auth.uid() = user_id);

create policy if not exists "bookmarks_modify_own" on public.bookmarks
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "progress_select_own" on public.plan_progress
for select using (auth.uid() = user_id);

create policy if not exists "progress_modify_own" on public.plan_progress
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


