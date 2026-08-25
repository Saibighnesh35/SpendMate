-- SpendMate MVP: private, user-owned financial ledger. Apply with `supabase db push`.
create extension if not exists pgcrypto;

create type public.transaction_type as enum ('CREDIT', 'DEBIT');
create type public.transaction_source as enum ('MANUAL', 'SCREENSHOT', 'IMPORT');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', currency_code text not null default 'INR', timezone text not null default 'Asia/Kolkata',
  avatar_path text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  name text not null, color text not null default '#1e8b62', is_default boolean not null default false, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  name text not null, kind text not null default 'other', is_default boolean not null default false, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  amount_minor bigint not null check (amount_minor > 0), currency_code text not null default 'INR', type public.transaction_type not null,
  transaction_date date not null, category_id uuid references public.categories(id) on delete set null,
  payment_method_id uuid not null references public.payment_methods(id) on delete restrict, merchant text check (char_length(merchant) <= 120),
  note text check (char_length(note) <= 500), source public.transaction_source not null default 'MANUAL', idempotency_key uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique(user_id, idempotency_key)
);
create table public.transaction_attachments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null, storage_path text not null unique, mime_type text not null,
  size_bytes integer not null check(size_bytes > 0 and size_bytes <= 10485760), created_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.monthly_summaries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  month_start date not null, credits_minor bigint not null default 0, debits_minor bigint not null default 0, net_minor bigint not null default 0,
  generated_at timestamptz not null default now(), unique(user_id, month_start)
);
create table public.insights (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null, insight_type text not null, payload jsonb not null, generated_at timestamptz not null default now()
);
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade, theme text not null default 'system', default_transaction_type public.transaction_type not null default 'DEBIT',
  screenshot_retention_days integer, notifications_enabled boolean not null default false, updated_at timestamptz not null default now()
);
create table public.merchant_category_rules (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, normalized_merchant text not null,
  category_id uuid not null references public.categories(id) on delete cascade, confidence numeric(3,2) not null check(confidence between 0 and 1), updated_at timestamptz not null default now(), unique(user_id, normalized_merchant)
);

create index transactions_user_date_idx on public.transactions(user_id, transaction_date desc) where deleted_at is null;
create unique index categories_user_name_idx on public.categories(user_id, lower(name)) where user_id is not null;
create unique index payment_methods_user_name_idx on public.payment_methods(user_id, lower(name)) where user_id is not null;
create index transactions_user_type_date_idx on public.transactions(user_id, type, transaction_date) where deleted_at is null;
create index transactions_category_date_idx on public.transactions(user_id, category_id, transaction_date) where deleted_at is null;
create index transactions_payment_date_idx on public.transactions(user_id, payment_method_id, transaction_date) where deleted_at is null;

alter table public.profiles enable row level security; alter table public.categories enable row level security; alter table public.payment_methods enable row level security; alter table public.transactions enable row level security; alter table public.transaction_attachments enable row level security; alter table public.monthly_summaries enable row level security; alter table public.insights enable row level security; alter table public.user_preferences enable row level security; alter table public.merchant_category_rules enable row level security;
create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own categories or defaults" on public.categories for select using (user_id = auth.uid() or user_id is null);
create policy "own categories write" on public.categories for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own methods or defaults" on public.payment_methods for select using (user_id = auth.uid() or user_id is null);
create policy "own methods write" on public.payment_methods for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own transaction rows" on public.transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own attachments" on public.transaction_attachments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own summaries" on public.monthly_summaries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own insights" on public.insights for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own preferences" on public.user_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own merchant rules" on public.merchant_category_rules for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Use a private bucket. Signed URLs must be generated only after checking auth.uid().
insert into storage.buckets (id, name, public) values ('transaction-screenshots','transaction-screenshots',false) on conflict do nothing;
create policy "private screenshot objects" on storage.objects for all using (bucket_id = 'transaction-screenshots' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'transaction-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
