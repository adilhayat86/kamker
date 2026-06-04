alter table professionals
  add column if not exists availability_time text;

alter table professionals
  add column if not exists availability_days text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'professionals_availability_time_check'
  ) then
    alter table professionals
      add constraint professionals_availability_time_check
      check (
        availability_time is null
        or availability_time in ('morning', 'evening', 'full_time')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'professionals_availability_days_check'
  ) then
    alter table professionals
      add constraint professionals_availability_days_check
      check (
        availability_days is null
        or availability_days in ('weekend', 'weekdays', 'seven_days')
      );
  end if;
end $$;

create index if not exists professionals_availability_time_idx
  on professionals(availability_time);

create index if not exists professionals_availability_days_idx
  on professionals(availability_days);
