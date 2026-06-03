create table if not exists categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  icon text,
  description text,
  parent_id bigint references categories(id),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists cities (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists professionals (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_number text not null,
  whatsapp_number text,
  city_id bigint references cities(id),
  area text,
  category_id bigint references categories(id),
  gender text,
  availability text,
  years_experience integer,
  experience text,
  expected_rate text,
  tagline text,
  short_bio text,
  cnic text,
  profile_photo_url text,
  password_hash text,
  secret_question text,
  secret_answer_hash text,
  is_cnic_verified boolean not null default false,
  is_phone_verified boolean not null default false,
  rating numeric(2, 1) not null default 0,
  is_active boolean not null default false,
  is_featured boolean not null default false,
  featured_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists professional_sessions (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_number text not null,
  city_id bigint references cities(id),
  area text,
  created_at timestamptz not null default now()
);

create table if not exists requirements (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  required_service text not null,
  city_id bigint references cities(id),
  area text,
  availability text,
  details text not null,
  budget text,
  phone_number text not null,
  whatsapp_number text,
  urgency text not null,
  status text not null default 'open',
  broadcast_status text not null default 'free',
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default now()
);

create table if not exists requirement_notifications (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references requirements(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  channel text not null default 'app',
  status text not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(requirement_id, professional_id, channel)
);

create table if not exists requirement_matches (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid references requirements(id) on delete cascade,
  professional_id uuid references professionals(id) on delete cascade,
  match_score integer not null,
  created_at timestamptz not null default now(),
  unique(requirement_id, professional_id)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'professional-photos',
  'professional-photos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
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
      and policyname = 'professional_photos_public_read'
  ) then
    create policy professional_photos_public_read
    on storage.objects for select
    using (bucket_id = 'professional-photos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'professional_photos_insert'
  ) then
    create policy professional_photos_insert
    on storage.objects for insert
    with check (bucket_id = 'professional-photos');
  end if;
end $$;

create index if not exists categories_parent_idx on categories(parent_id);

create table if not exists admin_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into admin_settings (key, value)
values ('auto_approve_professionals', 'false')
on conflict (key) do nothing;

alter table professionals add column if not exists gender text;
alter table professionals add column if not exists availability text;
alter table professionals add column if not exists years_experience integer;
alter table professionals add column if not exists tagline text;
alter table requirements add column if not exists availability text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'professionals_tagline_length'
  ) then
    alter table professionals
      add constraint professionals_tagline_length
      check (tagline is null or char_length(tagline) <= 30);
  end if;
end $$;

create index if not exists professionals_city_category_idx on professionals(city_id, category_id);
create index if not exists professionals_active_idx on professionals(is_active);
create index if not exists professionals_featured_idx on professionals(is_featured, featured_until);
create index if not exists professionals_phone_number_idx on professionals(phone_number);
create index if not exists requirements_city_status_idx on requirements(city_id, status);
create index if not exists requirement_matches_requirement_idx on requirement_matches(requirement_id);
create index if not exists requirement_matches_professional_idx on requirement_matches(professional_id);
create index if not exists requirement_notifications_requirement_idx on requirement_notifications(requirement_id);
create index if not exists professional_sessions_professional_idx on professional_sessions(professional_id);
create index if not exists professional_sessions_expires_idx on professional_sessions(expires_at);
