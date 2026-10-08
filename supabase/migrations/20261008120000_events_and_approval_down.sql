-- Rolls back 20261008120000_events_and_approval.sql

do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'events'
  ) then
    alter publication supabase_realtime drop table public.events;
  end if;
end $$;

begin;

drop policy if exists events_select on public.events;
drop policy if exists events_insert on public.events;
drop policy if exists events_update on public.events;
drop policy if exists events_delete on public.events;

drop function if exists public.is_approved();

drop table if exists public.events;
drop table if exists public.approved_users;

commit;
