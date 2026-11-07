create table if not exists public.atlax_private_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('profile', 'schedules', 'reports', 'rates')),
  record_id text not null,
  ciphertext text not null,
  iv text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, record_id)
);

create table if not exists public.atlax_push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atlax_notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  dedup_key text not null,
  schedule_id text,
  obligation text check (obligation in ('payment', 'report')),
  due_date date,
  status text,
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, dedup_key)
);

alter table public.atlax_notifications add column if not exists schedule_id text;
alter table public.atlax_notifications add column if not exists obligation text;
alter table public.atlax_notifications add column if not exists due_date date;
alter table public.atlax_notifications add column if not exists status text;

create index if not exists atlax_notifications_user_created_idx
  on public.atlax_notifications (user_id, created_at desc);
create index if not exists atlax_private_records_kind_idx
  on public.atlax_private_records (kind, user_id);

alter table public.atlax_private_records enable row level security;
alter table public.atlax_push_subscriptions enable row level security;
alter table public.atlax_notifications enable row level security;

revoke all on public.atlax_private_records from anon, authenticated;
revoke all on public.atlax_push_subscriptions from anon, authenticated;
revoke all on public.atlax_notifications from anon, authenticated;

grant all on public.atlax_private_records to service_role;
grant all on public.atlax_push_subscriptions to service_role;
grant all on public.atlax_notifications to service_role;
grant usage, select on sequence public.atlax_notifications_id_seq to service_role;

comment on table public.atlax_private_records is
  'ATLAX data encrypted by the secure-data Edge Function; client roles have no direct table access.';
