-- Hardening Kit Web — Initial Schema
-- Run this in your Supabase SQL editor or via drizzle-kit migrate

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type scan_decision as enum ('APPROVE', 'BLOCK', 'NEEDS_FIXES');
create type scan_env      as enum ('development', 'staging', 'production');
create type plan          as enum ('free', 'pro', 'enterprise');

-- ─── Organizations ────────────────────────────────────────────────────────────
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  plan        plan not null default 'free',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Members ──────────────────────────────────────────────────────────────────
create table members (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  user_id       uuid not null,
  role          text not null default 'member',
  email         text not null,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);
create index members_org_user_idx on members(org_id, user_id);

-- ─── Projects ─────────────────────────────────────────────────────────────────
create table projects (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organizations(id) on delete cascade,
  name           text not null,
  slug           text not null,
  description    text,
  repo_url       text,
  default_env    scan_env not null default 'staging',
  created_by_id  uuid not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index projects_org_slug_idx on projects(org_id, slug);

-- ─── Scans ────────────────────────────────────────────────────────────────────
create table scans (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references projects(id) on delete cascade,
  org_id            uuid not null,
  triggered_by_id   uuid,
  environment       scan_env not null default 'staging',
  decision          scan_decision not null,
  blocking_count    integer not null default 0,
  warning_count     integer not null default 0,
  duration_ms       integer,
  scanner_version   text not null default '1.0.0',
  violations        jsonb not null default '[]',
  warnings          jsonb not null default '[]',
  checks_summary    jsonb not null default '{}',
  tools_used        jsonb not null default '[]',
  commit_sha        text,
  branch            text,
  created_at        timestamptz not null default now()
);
create index scans_project_idx on scans(project_id);
create index scans_created_idx on scans(created_at);
create index scans_org_idx     on scans(org_id);

-- ─── Exceptions ───────────────────────────────────────────────────────────────
create table exceptions (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects(id) on delete cascade,
  org_id         uuid not null,
  policy_id      text not null,
  reason         text not null,
  expires_at     timestamptz,
  approved_by    text,
  created_by_id  uuid not null,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ─── Alerts ───────────────────────────────────────────────────────────────────
create table alerts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  project_id  uuid references projects(id) on delete cascade,
  scan_id     uuid references scans(id) on delete set null,
  type        text not null,
  title       text not null,
  body        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index alerts_org_idx on alerts(org_id, read);

-- ─── API Keys ─────────────────────────────────────────────────────────────────
create table api_keys (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  name            text not null,
  key_hash        text not null unique,
  prefix          text not null,
  last_used_at    timestamptz,
  expires_at      timestamptz,
  created_by_id   uuid not null,
  created_at      timestamptz not null default now()
);

-- ─── Row-Level Security ───────────────────────────────────────────────────────
-- Enable RLS on all tables
alter table organizations enable row level security;
alter table members        enable row level security;
alter table projects       enable row level security;
alter table scans          enable row level security;
alter table exceptions     enable row level security;
alter table alerts         enable row level security;
alter table api_keys       enable row level security;

-- Members can see their org
create policy "members_select" on members
  for select using (user_id = auth.uid());

-- Projects: members of same org can see
create policy "projects_select" on projects
  for select using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "projects_insert" on projects
  for insert with check (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "projects_update" on projects
  for update using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

-- Scans: same org
create policy "scans_select" on scans
  for select using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "scans_insert" on scans
  for insert with check (
    org_id in (select org_id from members where user_id = auth.uid())
  );

-- Exceptions: same org
create policy "exceptions_select" on exceptions
  for select using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "exceptions_insert" on exceptions
  for insert with check (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "exceptions_update" on exceptions
  for update using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

-- Alerts: same org
create policy "alerts_select" on alerts
  for select using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

-- API keys: same org
create policy "api_keys_select" on api_keys
  for select using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

-- ─── Auto-create org/member on signup ────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  new_org_id uuid;
  org_slug   text;
begin
  -- Create slug from email
  org_slug := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '-', 'g'));

  -- Create organization
  insert into organizations (name, slug)
  values (
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)) || '''s org',
    org_slug || '-' || substr(new.id::text, 1, 6)
  )
  returning id into new_org_id;

  -- Create member
  insert into members (org_id, user_id, role, email, display_name)
  values (
    new_org_id,
    new.id,
    'owner',
    new.email,
    new.raw_user_meta_data->>'display_name'
  );

  return new;
end;
$$;

-- Trigger on new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Updated_at trigger ───────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger organizations_updated_at before update on organizations
  for each row execute procedure update_updated_at();

create trigger projects_updated_at before update on projects
  for each row execute procedure update_updated_at();
