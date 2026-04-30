import { supabase } from "./supabase";

export type Location = { id: string; name: string; type: string; active: boolean; sort_order: number };
export type Flavor = { id: string; name: string; is_vegan: boolean; active: boolean };
export type PackSize = { id: string; name: string; oz: number };
export type Sku = { id: string; flavor_id: string; pack_size_id: string; active: boolean };
export type StockRow = { location_id: string; sku_id: string; quantity: number };
export type Threshold = { location_id: string; sku_id: string; min_quantity: number };
export type Transfer = {
  id: string; from_location_id: string; to_location_id: string;
  sku_id: string; quantity: number; transferred_by: string;
  transferred_at: string; notes: string | null; flagged: boolean;
};

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getFlavors(): Promise<Flavor[]> {
  const { data, error } = await supabase
    .from("flavors")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getPackSizes(): Promise<PackSize[]> {
  const { data, error } = await supabase
    .from("pack_sizes")
    .select("*")
    .order("oz", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSkus(): Promise<Sku[]> {
  const { data, error } = await supabase
    .from("skus")
    .select("*")
    .eq("active", true);
  if (error) throw error;
  return data;
}

export async function getCurrentInventory(): Promise<StockRow[]> {
  const { data, error } = await supabase
    .from("current_inventory")
    .select("*");
  if (error) throw error;
  return data ?? [];
}

export async function getStockForLocation(locationId: string): Promise<StockRow[]> {
  const { data, error } = await supabase
    .from("current_inventory")
    .select("*")
    .eq("location_id", locationId);
  if (error) throw error;
  return data ?? [];
}

export async function getThresholds(): Promise<Threshold[]> {
  const { data, error } = await supabase
    .from("reorder_thresholds")
    .select("*");
  if (error) throw error;
  return data ?? [];
}

export async function recordCount(
  locationId: string,
  skuId: string,
  quantity: number,
  initials: string,
  notes?: string
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("record_count", {
    p_location_id: locationId,
    p_sku_id: skuId,
    p_quantity: quantity,
    p_initials: initials.toUpperCase().trim(),
    p_notes: notes ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function recordTransfer(
  fromLocationId: string,
  toLocationId: string,
  skuId: string,
  quantity: number,
  initials: string,
  notes?: string
): Promise<{ id: string; flagged: boolean }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("record_transfer", {
    p_from_location_id: fromLocationId,
    p_to_location_id: toLocationId,
    p_sku_id: skuId,
    p_quantity: quantity,
    p_initials: initials.toUpperCase().trim(),
    p_notes: notes ?? null,
  });
  if (error) throw error;
  // Fetch the flagged status of the new transfer
  const { data: transfer } = await supabase
    .from("transfers")
    .select("id, flagged")
    .eq("id", data)
    .single();
  return transfer ?? { id: data, flagged: false };
}

export async function updateThreshold(
  locationId: string,
  skuId: string,
  minQuantity: number
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("reorder_thresholds")
    .upsert({ location_id: locationId, sku_id: skuId, min_quantity: minQuantity });
  if (error) throw error;
}

export async function toggleFlavorActive(flavorId: string, active: boolean): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("flavors")
    .update({ active })
    .eq("id", flavorId);
  if (error) throw error;
}

export type CountNote = {
  id: string;
  location_id: string;
  recorded_by: string;
  recorded_at: string;
  notes: string;
};

export async function getRecentCountNotes(): Promise<CountNote[]> {
  const { data, error } = await supabase
    .from("inventory_counts")
    .select("id, location_id, recorded_by, recorded_at, notes")
    .not("notes", "is", null)
    .neq("notes", "")
    .order("recorded_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  // Each submission writes one row per SKU — deduplicate to one row per
  // (location, initials, note, minute) so the log shows one entry per count.
  const seen = new Set<string>();
  return (data ?? []).filter((row) => {
    const key = `${row.location_id}|${row.recorded_by}|${row.notes}|${row.recorded_at.slice(0, 16)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 50) as CountNote[];
}

export async function getAlerts(): Promise<
  Array<{ location_id: string; sku_id: string; quantity: number; min_quantity: number; shortfall: number }>
> {
  const [inventory, thresholds] = await Promise.all([
    getCurrentInventory(),
    getThresholds(),
  ]);

  const stockMap = new Map(inventory.map((r) => [`${r.location_id}__${r.sku_id}`, r.quantity]));

  return thresholds
    .map((t) => {
      const qty = stockMap.get(`${t.location_id}__${t.sku_id}`) ?? 0;
      return { location_id: t.location_id, sku_id: t.sku_id, quantity: qty, min_quantity: t.min_quantity, shortfall: t.min_quantity - qty };
    })
    .filter((a) => a.quantity <= a.min_quantity)
    .sort((a, b) => a.shortfall - b.shortfall);
}
