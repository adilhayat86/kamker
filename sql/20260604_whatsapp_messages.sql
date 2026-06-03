create table if not exists whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  recipient_phone text not null,
  message_type text not null default 'text',
  template_name text,
  body text,
  status text not null default 'pending',
  provider_message_id text,
  error_message text,
  related_type text,
  related_id uuid,
  request_payload jsonb,
  response_payload jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_recipient_phone_idx on whatsapp_messages(recipient_phone);
create index if not exists whatsapp_messages_status_idx on whatsapp_messages(status);
create index if not exists whatsapp_messages_related_idx on whatsapp_messages(related_type, related_id);
create index if not exists whatsapp_messages_created_at_idx on whatsapp_messages(created_at);
