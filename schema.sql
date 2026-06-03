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

create index if not exists professionals_city_category_idx on professionals(city_id, category_id);
create index if not exists professionals_active_idx on professionals(is_active);
create index if not exists professionals_featured_idx on professionals(is_featured, featured_until);
create index if not exists professionals_phone_number_idx on professionals(phone_number);
create index if not exists requirements_city_status_idx on requirements(city_id, status);
create index if not exists requirement_notifications_requirement_idx on requirement_notifications(requirement_id);
create index if not exists professional_sessions_professional_idx on professional_sessions(professional_id);
create index if not exists professional_sessions_expires_idx on professional_sessions(expires_at);
