-- 1) Extensions
create schema if not exists extensions;
create extension if not exists "pg_stat_statements" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

do $$ begin
  begin
    execute 'create extension if not exists pgsodium with schema extensions';
  exception when others then
    null; 
  end;
end $$;

create schema if not exists vault;
do $$ begin
  begin
    execute 'create extension if not exists supabase_vault with schema vault';
  exception when others then
    null;
  end;
end $$;

create schema if not exists graphql;
do $$ begin
  begin
    execute 'create extension if not exists pg_graphql with schema graphql';
  exception when others then
    null;
  end;
end $$;

-- 2) Core tables (public)
create table if not exists public.study_plans (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  focus text,
  outcome text,
  estimated_duration_weeks integer,
  created_at timestamptz not null default now(),
  constraint study_plans_pkey primary key (id)
);
create index if not exists idx_study_plans_user_id on public.study_plans(user_id);

create table if not exists public.plan_milestones (
  id uuid not null default gen_random_uuid(),
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  title text not null,
  description text,
  estimated_duration text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  constraint plan_milestones_pkey primary key (id)
);
create index if not exists idx_plan_milestones_plan_id on public.plan_milestones(plan_id);

create table if not exists public.milestone_steps (
  id uuid not null default gen_random_uuid(),
  milestone_id uuid not null references public.plan_milestones(id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  constraint milestone_steps_pkey primary key (id)
);
create index if not exists idx_milestone_steps_milestone_id on public.milestone_steps(milestone_id);

create table if not exists public.step_resources (
  id uuid not null default gen_random_uuid(),
  step_id uuid not null references public.milestone_steps(id) on delete cascade,
  type text,
  title text,
  url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  constraint step_resources_pkey primary key (id)
);
create index if not exists idx_step_resources_step_id on public.step_resources(step_id);

create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint bookmarks_pkey primary key (user_id, plan_id)
);
create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);
create index if not exists idx_bookmarks_plan_id on public.bookmarks(plan_id);

create table if not exists public.plan_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  milestone_id uuid not null references public.plan_milestones(id) on delete cascade,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint plan_progress_pkey primary key (user_id, plan_id, milestone_id)
);
create index if not exists idx_plan_progress_user_id on public.plan_progress(user_id);
create index if not exists idx_plan_progress_plan_id on public.plan_progress(plan_id);
create index if not exists idx_plan_progress_milestone_id on public.plan_progress(milestone_id);

-- 3) Enable RLS
alter table if exists public.study_plans enable row level security;
alter table if exists public.plan_milestones enable row level security;
alter table if exists public.milestone_steps enable row level security;
alter table if exists public.step_resources enable row level security;
alter table if exists public.bookmarks enable row level security;
alter table if exists public.plan_progress enable row level security;

-- 4) Policies
-- study_plans (owner-only CRUD)
create policy if not exists "sp_select_own" on public.study_plans for select to public using (user_id = auth.uid());
create policy if not exists "sp_insert_own" on public.study_plans for insert to public with check (user_id = auth.uid());
create policy if not exists "sp_update_own" on public.study_plans for update to public using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy if not exists "sp_delete_own" on public.study_plans for delete to public using (user_id = auth.uid());

-- Public read of study plans (for browsing). Adjust as needed.
create policy if not exists "Public plans are viewable by all" on public.study_plans for select to public using (true);

-- plan_milestones (owner via parent plan)
create policy if not exists "pm_select_own" on public.plan_milestones for select to public using (
  exists (
    select 1 from public.study_plans p where p.id = plan_milestones.plan_id and p.user_id = auth.uid()
  )
);
create policy if not exists "pm_insert_own" on public.plan_milestones for insert to public with check (
  exists (
    select 1 from public.study_plans p where p.id = plan_milestones.plan_id and p.user_id = auth.uid()
  )
);
create policy if not exists "pm_update_own" on public.plan_milestones for update to public using (
  exists (
    select 1 from public.study_plans p where p.id = plan_milestones.plan_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.study_plans p where p.id = plan_milestones.plan_id and p.user_id = auth.uid()
  )
);
create policy if not exists "pm_delete_own" on public.plan_milestones for delete to public using (
  exists (
    select 1 from public.study_plans p where p.id = plan_milestones.plan_id and p.user_id = auth.uid()
  )
);

