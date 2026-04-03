-- ============================================================
-- Manish Kejani E-Commerce — PostgreSQL Schema (Supabase)
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- USERS (covers both customers and admins via role field)
-- ============================================================
create table if not exists users (
  id                  uuid primary key default gen_random_uuid(),
  username            text not null unique,
  email               text not null unique,
  phone               text,
  password            text,
  refresh_token       text,
  auth_provider       text not null default 'local' check (auth_provider in ('local', 'google')),
  google_id           text unique,
  is_verified         boolean not null default false,
  verification_token  text,
  verification_expiry timestamptz,
  reset_code          text,
  reset_code_expiry   timestamptz,
  wishlist            uuid[] not null default '{}',
  last_login          timestamptz,
  role                text not null default 'user' check (role in ('user', 'admin')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  slug          text not null unique,
  description   text,
  icon          text,
  image_url     text,
  image_public_id text,
  is_active     boolean not null default true,
  product_count integer not null default 0,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text not null,
  price            numeric(12,2) not null check (price >= 0),
  original_price   numeric(12,2) check (original_price >= 0),
  discount_percent integer not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  category_id      uuid not null references categories(id) on delete restrict,
  subcategory      text,
  images           jsonb not null default '[]',
  status           text not null default 'in_stock' check (status in ('in_stock','low_stock','out_of_stock','coming_soon')),
  featured         boolean not null default false,
  is_flash_deal    boolean not null default false,
  is_new_arrival   boolean not null default false,
  rating           numeric(3,1) not null default 0 check (rating >= 0 and rating <= 5),
  reviews          integer not null default 0 check (reviews >= 0),
  specifications   jsonb not null default '[]',
  tags             text[] not null default '{}',
  sku              text unique,
  view_count       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- REVIEWS
-- ============================================================
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  rating     integer not null check (rating >= 1 and rating <= 5),
  comment    text not null,
  verified   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

-- ============================================================
-- PROMOTIONS
-- ============================================================
create table if not exists promotions (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  discount_percent integer not null check (discount_percent >= 1 and discount_percent <= 100),
  products         uuid[] not null default '{}',
  categories       uuid[] not null default '{}',
  start_date       timestamptz not null,
  end_date         timestamptz not null,
  is_active        boolean not null default true,
  banner_url       text,
  banner_public_id text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- INDEXES (matching all Mongoose indexes)
-- ============================================================
create index if not exists idx_products_category    on products(category_id, status);
create index if not exists idx_products_featured    on products(featured);
create index if not exists idx_products_flash_deal  on products(is_flash_deal);
create index if not exists idx_products_new_arrival on products(is_new_arrival);
create index if not exists idx_products_price       on products(price);
create index if not exists idx_products_rating      on products(rating desc);
create index if not exists idx_products_created     on products(created_at desc);
create index if not exists idx_products_status      on products(status, featured desc, created_at desc);
create index if not exists idx_products_fts         on products using gin(to_tsvector('english', name || ' ' || description));
create index if not exists idx_reviews_product      on reviews(product_id, created_at desc);
create index if not exists idx_reviews_user         on reviews(user_id);
create index if not exists idx_categories_active    on categories(is_active, sort_order);

-- ============================================================
-- AUTO-UPDATE updated_at trigger
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_users_updated_at
  before update on users for each row execute function update_updated_at();

create or replace trigger trg_categories_updated_at
  before update on categories for each row execute function update_updated_at();

create or replace trigger trg_products_updated_at
  before update on products for each row execute function update_updated_at();

create or replace trigger trg_reviews_updated_at
  before update on reviews for each row execute function update_updated_at();

create or replace trigger trg_promotions_updated_at
  before update on promotions for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY — disable for service role (backend uses service key)
-- ============================================================
alter table users       disable row level security;
alter table categories  disable row level security;
alter table products    disable row level security;
alter table reviews     disable row level security;
alter table promotions  disable row level security;
