-- Fix duplicate city rows caused by case-sensitive uniqueness (e.g. "sialkot" vs "Sialkot").
-- The sample-data seed script upserts cities with on_conflict=name, which only catches
-- exact-case matches, so a differently-cased row slips through as a "new" city.

-- Defensive cleanup: if two rows differ only by case, keep the lowest id and repoint
-- any professionals/customers/requirements referencing the duplicate before removing it.
do $$
declare
  keep record;
  dupe record;
begin
  for keep in
    select min(id) as id, lower(name) as name_key
    from cities
    group by lower(name)
    having count(*) > 1
  loop
    for dupe in
      select id from cities
      where lower(name) = keep.name_key and id <> keep.id
    loop
      update professionals set city_id = keep.id where city_id = dupe.id;
      update customers set city_id = keep.id where city_id = dupe.id;
      update requirements set city_id = keep.id where city_id = dupe.id;
      delete from cities where id = dupe.id;
    end loop;
  end loop;
end $$;

-- Prevent this from recurring: enforce case-insensitive uniqueness on city names.
create unique index if not exists cities_name_lower_key on cities (lower(name));
