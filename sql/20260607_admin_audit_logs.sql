create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target_type text not null,
  target_id text,
  admin_label text not null default 'password-admin',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_action_idx on admin_audit_logs(action);
create index if not exists admin_audit_logs_target_idx on admin_audit_logs(target_type, target_id);
create index if not exists admin_audit_logs_created_at_idx on admin_audit_logs(created_at);
