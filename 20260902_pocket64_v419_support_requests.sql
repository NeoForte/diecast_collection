create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  email text not null,
  category text not null check (category in ('Sign In','Create Account','Email Verification','Password','Other')),
  message text not null check (char_length(message) between 8 and 2000),
  app_version text,
  user_agent text,
  platform text,
  last_error text,
  user_id uuid references auth.users(id) on delete set null,
  ip_hash text,
  client_request_id uuid not null,
  status text not null default 'new' check (status in ('new','open','resolved','spam')),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists support_requests_ticket_code_key on public.support_requests(ticket_code);
create unique index if not exists support_requests_client_request_id_key on public.support_requests(client_request_id);
create index if not exists support_requests_created_at_idx on public.support_requests(created_at desc);
create index if not exists support_requests_unnotified_idx on public.support_requests(created_at) where notified_at is null;
create index if not exists support_requests_email_created_idx on public.support_requests(lower(email), created_at desc);
create index if not exists support_requests_ip_created_idx on public.support_requests(ip_hash, created_at desc) where ip_hash is not null;
alter table public.support_requests enable row level security;
