-- Security boundary: the application authenticates users on its server. Public
-- Supabase keys must never bypass those checks through the Data API.
begin;

alter table public.requirements add column if not exists professional_id uuid
  references public.professionals(id) on delete set null;
create index if not exists requirements_professional_owner_idx on public.requirements(professional_id);

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

revoke all privileges on all tables in schema public from public, anon, authenticated;
revoke all privileges on all sequences in schema public from public, anon, authenticated;
revoke all privileges on all functions in schema public from public, anon, authenticated;
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges for role postgres in schema public revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public grant usage, select on sequences to service_role;
alter default privileges for role postgres in schema public grant execute on functions to service_role;

-- Existing permissive policies must not make private receipts readable through
-- the authenticated object API, even when other media buckets remain public.
update storage.buckets set public=false where id='proof-images';
drop policy if exists kamker_private_proofs on storage.objects;
create policy kamker_private_proofs on storage.objects as restrictive
  for all to anon, authenticated
  using (bucket_id <> 'proof-images') with check (bucket_id <> 'proof-images');

-- Apply the same boundary to future application tables.
create or replace function public.secure_new_public_tables() returns event_trigger
language plpgsql security invoker set search_path = pg_catalog as $$
declare command record;
begin
  for command in select * from pg_event_trigger_ddl_commands() loop
    if command.schema_name = 'public' and command.object_type = 'table' then
      execute format('alter table %s enable row level security', command.objid::regclass);
      execute format('revoke all on table %s from public, anon, authenticated', command.objid::regclass);
      execute format('grant all on table %s to service_role', command.objid::regclass);
    end if;
  end loop;
end;
$$;
revoke all on function public.secure_new_public_tables() from public, anon, authenticated;
drop event trigger if exists kamker_secure_new_tables;
create event trigger kamker_secure_new_tables on ddl_command_end
when tag in ('CREATE TABLE','CREATE TABLE AS','SELECT INTO') execute function public.secure_new_public_tables();
commit;
