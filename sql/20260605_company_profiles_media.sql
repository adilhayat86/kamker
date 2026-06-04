alter table companies add column if not exists logo_url text;

create table if not exists company_media (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists company_media_company_id_idx on company_media(company_id);
create index if not exists company_media_media_type_idx on company_media(media_type);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-images',
  'company-images',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'company_images_public_read'
  ) then
    create policy company_images_public_read
    on storage.objects for select
    using (bucket_id = 'company-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'company_images_insert'
  ) then
    create policy company_images_insert
    on storage.objects for insert
    with check (bucket_id = 'company-images');
  end if;
end $$;
