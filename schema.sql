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
  availability_time text constraint professionals_availability_time_check check (
    availability_time is null
    or availability_time in ('morning', 'evening', 'full_time')
  ),
  availability_days text constraint professionals_availability_days_check check (
    availability_days is null
    or availability_days in ('weekend', 'weekdays', 'seven_days')
  ),
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
  8388608,
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
alter table professionals add column if not exists availability_time text;
alter table professionals add column if not exists availability_days text;
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

  if not exists (
    select 1 from pg_constraint
    where conname = 'professionals_availability_time_check'
  ) then
    alter table professionals
      add constraint professionals_availability_time_check
      check (
        availability_time is null
        or availability_time in ('morning', 'evening', 'full_time')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'professionals_availability_days_check'
  ) then
    alter table professionals
      add constraint professionals_availability_days_check
      check (
        availability_days is null
        or availability_days in ('weekend', 'weekdays', 'seven_days')
      );
  end if;
end $$;

create index if not exists professionals_city_category_idx on professionals(city_id, category_id);
create index if not exists professionals_active_idx on professionals(is_active);
create index if not exists professionals_featured_idx on professionals(is_featured, featured_until);
create index if not exists professionals_phone_number_idx on professionals(phone_number);
create index if not exists professionals_availability_time_idx on professionals(availability_time);
create index if not exists professionals_availability_days_idx on professionals(availability_days);
create index if not exists requirements_city_status_idx on requirements(city_id, status);
create index if not exists requirement_matches_requirement_idx on requirement_matches(requirement_id);
create index if not exists requirement_matches_professional_idx on requirement_matches(professional_id);
create index if not exists requirement_notifications_requirement_idx on requirement_notifications(requirement_id);
create index if not exists professional_sessions_professional_idx on professional_sessions(professional_id);
create index if not exists professional_sessions_expires_idx on professional_sessions(expires_at);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  company_name text not null,
  category text not null,
  city text not null,
  area text,
  contact_person text,
  phone text,
  whatsapp text,
  description text,
  license_number text,
  logo_url text,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending_review', 'paid', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists company_packages (
  id uuid primary key default gen_random_uuid(),
  package_key text not null unique,
  title text not null,
  description text,
  price_pkr integer not null check (price_pkr >= 0),
  duration_days integer not null check (duration_days > 0),
  listings_limit integer not null check (listings_limit >= 0),
  featured_limit integer not null check (featured_limit >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (featured_limit <= listings_limit)
);

insert into company_packages (
  package_key,
  title,
  description,
  price_pkr,
  duration_days,
  listings_limit,
  featured_limit,
  active
)
values
  (
    'company_starter_monthly',
    'Starter Company',
    '20 listings, 5 featured listings',
    3000,
    30,
    20,
    5,
    true
  ),
  (
    'company_growth_monthly',
    'Growth Company',
    '50 listings, 15 featured listings',
    7000,
    30,
    50,
    15,
    true
  ),
  (
    'company_enterprise_monthly',
    'Enterprise Company',
    '100 listings, 35 featured listings',
    15000,
    30,
    100,
    35,
    true
  )
on conflict (package_key) do update set
  title = excluded.title,
  description = excluded.description,
  price_pkr = excluded.price_pkr,
  duration_days = excluded.duration_days,
  listings_limit = excluded.listings_limit,
  featured_limit = excluded.featured_limit,
  active = excluded.active,
  updated_at = now();

create table if not exists manual_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_id uuid not null references companies(id) on delete cascade,
  package_id uuid not null references company_packages(id),
  package_key text not null,
  amount_pkr integer not null check (amount_pkr >= 0),
  payment_method text not null,
  payer_name text,
  sender_phone text,
  transaction_reference text,
  notes text,
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists company_package_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  package_id uuid not null references company_packages(id),
  manual_payment_id uuid references manual_payments(id),
  package_key text not null,
  listings_limit integer not null check (listings_limit >= 0),
  featured_limit integer not null check (featured_limit >= 0),
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (featured_limit <= listings_limit),
  check (expires_at > starts_at)
);

create table if not exists company_listings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  service_group text,
  category text not null,
  city text not null,
  area text,
  description text,
  hourly_rate integer check (hourly_rate is null or hourly_rate >= 0),
  monthly_rate integer check (monthly_rate is null or monthly_rate >= 0),
  profile_photo_url text,
  tagline text,
  gender text,
  availability text,
  years_experience integer check (years_experience is null or years_experience >= 0),
  phone text,
  whatsapp text,
  is_featured boolean not null default false,
  status text not null default 'pending' check (status in ('draft', 'pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists company_media (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists companies_owner_user_id_idx on companies(owner_user_id);
create index if not exists companies_category_idx on companies(category);
create index if not exists companies_city_idx on companies(city);
create index if not exists companies_payment_status_idx on companies(payment_status);
create index if not exists companies_verification_status_idx on companies(verification_status);

create index if not exists company_packages_active_idx on company_packages(active);

create index if not exists manual_payments_company_id_idx on manual_payments(company_id);
create index if not exists manual_payments_user_id_idx on manual_payments(user_id);
create index if not exists manual_payments_status_idx on manual_payments(status);

create index if not exists company_package_subscriptions_company_id_idx on company_package_subscriptions(company_id);
create index if not exists company_package_subscriptions_status_idx on company_package_subscriptions(status);
create index if not exists company_package_subscriptions_expires_at_idx on company_package_subscriptions(expires_at);

create index if not exists company_listings_company_id_idx on company_listings(company_id);
create index if not exists company_listings_service_group_idx on company_listings(service_group);
create index if not exists company_listings_category_idx on company_listings(category);
create index if not exists company_listings_city_idx on company_listings(city);
create index if not exists company_listings_status_idx on company_listings(status);
create index if not exists company_listings_featured_idx on company_listings(is_featured);
create index if not exists company_media_company_id_idx on company_media(company_id);
create index if not exists company_media_media_type_idx on company_media(media_type);

create trigger companies_set_updated_at
before update on companies
for each row
execute function set_updated_at();

create trigger company_packages_set_updated_at
before update on company_packages
for each row
execute function set_updated_at();

create trigger manual_payments_set_updated_at
before update on manual_payments
for each row
execute function set_updated_at();

create trigger company_package_subscriptions_set_updated_at
before update on company_package_subscriptions
for each row
execute function set_updated_at();

create trigger company_listings_set_updated_at
before update on company_listings
for each row
execute function set_updated_at();
