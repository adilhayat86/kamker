alter table companies add column if not exists logo_url text;
alter table company_listings add column if not exists photo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-images',
  'company-images',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_type_idx on analytics_events(event_type);
create index if not exists analytics_events_target_idx on analytics_events(target_type, target_id);
create index if not exists analytics_events_created_at_idx on analytics_events(created_at);
