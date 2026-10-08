-- Shared office events, writable only by approved signed-in staff.
-- Run this in the Supabase SQL editor. Then turn off public sign-ups
-- under Authentication → Sign In / Providers → Email.

begin;

create table public.approved_users (
  email text primary key,
  created_at timestamptz not null default now(),
  constraint approved_email_shape check (
    email = lower(email)
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  )
);

create table public.events (
  id text primary key,
  title text not null,
  date date not null,
  end_date date,
  all_day boolean not null,
  start_time text,
  end_time text,
  category_id text not null,
  location text,
  notes text,
  color text,
  source text not null default 'user',
  recurrence_group_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_source_user check (source = 'user'),
  constraint events_id_not_excel check (id !~ '^xlsx:'),
  constraint events_title_len check (char_length(btrim(title)) between 2 and 80),
  constraint events_notes_len check (notes is null or char_length(notes) <= 500),
  constraint events_end_on_or_after_start check (end_date is null or end_date >= date),
  constraint events_color_hex check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint events_time_pair check (
    (start_time is null and end_time is null)
    or (
      start_time ~ '^\d{2}:\d{2}$'
      and end_time ~ '^\d{2}:\d{2}$'
      and end_time > start_time
    )
  )
);

create index events_date_idx on public.events (date);
create index events_recurrence_idx on public.events (recurrence_group_id);

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.approved_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_approved() from public, anon;
grant execute on function public.is_approved() to authenticated;

alter table public.approved_users enable row level security;
alter table public.events enable row level security;

revoke all on table public.approved_users from anon, authenticated;
revoke all on table public.events from anon;
grant select, insert, update, delete on table public.events to authenticated;

create policy events_select on public.events
  for select to authenticated
  using (public.is_approved());

create policy events_insert on public.events
  for insert to authenticated
  with check (public.is_approved() and source = 'user');

create policy events_update on public.events
  for update to authenticated
  using (public.is_approved())
  with check (public.is_approved() and source = 'user');

create policy events_delete on public.events
  for delete to authenticated
  using (public.is_approved());

alter table public.events replica identity full;

commit;

-- Publication changes are kept outside the transaction: some hosted
-- Postgres builds reject ALTER PUBLICATION inside a transaction block.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
end $$;
