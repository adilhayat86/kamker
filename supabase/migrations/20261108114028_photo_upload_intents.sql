begin;
create table public.media_upload_intents (
  id uuid primary key,
  owner_id uuid not null,
  folder text not null check (folder in ('professional-photos','company-staff')),
  public_id text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes',
  attached_at timestamptz,
  failed_at timestamptz
);
create index media_upload_intents_owner_time on public.media_upload_intents(owner_id, created_at desc);
alter table public.media_upload_intents enable row level security;
revoke all on public.media_upload_intents from public, anon, authenticated;
grant all on public.media_upload_intents to service_role;

create function public.reserve_photo_upload(p_id uuid, p_owner uuid, p_folder text, p_public_id text)
returns void language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 0));
  if (select count(*) from public.media_upload_intents where owner_id=p_owner and created_at > now()-interval '1 hour') >= 10 then
    raise exception 'Upload limit reached' using errcode='P0001';
  end if;
  insert into public.media_upload_intents(id,owner_id,folder,public_id) values(p_id,p_owner,p_folder,p_public_id);
end;
$$;
revoke all on function public.reserve_photo_upload(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.reserve_photo_upload(uuid,uuid,text,text) to service_role;
commit;
