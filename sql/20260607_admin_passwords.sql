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
