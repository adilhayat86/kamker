alter table professionals add column if not exists age integer;
alter table company_listings add column if not exists age integer;

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
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'company_listings_age_range'
  ) then
    alter table company_listings
      add constraint company_listings_age_range
      check (age is null or (age >= 16 and age <= 80));
  end if;
end
$$;

create index if not exists professionals_age_idx on professionals(age);
create index if not exists company_listings_age_idx on company_listings(age);
