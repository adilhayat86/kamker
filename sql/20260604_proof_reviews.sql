create table if not exists proof_reviews (
  id uuid primary key default gen_random_uuid(),
  review_type text not null default 'general',
  related_id uuid,
  expected_amount_pkr integer not null default 0,
  image_url text not null,
  ai_readable boolean not null default false,
  ai_detected_amount_pkr integer,
  ai_detected_reference text,
  ai_detected_method text,
  ai_detected_date text,
  ai_confidence numeric(4, 3) not null default 0,
  ai_decision text not null default 'needs_review',
  ai_notes text,
  audit_status text not null default 'unchecked',
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proof-images',
  'proof-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'proof_images_public_read'
  ) then
    create policy proof_images_public_read
    on storage.objects for select
    using (bucket_id = 'proof-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'proof_images_insert'
  ) then
    create policy proof_images_insert
    on storage.objects for insert
    with check (bucket_id = 'proof-images');
  end if;
end $$;

create index if not exists proof_reviews_review_type_idx on proof_reviews(review_type);
create index if not exists proof_reviews_related_id_idx on proof_reviews(related_id);
create index if not exists proof_reviews_ai_decision_idx on proof_reviews(ai_decision);
create index if not exists proof_reviews_audit_status_idx on proof_reviews(audit_status);
