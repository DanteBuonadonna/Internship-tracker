-- Run this in your Supabase project's SQL Editor
-- (Supabase dashboard → SQL Editor → New query → paste this → Run)

-- ===== USERS PROFILE =====
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  school text,
  year text,
  major text,
  dream_role text,
  background text,
  skills text,
  created_at timestamptz default now()
);

-- ===== CONTACTS =====
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  -- contact info
  contact_name text default '',
  contact_email text default '',
  contact_role text default '',
  -- job info
  company text not null,
  job_title text default '',
  job_url text default '',
  job_location text default '',
  job_description text default '',
  -- email
  email_subject text default '',
  email_body text default '',
  -- status
  status text default 'draft' check (status in ('draft','sent','replied','interview','offer','rejected')),
  sent_at timestamptz,
  last_reply_at timestamptz,
  reply_text text default '',
  gmail_thread_id text,
  -- meta
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== TIMELINE EVENTS =====
create table if not exists public.timeline_events (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  event text not null,
  created_at timestamptz default now()
);

-- ===== ROW LEVEL SECURITY =====
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.timeline_events enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users see own profile" on public.profiles
  for all using (auth.uid() = id);

-- Contacts: users can only see/edit their own
create policy "Users see own contacts" on public.contacts
  for all using (auth.uid() = user_id);

-- Timeline: same
create policy "Users see own timeline" on public.timeline_events
  for all using (auth.uid() = user_id);

-- ===== AUTO-CREATE PROFILE ON SIGNUP =====
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== INDEXES =====
create index if not exists contacts_user_id_idx on public.contacts(user_id);
create index if not exists contacts_status_idx on public.contacts(user_id, status);
create index if not exists timeline_contact_id_idx on public.timeline_events(contact_id);
