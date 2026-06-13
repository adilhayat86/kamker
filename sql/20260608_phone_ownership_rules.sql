alter table professionals
  alter column phone_number drop not null;

alter table professionals
  add column if not exists phone_normalized text;

create or replace function kamker_normalize_pk_mobile(input text)
returns text
language plpgsql
immutable
as $$
declare
  digits text;
begin
  if input is null or btrim(input) = '' then
    return null;
  end if;

  digits := regexp_replace(input, '\D', '', 'g');

  if left(digits, 2) = '00' then
    digits := substr(digits, 3);
  end if;

  if left(digits, 2) = '92' then
    digits := substr(digits, 3);
  elsif left(digits, 1) = '0' then
    digits := substr(digits, 2);
  end if;

  if digits ~ '^3[0-9]{9}$' and digits !~ '^3([0-9])\1{8}$' then
    return '+92' || digits;
  end if;

  return null;
end;
$$;

update professionals
set phone_normalized = kamker_normalize_pk_mobile(phone_number)
where phone_normalized is null
  and phone_number is not null;

-- Production may already contain old test or duplicate phone claims. The MVP
-- rule is one worker login phone per individual profile, so clear legacy
-- invalid numbers and older duplicate claims before creating the unique index.
update professionals
set
  phone_number = null,
  whatsapp_number = null,
  phone_normalized = null,
  is_phone_verified = false,
  is_active = false
where phone_number is not null
  and kamker_normalize_pk_mobile(phone_number) is null;

with ranked_phone_claims as (
  select
    id,
    row_number() over (
      partition by phone_normalized
      order by
        coalesce(is_active, false) desc,
        created_at desc nulls last,
        id desc
    ) as claim_rank
  from professionals
  where phone_normalized is not null
),
duplicate_phone_claims as (
  select id
  from ranked_phone_claims
  where claim_rank > 1
)
update professionals
set
  phone_number = null,
  whatsapp_number = null,
  phone_normalized = null,
  is_phone_verified = false,
  is_active = false
where id in (select id from duplicate_phone_claims);

create or replace function professionals_set_phone_normalized()
returns trigger
language plpgsql
as $$
begin
  new.phone_normalized := kamker_normalize_pk_mobile(new.phone_number);
  return new;
end;
$$;

drop trigger if exists professionals_set_phone_normalized on professionals;

create trigger professionals_set_phone_normalized
before insert or update of phone_number on professionals
for each row
execute function professionals_set_phone_normalized();

do $$
begin
  if exists (
    select 1
    from professionals
    where phone_normalized is not null
    group by phone_normalized
    having count(*) > 1
  ) then
    raise exception 'Duplicate professional phone numbers still exist. Review sql/20260608_phone_ownership_rules.sql cleanup before creating professionals_phone_normalized_unique_idx.';
  else
    create unique index if not exists professionals_phone_normalized_unique_idx
      on professionals(phone_normalized)
      where phone_normalized is not null;
  end if;
end;
$$;

create index if not exists professionals_phone_normalized_idx
  on professionals(phone_normalized);
