alter table company_listings add column if not exists service_group text;
alter table company_listings add column if not exists profile_photo_url text;
alter table company_listings add column if not exists tagline text;
alter table company_listings add column if not exists gender text;
alter table company_listings add column if not exists availability text;
alter table company_listings add column if not exists years_experience integer check (years_experience is null or years_experience >= 0);

create index if not exists company_listings_service_group_idx on company_listings(service_group);
