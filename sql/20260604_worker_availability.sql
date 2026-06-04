alter table professionals add column if not exists availability text;

alter table professionals drop constraint if exists professionals_availability_allowed;

alter table professionals
  add constraint professionals_availability_allowed
  check (
    availability is null
    or availability in ('weekdays', 'weekends', 'seven_days')
  );

create index if not exists professionals_availability_idx on professionals(availability);
