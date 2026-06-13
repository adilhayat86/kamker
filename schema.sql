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
  phone_number text,
  phone_normalized text,
  whatsapp_number text,
  city_id bigint references cities(id),
  area text,
  category_id bigint references categories(id),
  gender text,
  age integer check (age is null or (age >= 16 and age <= 80)),
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
  is_banned boolean not null default false,
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

create or replace function kamker_normalize_pk_mobile(input text)
returns text
language plpgsql
immutable
as $$
declare
  digits text;
begin
  if input is null or btrim(input) = '' then
    return null;
  end if;

  digits := regexp_replace(input, '\D', '', 'g');

  if left(digits, 2) = '00' then
    digits := substr(digits, 3);
  end if;

  if left(digits, 2) = '92' then
    digits := substr(digits, 3);
  elsif left(digits, 1) = '0' then
    digits := substr(digits, 2);
  end if;

  if digits ~ '^3[0-9]{9}$' and digits !~ '^3([0-9])\1{8}$' then
    return '+92' || digits;
  end if;

  return null;
end;
$$;

create or replace function professionals_set_phone_normalized()
returns trigger
language plpgsql
as $$
begin
  new.phone_normalized := kamker_normalize_pk_mobile(new.phone_number);
  return new;
end;
$$;

drop trigger if exists professionals_set_phone_normalized on professionals;

create trigger professionals_set_phone_normalized
before insert or update of phone_number on professionals
for each row
execute function professionals_set_phone_normalized();

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_number text not null,
  phone_normalized text,
  password_hash text,
  city_id bigint references cities(id),
  area text,
  created_at timestamptz not null default now()
);

create or replace function customers_set_phone_normalized()
returns trigger
language plpgsql
as $$
begin
  new.phone_normalized := kamker_normalize_pk_mobile(new.phone_number);
  return new;
end;
$$;

drop trigger if exists customers_set_phone_normalized on customers;

create trigger customers_set_phone_normalized
before insert or update of phone_number on customers
for each row
execute function customers_set_phone_normalized();

create table if not exists customer_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
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
  broadcast_status text not null default 'pending_payment',
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default now()
);

create table if not exists requirement_broadcast_payments (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references requirements(id) on delete cascade,
  amount_pkr integer not null default 35 check (amount_pkr > 0),
  payment_method text not null default 'easypaisa',
  payer_name text,
  sender_phone text,
  transaction_reference text,
  proof_review_id uuid,
  proof_image_url text,
  proof_storage_path text,
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  broadcast_status text not null default 'pending_payment',
  ai_decision text,
  ai_detected_amount_pkr integer,
  ai_confidence numeric,
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  10485760,
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
values ('auto_approve_professionals', 'true')
on conflict (key) do nothing;

alter table professionals add column if not exists gender text;
alter table professionals add column if not exists age integer;
alter table professionals add column if not exists availability text;
alter table professionals add column if not exists availability_time text;
alter table professionals add column if not exists availability_days text;
alter table professionals add column if not exists years_experience integer;
alter table professionals add column if not exists tagline text;
alter table requirements add column if not exists availability text;
alter table customers add column if not exists phone_normalized text;
alter table customers add column if not exists password_hash text;
alter table requirements alter column broadcast_status set default 'pending_payment';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'professionals_age_range'
  ) then
    alter table professionals
      add constraint professionals_age_range
      check (age is null or (age >= 16 and age <= 80));
  end if;

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
create unique index if not exists professionals_phone_normalized_unique_idx
  on professionals(phone_normalized)
  where phone_normalized is not null;
create index if not exists customers_phone_normalized_idx on customers(phone_normalized);
create index if not exists customer_sessions_customer_idx on customer_sessions(customer_id);
create index if not exists customer_sessions_expires_idx on customer_sessions(expires_at);
create index if not exists professionals_availability_time_idx on professionals(availability_time);
create index if not exists professionals_availability_days_idx on professionals(availability_days);
create index if not exists professionals_age_idx on professionals(age);
create index if not exists requirements_city_status_idx on requirements(city_id, status);
create index if not exists requirement_matches_requirement_idx on requirement_matches(requirement_id);
create index if not exists requirement_matches_professional_idx on requirement_matches(professional_id);
create index if not exists requirement_broadcast_payments_requirement_idx on requirement_broadcast_payments(requirement_id);
create index if not exists requirement_broadcast_payments_status_idx on requirement_broadcast_payments(status);
create index if not exists requirement_broadcast_payments_created_at_idx on requirement_broadcast_payments(created_at);
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
  age integer check (age is null or (age >= 16 and age <= 80)),
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
create index if not exists company_listings_age_idx on company_listings(age);
create index if not exists company_media_company_id_idx on company_media(company_id);
create index if not exists company_media_media_type_idx on company_media(media_type);

alter table requirement_matches
  add column if not exists company_listing_id uuid references company_listings(id) on delete cascade;

create unique index if not exists requirement_matches_company_listing_unique_idx
  on requirement_matches(requirement_id, company_listing_id)
  where company_listing_id is not null;

create index if not exists requirement_matches_company_listing_idx
  on requirement_matches(company_listing_id);

create table if not exists admin_passwords (
  role text primary key check (role in ('owner', 'manager')),
  password_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists admin_password_resets (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('owner', 'manager')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_password_resets_role_idx on admin_password_resets(role);
create index if not exists admin_password_resets_expires_at_idx on admin_password_resets(expires_at);
create index if not exists admin_password_resets_used_at_idx on admin_password_resets(used_at);

create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target_type text not null,
  target_id text,
  admin_label text not null default 'password-admin',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_action_idx on admin_audit_logs(action);
create index if not exists admin_audit_logs_target_idx on admin_audit_logs(target_type, target_id);
create index if not exists admin_audit_logs_created_at_idx on admin_audit_logs(created_at);

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

drop trigger if exists requirement_broadcast_payments_set_updated_at on requirement_broadcast_payments;

create trigger requirement_broadcast_payments_set_updated_at
before update on requirement_broadcast_payments
for each row
execute function set_updated_at();
