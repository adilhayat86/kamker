create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema storage;
create table storage.buckets(id text primary key, public boolean, file_size_limit bigint);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
grant usage on schema storage,public to anon, authenticated, service_role;
grant all on all tables in schema storage to service_role;
insert into storage.buckets values('proof-images',true,8388608);
create table public."categories" (
"id" bigint generated always as identity primary key,
"name" text,
"slug" text,
"icon" text,
"description" text,
"parent_id" bigint,
"sort_order" integer default 0,
"created_at" timestamp with time zone default now()
);
create table public."cities" (
"id" bigint generated always as identity primary key,
"name" text,
"created_at" timestamp with time zone default now()
);
create table public."professionals" (
"id" uuid default gen_random_uuid() primary key,
"full_name" text,
"phone_number" text,
"whatsapp_number" text,
"city_id" bigint,
"area" text,
"category_id" bigint,
"experience" text,
"expected_rate" text,
"short_bio" text,
"cnic" text,
"profile_photo_url" text,
"password_hash" text,
"secret_question" text,
"secret_answer_hash" text,
"is_cnic_verified" boolean default false,
"is_phone_verified" boolean default false,
"rating" numeric default 0,
"is_active" boolean default false,
"is_featured" boolean default false,
"featured_until" timestamp with time zone,
"created_at" timestamp with time zone default now(),
"gender" text,
"age" integer,
"availability" text,
"availability_time" text,
"availability_days" text,
"years_experience" integer,
"tagline" text,
"phone_normalized" text,
"is_banned" boolean default false
);
create table public."professional_sessions" (
"id" uuid default gen_random_uuid() primary key,
"professional_id" uuid,
"session_token_hash" text,
"expires_at" timestamp with time zone,
"created_at" timestamp with time zone default now()
);
create table public."customers" (
"id" uuid default gen_random_uuid() primary key,
"full_name" text,
"phone_number" text,
"city_id" bigint,
"area" text,
"created_at" timestamp with time zone default now(),
"phone_normalized" text,
"password_hash" text
);
create table public."requirements" (
"id" uuid default gen_random_uuid() primary key,
"customer_id" uuid,
"required_service" text,
"city_id" bigint,
"area" text,
"details" text,
"budget" text,
"phone_number" text,
"whatsapp_number" text,
"urgency" text,
"status" text default 'open'::text,
"broadcast_status" text default 'pending_payment'::text,
"payment_status" text default 'unpaid'::text,
"created_at" timestamp with time zone default now(),
"availability" text
);
create table public."requirement_notifications" (
"id" uuid default gen_random_uuid() primary key,
"requirement_id" uuid,
"professional_id" uuid,
"channel" text default 'app'::text,
"status" text default 'pending'::text,
"sent_at" timestamp with time zone,
"created_at" timestamp with time zone default now()
);
create table public."requirement_matches" (
"id" uuid default gen_random_uuid() primary key,
"requirement_id" uuid,
"professional_id" uuid,
"match_score" integer,
"created_at" timestamp with time zone default now(),
"company_listing_id" uuid
);
create table public."admin_settings" (
"key" text primary key,
"value" text,
"updated_at" timestamp with time zone default now()
);
create table public."companies" (
"id" uuid default gen_random_uuid() primary key,
"owner_user_id" uuid,
"company_name" text,
"category" text,
"city" text,
"area" text,
"contact_person" text,
"phone" text,
"whatsapp" text,
"description" text,
"license_number" text,
"logo_url" text,
"verification_status" text default 'pending'::text,
"payment_status" text default 'unpaid'::text,
"created_at" timestamp with time zone default now(),
"updated_at" timestamp with time zone default now()
);
create table public."company_packages" (
"id" uuid default gen_random_uuid() primary key,
"package_key" text,
"title" text,
"description" text,
"price_pkr" integer,
"duration_days" integer,
"listings_limit" integer,
"featured_limit" integer,
"active" boolean default true,
"created_at" timestamp with time zone default now(),
"updated_at" timestamp with time zone default now()
);
create table public."manual_payments" (
"id" uuid default gen_random_uuid() primary key,
"user_id" uuid,
"company_id" uuid,
"package_id" uuid,
"package_key" text,
"amount_pkr" integer,
"payment_method" text,
"payer_name" text,
"sender_phone" text,
"transaction_reference" text,
"notes" text,
"status" text default 'pending_review'::text,
"admin_notes" text,
"reviewed_by" uuid,
"reviewed_at" timestamp with time zone,
"created_at" timestamp with time zone default now(),
"updated_at" timestamp with time zone default now()
);
create table public."company_package_subscriptions" (
"id" uuid default gen_random_uuid() primary key,
"company_id" uuid,
"package_id" uuid,
"manual_payment_id" uuid,
"package_key" text,
"listings_limit" integer,
"featured_limit" integer,
"starts_at" timestamp with time zone,
"expires_at" timestamp with time zone,
"status" text default 'active'::text,
"created_at" timestamp with time zone default now(),
"updated_at" timestamp with time zone default now()
);
create table public."company_listings" (
"id" uuid default gen_random_uuid() primary key,
"company_id" uuid,
"title" text,
"service_group" text,
"category" text,
"city" text,
"area" text,
"description" text,
"hourly_rate" integer,
"monthly_rate" integer,
"profile_photo_url" text,
"tagline" text,
"gender" text,
"age" integer,
"availability" text,
"years_experience" integer,
"phone" text,
"whatsapp" text,
"is_featured" boolean default false,
"status" text default 'pending'::text,
"created_at" timestamp with time zone default now(),
"updated_at" timestamp with time zone default now(),
"photo_url" text
);
create table public."company_media" (
"id" uuid default gen_random_uuid() primary key,
"company_id" uuid,
"url" text,
"media_type" text,
"caption" text,
"sort_order" integer default 0,
"created_at" timestamp with time zone default now()
);
create table public."admin_passwords" (
"role" text primary key,
"password_hash" text,
"updated_at" timestamp with time zone default now()
);
create table public."admin_password_resets" (
"id" uuid default gen_random_uuid() primary key,
"role" text,
"token_hash" text,
"expires_at" timestamp with time zone,
"used_at" timestamp with time zone,
"created_at" timestamp with time zone default now()
);
create table public."admin_audit_logs" (
"id" uuid default gen_random_uuid() primary key,
"action" text,
"target_type" text,
"target_id" text,
"admin_label" text default 'password-admin'::text,
"metadata" jsonb default '{}'::jsonb,
"created_at" timestamp with time zone default now()
);
create table public."analytics_events" (
"id" uuid default gen_random_uuid() primary key,
"event_type" text,
"target_type" text,
"target_id" uuid,
"metadata" jsonb default '{}'::jsonb,
"created_at" timestamp with time zone default now()
);
create table public."proof_reviews" (
"id" uuid default gen_random_uuid() primary key,
"review_type" text default 'general'::text,
"related_id" uuid,
"expected_amount_pkr" integer default 0,
"image_url" text,
"ai_readable" boolean default false,
"ai_detected_amount_pkr" integer,
"ai_detected_reference" text,
"ai_detected_method" text,
"ai_detected_date" text,
"ai_confidence" numeric default 0,
"ai_decision" text default 'needs_review'::text,
"ai_notes" text,
"audit_status" text default 'unchecked'::text,
"created_at" timestamp with time zone default now()
);
create table public."whatsapp_messages" (
"id" uuid default gen_random_uuid() primary key,
"recipient_phone" text,
"message_type" text default 'text'::text,
"template_name" text,
"body" text,
"status" text default 'pending'::text,
"provider_message_id" text,
"error_message" text,
"related_type" text,
"related_id" uuid,
"request_payload" jsonb,
"response_payload" jsonb,
"sent_at" timestamp with time zone,
"created_at" timestamp with time zone default now()
);
create table public."customer_sessions" (
"id" uuid default gen_random_uuid() primary key,
"customer_id" uuid,
"session_token_hash" text,
"expires_at" timestamp with time zone,
"created_at" timestamp with time zone default now()
);
create table public."requirement_broadcast_payments" (
"id" uuid default gen_random_uuid() primary key,
"requirement_id" uuid,
"amount_pkr" integer default 35,
"payment_method" text default 'easypaisa'::text,
"payer_name" text,
"sender_phone" text,
"transaction_reference" text,
"proof_review_id" uuid,
"proof_image_url" text,
"proof_storage_path" text,
"status" text default 'pending_review'::text,
"broadcast_status" text default 'pending_payment'::text,
"ai_decision" text,
"ai_detected_amount_pkr" integer,
"ai_confidence" numeric,
"admin_notes" text,
"reviewed_at" timestamp with time zone,
"created_at" timestamp with time zone default now(),
"updated_at" timestamp with time zone default now()
);
grant all on all tables in schema public to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;
