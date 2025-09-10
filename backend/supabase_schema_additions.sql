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



-- Study plan ownership policies (required for inserts/updates under RLS)
-- Enable RLS on core tables if not already enabled
alter table if exists public.study_plans enable row level security;
alter table if exists public.plan_milestones enable row level security;
alter table if exists public.milestone_steps enable row level security;
alter table if exists public.step_resources enable row level security;

-- study_plans: only owner can select/modify their rows
create policy if not exists "plans_select_own" on public.study_plans
for select using (auth.uid() = user_id);

create policy if not exists "plans_modify_own" on public.study_plans
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- plan_milestones: only owner of parent plan can select/modify
create policy if not exists "milestones_select_own_plan" on public.plan_milestones
for select using (
  exists (
    select 1 from public.study_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  )
);

create policy if not exists "milestones_modify_own_plan" on public.plan_milestones
for all using (
  exists (
    select 1 from public.study_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.study_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  )
);

-- milestone_steps: only owner via parent milestone->plan can select/modify
create policy if not exists "steps_select_own_plan" on public.milestone_steps
for select using (
  exists (
    select 1
    from public.plan_milestones m
    join public.study_plans p on p.id = m.plan_id
    where m.id = milestone_id and p.user_id = auth.uid()
  )
);

create policy if not exists "steps_modify_own_plan" on public.milestone_steps
for all using (
  exists (
    select 1
    from public.plan_milestones m
    join public.study_plans p on p.id = m.plan_id
    where m.id = milestone_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.plan_milestones m
    join public.study_plans p on p.id = m.plan_id
    where m.id = milestone_id and p.user_id = auth.uid()
  )
);

-- step_resources: only owner via parent step->milestone->plan can select/modify
create policy if not exists "resources_select_own_plan" on public.step_resources
for select using (
  exists (
    select 1
    from public.milestone_steps s
    join public.plan_milestones m on m.id = s.milestone_id
    join public.study_plans p on p.id = m.plan_id
    where s.id = step_id and p.user_id = auth.uid()
  )
);

create policy if not exists "resources_modify_own_plan" on public.step_resources
for all using (
  exists (
    select 1
    from public.milestone_steps s
    join public.plan_milestones m on m.id = s.milestone_id
    join public.study_plans p on p.id = m.plan_id
    where s.id = step_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.milestone_steps s
    join public.plan_milestones m on m.id = s.milestone_id
    join public.study_plans p on p.id = m.plan_id
    where s.id = step_id and p.user_id = auth.uid()
  )
);
