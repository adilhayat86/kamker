-- Cleanup legacy/test category rows that should not appear in the public directory.
-- Peon is handled as a search alias for the canonical Office Boys category.

update professionals
set category_id = (select id from categories where slug = 'office-boys' limit 1)
where category_id = (select id from categories where slug = 'peons' limit 1)
  and exists (select 1 from categories where slug = 'office-boys');

update requirements
set required_service = 'Office Boys'
where lower(required_service) in ('peon', 'peons');

update company_listings
set category = 'Office Boys'
where lower(category) in ('peon', 'peons');

delete from categories
where slug = 'peons';

delete from categories
where parent_id in (
  select id
  from categories
  where slug = 'admin-test-category'
);

delete from categories
where slug in ('admin-test-category', 'transport-and-security')
  and not exists (
    select 1
    from categories child
    where child.parent_id = categories.id
  );
