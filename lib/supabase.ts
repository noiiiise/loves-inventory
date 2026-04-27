import { createClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      locations: {
        Row: { id: string; name: string; type: string; parent_id: string | null; active: boolean; sort_order: number };
        Insert: { id: string; name: string; type: string; parent_id?: string | null; active?: boolean; sort_order?: number };
        Update: Partial<{ name: string; type: string; parent_id: string | null; active: boolean; sort_order: number }>;
      };
      flavors: {
        Row: { id: string; name: string; is_vegan: boolean; active: boolean };
        Insert: { id: string; name: string; is_vegan?: boolean; active?: boolean };
        Update: Partial<{ name: string; is_vegan: boolean; active: boolean }>;
      };
      pack_sizes: {
        Row: { id: string; name: string; oz: number };
        Insert: { id: string; name: string; oz: number };
        Update: Partial<{ name: string; oz: number }>;
      };
      skus: {
        Row: { id: string; flavor_id: string; pack_size_id: string; active: boolean };
        Insert: { id: string; flavor_id: string; pack_size_id: string; active?: boolean };
        Update: Partial<{ active: boolean }>;
      };
      stock_movements: {
        Row: { id: string; location_id: string; sku_id: string; delta: number; movement_type: string; reference_table: string | null; reference_id: string | null; recorded_by: string; recorded_at: string; notes: string | null };
        Insert: { location_id: string; sku_id: string; delta: number; movement_type: string; reference_table?: string | null; reference_id?: string | null; recorded_by: string; notes?: string | null };
        Update: never;
      };
      inventory_counts: {
        Row: { id: string; location_id: string; sku_id: string; counted_quantity: number; previous_system: number; recorded_by: string; recorded_at: string; notes: string | null };
        Insert: { location_id: string; sku_id: string; counted_quantity: number; previous_system: number; recorded_by: string; notes?: string | null };
        Update: never;
      };
      transfers: {
        Row: { id: string; from_location_id: string; to_location_id: string; sku_id: string; quantity: number; transferred_by: string; transferred_at: string; notes: string | null; flagged: boolean };
        Insert: { from_location_id: string; to_location_id: string; sku_id: string; quantity: number; transferred_by: string; notes?: string | null; flagged?: boolean };
        Update: never;
      };
      reorder_thresholds: {
        Row: { location_id: string; sku_id: string; min_quantity: number };
        Insert: { location_id: string; sku_id: string; min_quantity: number };
        Update: Partial<{ min_quantity: number }>;
      };
    };
    Views: {
      current_inventory: {
        Row: { location_id: string; sku_id: string; quantity: number };
      };
    };
    Functions: {
      record_count: {
        Args: { p_location_id: string; p_sku_id: string; p_quantity: number; p_initials: string; p_notes?: string | null };
        Returns: string;
      };
      record_transfer: {
        Args: { p_from_location_id: string; p_to_location_id: string; p_sku_id: string; p_quantity: number; p_initials: string; p_notes?: string | null };
        Returns: string;
      };
    };
  };
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(url, key);
