import { getLocations, getFlavors, getPackSizes, getCurrentInventory, getThresholds, getRecentCountNotes } from "@/lib/inventory";
import InventoryGrid from "@/components/InventoryGrid";
import RecentNotes from "@/components/RecentNotes";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [locations, flavors, packSizes, stock, thresholds, countNotes] = await Promise.all([
    getLocations(),
    getFlavors(),
    getPackSizes(),
    getCurrentInventory(),
    getThresholds(),
    getRecentCountNotes(),
  ]);

  const alertCount = (() => {
    const stockMap = new Map(stock.map((r) => [`${r.location_id}__${r.sku_id}`, r.quantity]));
    return thresholds.filter((t) => (stockMap.get(`${t.location_id}__${t.sku_id}`) ?? 0) <= t.min_quantity).length;
  })();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Inventory Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Current stock across all locations</p>
        </div>
        <div className="flex gap-2">
          {alertCount > 0 && (
            <Link
              href="/alerts"
              className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              {alertCount} Alert{alertCount !== 1 ? "s" : ""}
            </Link>
          )}
          <Link
            href="/count"
            className="bg-[#1E3A5F] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#162d4a] transition-colors"
          >
            Log Count
          </Link>
          <Link
            href="/transfer"
            className="bg-[#93C5FD] text-[#1E3A5F] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#7bb3f5] transition-colors"
          >
            Transfer
          </Link>
        </div>
      </div>

      <InventoryGrid
        locations={locations}
        flavors={flavors}
        packSizes={packSizes}
        stock={stock}
        thresholds={thresholds}
      />

      <RecentNotes notes={countNotes} locations={locations} />
    </div>
  );
}
