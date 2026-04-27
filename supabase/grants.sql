-- Grant read/write access to the anon role for all app tables
grant usage on schema public to anon;

grant select on locations, flavors, pack_sizes, skus to anon;
grant select, insert, update on reorder_thresholds to anon;
grant select, insert on inventory_counts, stock_movements, transfers to anon;
grant select on current_inventory to anon;

grant execute on function record_count(text, text, int, text, text) to anon;
grant execute on function record_transfer(text, text, text, int, text, text) to anon;
