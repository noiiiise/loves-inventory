import { getAlerts, getLocations, getFlavors, getPackSizes } from "@/lib/inventory";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const [alerts, locations, flavors, packSizes] = await Promise.all([
    getAlerts(),
    getLocations(),
    getFlavors(),
    getPackSizes(),
  ]);

  const locationMap = new Map(locations.map((l) => [l.id, l.name]));
  const flavorMap = new Map(flavors.map((f) => [f.id, f.name]));
  const packMap = new Map(packSizes.map((p) => [p.id, p.name]));

  function parseSku(skuId: string) {
    const [flavorId, packId] = skuId.split("__");
    return { flavorName: flavorMap.get(flavorId) ?? flavorId, packName: packMap.get(packId) ?? packId };
  }

  const critical = alerts.filter((a) => a.quantity === 0);
  const low = alerts.filter((a) => a.quantity > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Reorder Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {alerts.length === 0 ? "All locations are stocked" : `${alerts.length} item${alerts.length !== 1 ? "s" : ""} at or below threshold`}
          </p>
        </div>
        <Link href="/admin" className="text-sm text-[#1E3A5F] underline underline-offset-2">
          Edit Thresholds
        </Link>
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-lg font-semibold">All good! No low-stock items.</p>
        </div>
      )}

      {critical.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">Out of Stock</h2>
          <div className="space-y-2">
            {critical.map((alert) => {
              const { flavorName, packName } = parseSku(alert.sku_id);
              const transferUrl = `/transfer?from=igloo&to=${alert.location_id}&sku=${alert.sku_id}`;
              return (
                <div key={`${alert.location_id}__${alert.sku_id}`}
                  className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-red-800">{flavorName}</p>
                    <p className="text-xs text-red-600">{packName} · {locationMap.get(alert.location_id)}</p>
                    <p className="text-xs text-red-500 mt-0.5">
                      0 on hand · threshold {alert.min_quantity}
                    </p>
                  </div>
                  <Link href={transferUrl}
                    className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl whitespace-nowrap hover:bg-red-700 transition-colors">
                    Restock
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {low.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3">Low Stock</h2>
          <div className="space-y-2">
            {low.map((alert) => {
              const { flavorName, packName } = parseSku(alert.sku_id);
              const transferUrl = `/transfer?from=igloo&to=${alert.location_id}&sku=${alert.sku_id}`;
              return (
                <div key={`${alert.location_id}__${alert.sku_id}`}
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-amber-800">{flavorName}</p>
                    <p className="text-xs text-amber-600">{packName} · {locationMap.get(alert.location_id)}</p>
                    <p className="text-xs text-amber-500 mt-0.5">
                      {alert.quantity} on hand · threshold {alert.min_quantity} · need {alert.shortfall} more
                    </p>
                  </div>
                  <Link href={transferUrl}
                    className="bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-xl whitespace-nowrap hover:bg-amber-600 transition-colors">
                    Restock
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
