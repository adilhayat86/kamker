alter table requirement_matches
  add column if not exists company_listing_id uuid references company_listings(id) on delete cascade;

create unique index if not exists requirement_matches_company_listing_unique_idx
  on requirement_matches(requirement_id, company_listing_id)
  where company_listing_id is not null;

create index if not exists requirement_matches_company_listing_idx
  on requirement_matches(company_listing_id);
