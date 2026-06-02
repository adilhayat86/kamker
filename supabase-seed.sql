-- Kamker seed data and basic public policies
-- Run this after schema.sql has been applied.

insert into cities (name)
values
  ('Karachi'),
  ('Lahore'),
  ('Islamabad'),
  ('Rawalpindi'),
  ('Peshawar')
on conflict (name) do nothing;

insert into categories (name, slug, icon, description, sort_order)
values
  ('Healthcare', 'healthcare', 'stethoscope', 'Nurses, caregivers, physiotherapists, lab technicians, and home health support.', 10),
  ('Domestic Help', 'domestic-help', 'home', 'Maids, cooks, babysitters, gardeners, and daily home support staff.', 20),
  ('Education', 'education', 'graduation', 'Teachers, tutors, Quran teachers, home tutors, and handwriting teachers.', 30),
  ('Home Repairs', 'home-repairs', 'wrench', 'Electricians, plumbers, AC technicians, carpenters, painters, welders, and mechanics.', 40),
  ('Transport & Security', 'transport-and-security', 'car', 'Drivers, delivery riders, guards, office boys, and peons.', 50),
  ('Beauty & Creative', 'beauty-and-creative', 'palette', 'Beauticians, artists, graphic designers, photographers, event staff, and tailors.', 60)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  description = excluded.description,
  sort_order = excluded.sort_order;

with parent_categories as (
  select id, slug from categories where parent_id is null
)
insert into categories (name, slug, icon, description, parent_id, sort_order)
values
  ('Nurses', 'nurses', 'heart', 'Home nurses and patient care support.', (select id from parent_categories where slug = 'healthcare'), 11),
  ('Caregivers', 'caregivers', 'stethoscope', 'Caregivers for elderly and home support.', (select id from parent_categories where slug = 'healthcare'), 12),
  ('Physiotherapists', 'physiotherapists', 'heart', 'Physiotherapy and recovery support.', (select id from parent_categories where slug = 'healthcare'), 13),
  ('Lab Technicians', 'lab-technicians', 'stethoscope', 'Home sample collection and lab technician support.', (select id from parent_categories where slug = 'healthcare'), 14),
  ('Maids', 'maids', 'home', 'Domestic cleaning and house help.', (select id from parent_categories where slug = 'domestic-help'), 21),
  ('Cooks', 'cooks', 'chef', 'Home cooks and kitchen support.', (select id from parent_categories where slug = 'domestic-help'), 22),
  ('Babysitters', 'babysitters', 'users', 'Babysitters and child care support.', (select id from parent_categories where slug = 'domestic-help'), 23),
  ('Gardeners', 'gardeners', 'leaf', 'Garden and plant care services.', (select id from parent_categories where slug = 'domestic-help'), 24),
  ('Teachers', 'teachers', 'graduation', 'Teachers for school subjects and home learning.', (select id from parent_categories where slug = 'education'), 31),
  ('Tutors', 'tutors', 'graduation', 'Private tutors for students.', (select id from parent_categories where slug = 'education'), 32),
  ('Home Tutors', 'home-tutors', 'home', 'Home tutors for children and students.', (select id from parent_categories where slug = 'education'), 33),
  ('Quran Teachers', 'quran-teachers', 'graduation', 'Quran teachers for children and families.', (select id from parent_categories where slug = 'education'), 34),
  ('Handwriting Teachers', 'handwriting-teachers', 'paintbrush', 'Handwriting improvement teachers.', (select id from parent_categories where slug = 'education'), 35),
  ('Electricians', 'electricians', 'plug', 'Electrical repairs and wiring work.', (select id from parent_categories where slug = 'home-repairs'), 41),
  ('Plumbers', 'plumbers', 'wrench', 'Plumbing repairs and installation.', (select id from parent_categories where slug = 'home-repairs'), 42),
  ('AC Technicians', 'ac-technicians', 'drill', 'AC repair, service, and installation.', (select id from parent_categories where slug = 'home-repairs'), 43),
  ('Carpenters', 'carpenters', 'hammer', 'Carpentry and furniture repair.', (select id from parent_categories where slug = 'home-repairs'), 44),
  ('Painters', 'painters', 'palette', 'Home and office painting services.', (select id from parent_categories where slug = 'home-repairs'), 45),
  ('Welders', 'welders', 'drill', 'Welding and metal repair work.', (select id from parent_categories where slug = 'home-repairs'), 46),
  ('Mechanics', 'mechanics', 'wrench', 'Vehicle and machine mechanics.', (select id from parent_categories where slug = 'home-repairs'), 47),
  ('Drivers', 'drivers', 'car', 'Personal and commercial drivers.', (select id from parent_categories where slug = 'transport-and-security'), 51),
  ('Delivery Riders', 'delivery-riders', 'bike', 'Delivery riders for local delivery work.', (select id from parent_categories where slug = 'transport-and-security'), 52),
  ('Security Guards', 'security-guards', 'shield', 'Security guards for homes, offices, and events.', (select id from parent_categories where slug = 'transport-and-security'), 53),
  ('Office Boys', 'office-boys', 'briefcase', 'Office boys and workplace support.', (select id from parent_categories where slug = 'transport-and-security'), 54),
  ('Peons', 'peons', 'userCheck', 'Peons and support staff.', (select id from parent_categories where slug = 'transport-and-security'), 55),
  ('Beauticians', 'beauticians', 'scissors', 'Home and event beauty services.', (select id from parent_categories where slug = 'beauty-and-creative'), 61),
  ('Artists', 'artists', 'palette', 'Artists and creative workers.', (select id from parent_categories where slug = 'beauty-and-creative'), 62),
  ('Graphic Designers', 'graphic-designers', 'pencil', 'Graphic design and creative design services.', (select id from parent_categories where slug = 'beauty-and-creative'), 63),
  ('Photographers', 'photographers', 'image', 'Photography for events and businesses.', (select id from parent_categories where slug = 'beauty-and-creative'), 64),
  ('Event Staff', 'event-staff', 'contact', 'Event helpers and support staff.', (select id from parent_categories where slug = 'beauty-and-creative'), 65),
  ('Tailors', 'tailors', 'scissors', 'Tailoring and alteration services.', (select id from parent_categories where slug = 'beauty-and-creative'), 66)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  description = excluded.description,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order;

alter table categories enable row level security;
alter table cities enable row level security;
alter table professionals enable row level security;
alter table customers enable row level security;
alter table requirements enable row level security;
alter table professional_sessions enable row level security;
alter table requirement_notifications enable row level security;

drop policy if exists "Public can read categories" on categories;
create policy "Public can read categories" on categories
  for select using (true);

drop policy if exists "Public can read cities" on cities;
create policy "Public can read cities" on cities
  for select using (true);

drop policy if exists "Public can read active professionals" on professionals;
create policy "Public can read active professionals" on professionals
  for select using (is_active = true);

drop policy if exists "Public can register professionals" on professionals;
create policy "Public can register professionals" on professionals
  for insert with check (true);

drop policy if exists "Public can create customers" on customers;
create policy "Public can create customers" on customers
  for insert with check (true);

drop policy if exists "Public can create requirements" on requirements;
create policy "Public can create requirements" on requirements
  for insert with check (true);
