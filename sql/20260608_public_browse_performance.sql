create index if not exists professionals_public_browse_idx
  on professionals(is_active, city_id, category_id, is_featured, featured_until desc, created_at desc);

create index if not exists professionals_public_availability_idx
  on professionals(is_active, availability_time, availability_days);

create index if not exists professionals_public_gender_idx
  on professionals(is_active, gender);

create index if not exists professionals_public_search_name_idx
  on professionals using gin (to_tsvector('simple', coalesce(full_name, '') || ' ' || coalesce(area, '') || ' ' || coalesce(tagline, '') || ' ' || coalesce(short_bio, '')));

create index if not exists company_listings_public_browse_idx
  on company_listings(status, city, category, is_featured, created_at desc);

create index if not exists company_listings_public_group_idx
  on company_listings(status, service_group, city);

create index if not exists company_listings_public_search_idx
  on company_listings using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(category, '') || ' ' || coalesce(city, '') || ' ' || coalesce(tagline, '') || ' ' || coalesce(description, '')));