-- milestone_steps (owner via milestone->plan)
create policy if not exists "ms_select_own" on public.milestone_steps for select to public using (
  exists (
    select 1 from public.plan_milestones m join public.study_plans p on p.id = m.plan_id
    where m.id = milestone_steps.milestone_id and p.user_id = auth.uid()
  )
);
create policy if not exists "ms_insert_own" on public.milestone_steps for insert to public with check (
  exists (
    select 1 from public.plan_milestones m join public.study_plans p on p.id = m.plan_id
    where m.id = milestone_steps.milestone_id and p.user_id = auth.uid()
  )
);
create policy if not exists "ms_update_own" on public.milestone_steps for update to public using (
  exists (
    select 1 from public.plan_milestones m join public.study_plans p on p.id = m.plan_id
    where m.id = milestone_steps.milestone_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.plan_milestones m join public.study_plans p on p.id = m.plan_id
    where m.id = milestone_steps.milestone_id and p.user_id = auth.uid()
  )
);
create policy if not exists "ms_delete_own" on public.milestone_steps for delete to public using (
  exists (
    select 1 from public.plan_milestones m join public.study_plans p on p.id = m.plan_id
    where m.id = milestone_steps.milestone_id and p.user_id = auth.uid()
  )
);

-- step_resources (owner via step->milestone->plan)
create policy if not exists "sr_select_own" on public.step_resources for select to public using (
  exists (
    select 1 from public.milestone_steps s
    join public.plan_milestones m on m.id = s.milestone_id
    join public.study_plans p on p.id = m.plan_id
    where s.id = step_resources.step_id and p.user_id = auth.uid()
  )
);
create policy if not exists "sr_insert_own" on public.step_resources for insert to public with check (
  exists (
    select 1 from public.milestone_steps s
    join public.plan_milestones m on m.id = s.milestone_id
    join public.study_plans p on p.id = m.plan_id
    where s.id = step_resources.step_id and p.user_id = auth.uid()
  )
);
create policy if not exists "sr_update_own" on public.step_resources for update to public using (
  exists (
    select 1 from public.milestone_steps s
    join public.plan_milestones m on m.id = s.milestone_id
    join public.study_plans p on p.id = m.plan_id
    where s.id = step_resources.step_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.milestone_steps s
    join public.plan_milestones m on m.id = s.milestone_id
    join public.study_plans p on p.id = m.plan_id
    where s.id = step_resources.step_id and p.user_id = auth.uid()
  )
);
create policy if not exists "sr_delete_own" on public.step_resources for delete to public using (
  exists (
    select 1 from public.milestone_steps s
    join public.plan_milestones m on m.id = s.milestone_id
    join public.study_plans p on p.id = m.plan_id
    where s.id = step_resources.step_id and p.user_id = auth.uid()
  )
);

-- bookmarks policies
create policy if not exists "bookmarks_select_own" on public.bookmarks for select using (auth.uid() = user_id);
create policy if not exists "bookmarks_modify_own" on public.bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- plan_progress policies
create policy if not exists "progress_select_own" on public.plan_progress for select using (auth.uid() = user_id);
create policy if not exists "progress_modify_own" on public.plan_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "progress_insert_own" on public.plan_progress for insert to public with check (auth.uid() = user_id);

-- Additional generic insert rule from metadata (kept for compatibility)
create policy if not exists "Enable insert for authenticated users only" on public.study_plans for insert to authenticated with check (true);
create policy if not exists "Enable insert for users based on user_id" on public.bookmarks for insert to public with check (((select auth.uid() as uid) = user_id));
