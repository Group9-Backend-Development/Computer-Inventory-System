create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'technician' check (role in ('admin', 'technician')),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  item_id text not null unique,
  serial_number text not null,
  model text not null,
  brand text not null,
  classification text not null check (classification in ('Computer', 'Peripheral')),
  category text not null,
  status text not null default 'Available' check (status in ('Available', 'In-Use', 'Maintenance', 'Retired')),
  date_acquired timestamptz not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete restrict,
  type text not null check (type in ('checkout', 'checkin')),
  assignee_id uuid references public.users(id) on delete set null,
  performed_by_id uuid not null references public.users(id) on delete restrict,
  document_path text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null,
  label text,
  created_by_id uuid not null references public.users(id) on delete restrict,
  is_revoked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists api_keys_key_hash_idx on public.api_keys(key_hash);
create index if not exists items_item_id_idx on public.items(item_id);
create index if not exists transactions_item_id_created_at_idx on public.transactions(item_id, created_at);
create index if not exists transactions_assignee_id_idx on public.transactions(assignee_id);
create index if not exists transactions_performed_by_id_idx on public.transactions(performed_by_id);