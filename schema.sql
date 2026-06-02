create table if not exists categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  icon text,
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
  experience text,
  expected_rate text,
  short_bio text,
  cnic text,
  profile_photo_url text,
  is_cnic_verified boolean not null default false,
  is_phone_verified boolean not null default false,
  rating numeric(2, 1) not null default 0,
  is_active boolean not null default true,
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

create index if not exists professionals_city_category_idx on professionals(city_id, category_id);
create index if not exists requirements_city_status_idx on requirements(city_id, status);
create index if not exists requirement_notifications_requirement_idx on requirement_notifications(requirement_id);
