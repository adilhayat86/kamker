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
  created_at timestamptz not null default now()
);
