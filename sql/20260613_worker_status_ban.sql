alter table if exists public.professionals
  add column if not exists is_banned boolean not null default false;

update public.professionals
set is_banned = false
where is_banned is null;

create index if not exists professionals_status_review_idx
  on public.professionals(is_banned, is_active, created_at desc);

update public.professionals
set is_featured = false,
    featured_until = null
where is_banned = true;
