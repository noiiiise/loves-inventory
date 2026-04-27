"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Location, Flavor, PackSize, Threshold } from "@/lib/inventory";

type Props = {
  locations: Location[];
  flavors: Flavor[];
  packSizes: PackSize[];
  thresholds: Threshold[];
};

type Tab = "thresholds" | "flavors" | "locations";

export default function AdminClient({ locations, flavors, packSizes, thresholds }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("thresholds");
  const [saving, setSaving] = useState<string | null>(null);
  const [localThresholds, setLocalThresholds] = useState<Map<string, number>>(
    new Map(thresholds.map((t) => [`${t.location_id}__${t.sku_id}`, t.min_quantity]))
  );

  async function saveThreshold(locationId: string, skuId: string, value: number) {
    const key = `${locationId}__${skuId}`;
    setSaving(key);
    setLocalThresholds((prev) => new Map(prev).set(key, value));
    try {
      const res = await fetch("/api/admin/threshold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, skuId, minQuantity: value }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } finally {
      setSaving(null);
    }
  }

  async function toggleFlavor(flavorId: string, active: boolean) {
    setSaving(flavorId);
    try {
      await fetch("/api/admin/flavor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flavorId, active }),
      });
      router.refresh();
    } finally {
      setSaving(null);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "thresholds", label: "Reorder Thresholds" },
    { id: "flavors", label: "Flavors" },
    { id: "locations", label: "Locations" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === t.id ? "bg-white text-[#1E3A5F] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Thresholds tab */}
      {tab === "thresholds" && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Set the minimum quantity for each item at each location. An alert fires when stock hits this number.
          </p>
          {locations.map((loc) => (
            <div key={loc.id} className="mb-6">
              <h3 className="font-bold text-[#1E3A5F] mb-3 text-sm uppercase tracking-wide">
                {loc.name}
              </h3>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {flavors.filter((f) => f.active).map((flavor, fi) =>
                  packSizes.map((pack, pi) => {
                    const skuId = `${flavor.id}__${pack.id}`;
                    const key = `${loc.id}__${skuId}`;
                    const val = localThresholds.get(key) ?? 0;
                    return (
                      <div key={skuId}
                        className={`flex items-center justify-between px-4 py-3 ${fi === 0 && pi === 0 ? "" : "border-t border-gray-100"}`}>
                        <div>
                          <span className="font-medium text-sm text-gray-800">{flavor.name}</span>
                          <span className="text-xs text-gray-400 ml-2">{pack.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => saveThreshold(loc.id, skuId, Math.max(0, val - 1))}
                            className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 text-sm">−</button>
                          <span className={`w-8 text-center font-bold text-sm ${saving === key ? "text-gray-400" : "text-[#1E3A5F]"}`}>
                            {val}
                          </span>
                          <button onClick={() => saveThreshold(loc.id, skuId, val + 1)}
                            className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 text-sm">+</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flavors tab */}
      {tab === "flavors" && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Toggle flavors active or inactive. Inactive flavors are hidden from count and transfer forms.
          </p>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {flavors.map((flavor, i) => (
              <div key={flavor.id}
                className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                <span className={`font-medium ${flavor.active ? "text-gray-800" : "text-gray-400 line-through"}`}>
                  {flavor.name}
                  {flavor.is_vegan && (
                    <span className="ml-2 text-xs font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Vegan</span>
                  )}
                </span>
                <button
                  onClick={() => toggleFlavor(flavor.id, !flavor.active)}
                  disabled={saving === flavor.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flavor.active ? "bg-[#1E3A5F]" : "bg-gray-300"} disabled:opacity-50`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flavor.active ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locations tab */}
      {tab === "locations" && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Current locations. Contact your developer to add new locations or change location types.
          </p>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {locations.map((loc, i) => (
              <div key={loc.id}
                className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                <div>
                  <p className="font-medium text-gray-800">{loc.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{loc.type.replace(/_/g, " ")}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${loc.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {loc.active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
