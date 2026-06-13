-- Logged-in paid requirement broadcasts.
-- Apply after the existing Kamker MVP migrations.

alter table if exists public.customers
  add column if not exists phone_normalized text;

alter table if exists public.customers
  add column if not exists password_hash text;

create or replace function public.customers_set_phone_normalized()
returns trigger
language plpgsql
as $$
begin
  new.phone_normalized := public.kamker_normalize_pk_mobile(new.phone_number);
  return new;
end;
$$;

drop trigger if exists customers_set_phone_normalized on public.customers;

create trigger customers_set_phone_normalized
before insert or update of phone_number on public.customers
for each row
execute function public.customers_set_phone_normalized();

update public.customers
set phone_normalized = public.kamker_normalize_pk_mobile(phone_number)
where phone_normalized is null
  and phone_number is not null;

create table if not exists public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists customers_phone_normalized_idx
  on public.customers(phone_normalized);

create index if not exists customer_sessions_customer_idx
  on public.customer_sessions(customer_id);

create index if not exists customer_sessions_expires_idx
  on public.customer_sessions(expires_at);

alter table if exists public.requirements
  add column if not exists payment_status text not null default 'unpaid';

alter table if exists public.requirements
  add column if not exists broadcast_status text not null default 'pending_payment';

alter table if exists public.requirements
  alter column broadcast_status set default 'pending_payment';

create table if not exists public.requirement_broadcast_payments (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
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

create index if not exists requirement_broadcast_payments_requirement_idx
  on public.requirement_broadcast_payments(requirement_id);

create index if not exists requirement_broadcast_payments_status_idx
  on public.requirement_broadcast_payments(status);

create index if not exists requirement_broadcast_payments_created_at_idx
  on public.requirement_broadcast_payments(created_at);

drop trigger if exists requirement_broadcast_payments_set_updated_at
on public.requirement_broadcast_payments;

create trigger requirement_broadcast_payments_set_updated_at
before update on public.requirement_broadcast_payments
for each row
execute function public.set_updated_at();

alter table if exists public.customer_sessions disable row level security;
alter table if exists public.requirement_broadcast_payments disable row level security;
