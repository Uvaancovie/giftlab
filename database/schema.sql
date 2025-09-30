-- === products (retail) ===
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  title text not null,
  description text,
  category text,
  created_at timestamptz default now(),
  price_cents int not null check (price_cents >= 0),
  currency text not null default 'ZAR',
  image_url text,
  stock int,
  is_active boolean default true,
  source text not null default 'retail'
);

-- === amrod cache ===
create table if not exists public.amrod_products (
  id bigint generated always as identity primary key,
  amrod_id text unique not null,
  name text not null,
  code text,
  price_cents int,
  currency text default 'ZAR',
  brand text,
  category text,
  image_url text,
  raw jsonb,
  updated_at timestamptz default now()
);

-- === carts ===
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts on delete cascade,
  product_source text not null,
  product_ref text not null,
  title text not null,
  unit_price_cents int not null,
  qty int not null check (qty > 0),
  image_url text
);

-- === orders & items ===
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  status text not null default 'awaiting_payment',
  total_cents int not null,
  shipping_cents int not null default 0,
  currency text not null default 'ZAR',
  invoice_number text unique,
  created_at timestamptz default now(),
  paid_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders on delete cascade,
  product_source text not null,
  product_ref text not null,
  title text not null,
  unit_price_cents int not null,
  qty int not null,
  image_url text
);

-- === invoices ===
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders on delete cascade,
  number text unique not null,
  pdf_url text,
  amount_cents int not null,
  issued_at timestamptz default now()
);

-- RLS
alter table carts enable row level security;
create policy if not exists cart_owner on carts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table orders enable row level security;
create policy if not exists order_owner on orders
for select using (auth.uid() = user_id);

alter table invoices enable row level security;
create policy if not exists invoice_owner on invoices
for select using (exists(select 1 from orders o where o.id = invoices.order_id and o.user_id = auth.uid()));