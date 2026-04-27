"use client";

import { useState } from "react";
import AlertBadge from "./AlertBadge";
import type { Location, Flavor, PackSize, StockRow, Threshold } from "@/lib/inventory";

type Props = {
  locations: Location[];
  flavors: Flavor[];
  packSizes: PackSize[];
  stock: StockRow[];
  thresholds: Threshold[];
};

export default function InventoryGrid({ locations, flavors, packSizes, stock, thresholds }: Props) {
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterFlavor, setFilterFlavor] = useState<string>("all");

  const stockMap = new Map(stock.map((r) => [`${r.location_id}__${r.sku_id}`, r.quantity]));
  const thresholdMap = new Map(thresholds.map((t) => [`${t.location_id}__${t.sku_id}`, t.min_quantity]));

  const visibleLocations = filterLocation === "all" ? locations : locations.filter((l) => l.id === filterLocation);
  const visibleFlavors = filterFlavor === "all" ? flavors.filter((f) => f.active) : flavors.filter((f) => f.id === filterFlavor && f.active);

  const alertCount = Array.from(stockMap.entries()).filter(([key, qty]) => {
    const threshold = thresholdMap.get(key) ?? 0;
    return qty <= threshold;
  }).length;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="all">All Locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select
          value={filterFlavor}
          onChange={(e) => setFilterFlavor(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="all">All Flavors</option>
          {flavors.filter((f) => f.active).map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        {alertCount > 0 && (
          <span className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-1.5 rounded">
            {alertCount} low-stock alert{alertCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-[#1E3A5F] text-white">
            <tr>
              <th className="sticky left-0 bg-[#1E3A5F] text-left px-3 py-2.5 font-semibold whitespace-nowrap z-10 min-w-[140px]">
                Flavor
              </th>
              <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap text-[#93C5FD] text-xs">
                Size
              </th>
              {visibleLocations.map((l) => (
                <th key={l.id} className="text-center px-3 py-2.5 font-semibold whitespace-nowrap min-w-[90px]">
                  {l.name.split(" ")[0]}
                  <span className="block text-[10px] font-normal text-[#93C5FD]">
                    {l.name.includes("(") ? l.name.match(/\(([^)]+)\)/)?.[1] : l.type.replace("_", " ")}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleFlavors.map((flavor, fi) =>
              packSizes.map((pack, pi) => {
                const skuId = `${flavor.id}__${pack.id}`;
                return (
                  <tr
                    key={skuId}
                    className={`${pi === 0 && fi > 0 ? "border-t-2 border-gray-200" : pi === 1 ? "border-t border-gray-100" : ""} ${fi % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    {pi === 0 ? (
                      <td
                        rowSpan={packSizes.length}
                        className="sticky left-0 bg-inherit px-3 py-2 font-medium text-[#1E3A5F] whitespace-nowrap z-10 border-r border-gray-200"
                      >
                        {flavor.name}
                        {flavor.is_vegan && (
                          <span className="ml-1.5 text-[10px] font-semibold bg-green-100 text-green-700 px-1 py-0.5 rounded">V</span>
                        )}
                      </td>
                    ) : null}
                    <td className="px-2 py-1.5 text-gray-500 whitespace-nowrap text-xs">
                      {pack.name}
                    </td>
                    {visibleLocations.map((loc) => {
                      const qty = stockMap.get(`${loc.id}__${skuId}`) ?? 0;
                      const threshold = thresholdMap.get(`${loc.id}__${skuId}`) ?? 0;
                      return (
                        <td key={loc.id} className="px-2 py-1.5 text-center">
                          <AlertBadge quantity={qty} threshold={threshold} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-red-200"></span> At or below threshold
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-amber-200"></span> Within 20% of threshold
        </span>
      </div>
    </div>
  );
}
