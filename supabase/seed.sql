-- ============================================================
-- Loves Ice Cream — Seed Data
-- ============================================================

-- Locations
insert into locations (id, name, type, sort_order) values
  ('igloo',        'The Igloo (Downtown GR)',      'production_hub', 0),
  ('ada',          'Ada Scoop Shop',                'scoop_shop',     1),
  ('holland',      'Holland Scoop Shop',            'scoop_shop',     2),
  ('amphitheater', 'Amphitheater',                  'mobile_unit',    3),
  ('meijer',       'Fredrick Meijer Gardens',       'satellite',      4)
on conflict (id) do nothing;

-- Pack sizes
insert into pack_sizes (id, name, oz) values
  ('pint',         'Pint (16oz)',     16),
  ('single_serve', '2.5 Gallon Tub', 320)
on conflict (id) do nothing;

-- 16 Flavors — Dairy (8) and Vegan Non-Dairy (8)
insert into flavors (id, name, is_vegan) values
  -- Dairy
  ('almond_toffee_crunch',  'Almond Toffee Crunch',  false),
  ('cookies_cream',         'Cookies & Cream',        false),
  ('milk_choc_brownie',     'Milk Chocolate Brownie', false),
  ('cookie_doh',            'Cookie Doh!',            false),
  ('vanilla_bean',          'Vanilla Bean',           false),
  ('madcap_coffee',         'Madcap Coffee',          false),
  ('peppermint_stick',      'Peppermint Stick',       false),
  ('cashew_caramel',        'Cashew Caramel',         false),
  -- Vegan Non-Dairy
  ('amaretto_cherry',       'Amaretto Cherry',        true),
  ('blood_orange_mango',    'Blood Orange Mango',     true),
  ('coconut_fudge_ripple',  'Coconut Fudge Ripple',   true),
  ('chai_latte',            'Chai Latté',             true),
  ('dark_chocolate',        'Dark Chocolate',         true),
  ('lavender_blueberry',    'Lavender Blueberry',     true),
  ('peanut_butter',         'Peanut Butter',          true),
  ('dreamy_strawberry',     'Dreamy Strawberry',      true)
on conflict (id) do nothing;

-- SKUs: every flavor × every pack size (32 total)
insert into skus (id, flavor_id, pack_size_id)
select
  f.id || '__' || p.id,
  f.id,
  p.id
from flavors f cross join pack_sizes p
on conflict (id) do nothing;

-- Default reorder thresholds per location × SKU
-- Igloo (main warehouse) — higher thresholds since it's the source
-- Satellite locations — lower thresholds
insert into reorder_thresholds (location_id, sku_id, min_quantity)
select
  l.id,
  s.id,
  case
    when l.id = 'igloo'        then 10
    when l.id in ('ada', 'holland') then 3
    else 2
  end
from locations l cross join skus s
on conflict (location_id, sku_id) do nothing;
