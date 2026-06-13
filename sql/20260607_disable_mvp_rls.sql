-- MVP deployment readiness:
-- The current app writes through the Supabase anon client from server actions.
-- Until the app is moved to server-only service-role writes with full RLS policies,
-- these tables must remain accessible for the existing MVP flows to work.

alter table if exists public.categories disable row level security;
alter table if exists public.cities disable row level security;
alter table if exists public.professionals disable row level security;
alter table if exists public.professional_sessions disable row level security;
alter table if exists public.customers disable row level security;
alter table if exists public.customer_sessions disable row level security;
alter table if exists public.requirements disable row level security;
alter table if exists public.requirement_notifications disable row level security;
alter table if exists public.requirement_matches disable row level security;
alter table if exists public.requirement_broadcast_payments disable row level security;
alter table if exists public.companies disable row level security;
alter table if exists public.company_packages disable row level security;
alter table if exists public.manual_payments disable row level security;
alter table if exists public.company_package_subscriptions disable row level security;
alter table if exists public.company_listings disable row level security;
alter table if exists public.company_media disable row level security;
alter table if exists public.proof_reviews disable row level security;
alter table if exists public.analytics_events disable row level security;
alter table if exists public.whatsapp_messages disable row level security;
alter table if exists public.admin_settings disable row level security;
alter table if exists public.admin_audit_logs disable row level security;
alter table if exists public.admin_passwords disable row level security;
alter table if exists public.admin_password_resets disable row level security;
