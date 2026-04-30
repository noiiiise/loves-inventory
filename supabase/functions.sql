-- ============================================================
-- Loves Ice Cream — Atomic Postgres RPC Functions
-- ============================================================

-- record_count: authoritative snapshot from an employee
-- Reads current system stock, writes inventory_counts + stock_movements delta
create or replace function record_count(
  p_location_id   text,
  p_sku_id        text,
  p_quantity      int,
  p_initials      text,
  p_notes         text default null,
  p_submission_id uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_current      int;
  v_delta        int;
  v_count_id     uuid;
  v_movement_id  uuid;
begin
  -- Lock the row to prevent race conditions on the same location+sku
  perform pg_advisory_xact_lock(hashtext(p_location_id || p_sku_id));

  -- Current system stock
  select coalesce(sum(delta), 0)::int
  into v_current
  from stock_movements
  where location_id = p_location_id and sku_id = p_sku_id;

  v_delta := p_quantity - v_current;

  -- Write the verbatim count record
  insert into inventory_counts (location_id, sku_id, counted_quantity, previous_system, recorded_by, notes, submission_id)
  values (p_location_id, p_sku_id, p_quantity, v_current, p_initials, p_notes, p_submission_id)
  returning id into v_count_id;

  -- Write the ledger delta (only if something changed)
  if v_delta != 0 then
    insert into stock_movements (location_id, sku_id, delta, movement_type, reference_table, reference_id, recorded_by, notes)
    values (p_location_id, p_sku_id, v_delta, 'count_adjustment', 'inventory_counts', v_count_id, p_initials, p_notes)
    returning id into v_movement_id;
  end if;

  return v_count_id;
end;
$$;


-- record_transfer: moves product from one location to another
-- Writes transfers + two stock_movements rows; flags unusual quantity
create or replace function record_transfer(
  p_from_location_id text,
  p_to_location_id   text,
  p_sku_id           text,
  p_quantity         int,
  p_initials         text,
  p_notes            text default null
)
returns uuid
language plpgsql
as $$
declare
  v_transfer_id   uuid;
  v_avg_30d       numeric;
  v_flagged       boolean := false;
begin
  -- Lock both locations in consistent order to prevent deadlocks
  perform pg_advisory_xact_lock(hashtext(least(p_from_location_id, p_to_location_id) || p_sku_id));
  perform pg_advisory_xact_lock(hashtext(greatest(p_from_location_id, p_to_location_id) || p_sku_id));

  -- 30-day rolling average for anomaly detection on this lane
  select coalesce(avg(quantity), 0)
  into v_avg_30d
  from transfers
  where from_location_id = p_from_location_id
    and to_location_id   = p_to_location_id
    and sku_id           = p_sku_id
    and transferred_at   > now() - interval '30 days';

  -- Flag if quantity is more than 2x the average (and average is non-trivial)
  if v_avg_30d > 1 and p_quantity > v_avg_30d * 2 then
    v_flagged := true;
  end if;

  -- Write transfer record
  insert into transfers (from_location_id, to_location_id, sku_id, quantity, transferred_by, notes, flagged)
  values (p_from_location_id, p_to_location_id, p_sku_id, p_quantity, p_initials, p_notes, v_flagged)
  returning id into v_transfer_id;

  -- Ledger: subtract from source
  insert into stock_movements (location_id, sku_id, delta, movement_type, reference_table, reference_id, recorded_by, notes)
  values (p_from_location_id, p_sku_id, -p_quantity, 'transfer_out', 'transfers', v_transfer_id, p_initials, p_notes);

  -- Ledger: add to destination
  insert into stock_movements (location_id, sku_id, delta, movement_type, reference_table, reference_id, recorded_by, notes)
  values (p_to_location_id, p_sku_id, p_quantity, 'transfer_in', 'transfers', v_transfer_id, p_initials, p_notes);

  return v_transfer_id;
end;
$$;
