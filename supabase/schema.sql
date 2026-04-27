-- ============================================================
-- Loves Ice Cream — Inventory Management Schema
-- ============================================================

-- Locations: 'type' open text so Hudsonville/Cedarcrest/VIP slot in later
create table if not exists locations (
  id           text primary key,
  name         text not null,
  type         text not null,  -- 'production_hub' | 'scoop_shop' | 'mobile_unit' | 'satellite'
  parent_id    text references locations(id),
  active       boolean not null default true,
  sort_order   int not null default 0
);

create table if not exists flavors (
  id       text primary key,
  name     text not null,
  is_vegan boolean not null default false,
  active   boolean not null default true
);

create table if not exists pack_sizes (
  id   text primary key,  -- 'pint' | 'single_serve'
  name text not null,
  oz   numeric not null
);

create table if not exists skus (
  id            text primary key,  -- '<flavor_id>__<pack_size_id>'
  flavor_id     text not null references flavors(id),
  pack_size_id  text not null references pack_sizes(id),
  active        boolean not null default true,
  unique (flavor_id, pack_size_id)
);

-- Append-only ledger. Current stock = SUM(delta) per (location, sku).
create table if not exists stock_movements (
  id              uuid primary key default gen_random_uuid(),
  location_id     text not null references locations(id),
  sku_id          text not null references skus(id),
  delta           int  not null,
  movement_type   text not null,  -- 'count_adjustment' | 'transfer_in' | 'transfer_out'
  reference_table text,
  reference_id    uuid,
  recorded_by     text not null,
  recorded_at     timestamptz not null default now(),
  notes           text
);
create index if not exists idx_stock_movements_loc_sku on stock_movements (location_id, sku_id, recorded_at desc);

-- Verbatim count the employee typed (audit trail)
create table if not exists inventory_counts (
  id                uuid primary key default gen_random_uuid(),
  location_id       text not null references locations(id),
  sku_id            text not null references skus(id),
  counted_quantity  int  not null check (counted_quantity >= 0),
  previous_system   int  not null,
  recorded_by       text not null,
  recorded_at       timestamptz not null default now(),
  notes             text
);

create table if not exists transfers (
  id                uuid primary key default gen_random_uuid(),
  from_location_id  text not null references locations(id),
  to_location_id    text not null references locations(id),
  sku_id            text not null references skus(id),
  quantity          int  not null check (quantity > 0),
  transferred_by    text not null,
  transferred_at    timestamptz not null default now(),
  notes             text,
  flagged           boolean not null default false
);

create table if not exists reorder_thresholds (
  location_id   text not null references locations(id),
  sku_id        text not null references skus(id),
  min_quantity  int  not null check (min_quantity >= 0),
  primary key (location_id, sku_id)
);

-- Current stock view
create or replace view current_inventory as
  select location_id, sku_id, coalesce(sum(delta), 0)::int as quantity
  from stock_movements
  group by location_id, sku_id;
