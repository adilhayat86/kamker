-- Cutover only: signing-secret rotation is a separate deployment operation.
-- Preserve worker/customer account rows and password hashes.
begin;
delete from public.professional_sessions;
delete from public.customer_sessions;
delete from public.admin_password_resets;
commit;
