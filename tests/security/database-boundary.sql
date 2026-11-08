\set ON_ERROR_STOP on
begin;
do $$
declare t record; r text;
begin
  for t in select c.oid,c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('r','p') loop
    if not t.relrowsecurity then raise exception 'RLS missing: %',t.relname; end if;
    foreach r in array array['anon','authenticated'] loop
      if has_table_privilege(r,t.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') then
        raise exception 'Direct access remains: % %',r,t.relname;
      end if;
    end loop;
    if not has_table_privilege('service_role',t.oid,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Server access missing: %',t.relname; end if;
  end loop;
  if exists(select from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
    and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'))) then
    raise exception 'Public RPC access remains';
  end if;
  if (select public from storage.buckets where id='proof-images') then raise exception 'Proof bucket is public'; end if;
end $$;

create table public.security_future_table(id integer, private_field text);
do $$ begin
  if not (select relrowsecurity from pg_class where oid='public.security_future_table'::regclass) then raise exception 'New table lacks RLS'; end if;
  if has_table_privilege('anon','public.security_future_table','SELECT') then raise exception 'New table is public'; end if;
end $$;
grant select on storage.objects to anon,authenticated;
create policy fixture_permissive on storage.objects for select to anon,authenticated using(true);
insert into storage.objects(bucket_id,name) values('proof-images','private-receipt.jpg');
set local role anon;
do $$ begin
  if exists(select from storage.objects) then raise exception 'Receipt contents exposed'; end if;
  begin perform password_hash from public.professionals limit 1; raise exception 'Private hashes readable'; exception when insufficient_privilege then null; end;
  begin update public.professionals set full_name='intruder'; raise exception 'Anonymous write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
  if exists(select from storage.objects) then raise exception 'Authenticated receipt access exposed'; end if;
  begin perform * from public.customer_sessions; raise exception 'Private sessions readable'; exception when insufficient_privilege then null; end;
  begin delete from public.admin_passwords; raise exception 'Authenticated write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role service_role;
do $$ declare i integer; owner uuid:=gen_random_uuid(); begin
  for i in 1..10 loop perform public.reserve_photo_upload(gen_random_uuid(),owner,'professional-photos',gen_random_uuid()::text); end loop;
  begin
    perform public.reserve_photo_upload(gen_random_uuid(),owner,'professional-photos',gen_random_uuid()::text);
    raise exception 'Rate limit did not reject request eleven' using errcode='XX000';
  exception when raise_exception then null;
  end;
  if (select count(*) from public.media_upload_intents where owner_id=owner and expires_at=created_at+interval '15 minutes') <> 10 then
    raise exception 'Intent expiry is incorrect';
  end if;
end $$;
reset role;
rollback;
\echo 'PASS: RLS, grants, future tables, private receipts, RPC isolation, upload limits and expiry'
