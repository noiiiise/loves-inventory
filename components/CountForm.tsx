"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Location, Flavor, PackSize, StockRow } from "@/lib/inventory";

type SkuEntry = {
  skuId: string;
  flavorName: string;
  packName: string;
  currentStock: number;
  count: number;
};

type Props = {
  locations: Location[];
  flavors: Flavor[];
  packSizes: PackSize[];
  initialStock: StockRow[];
};

export default function CountForm({ locations, flavors, packSizes, initialStock }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [initials, setInitials] = useState("");
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<SkuEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const stockMap = new Map(initialStock.map((r) => [`${r.location_id}__${r.sku_id}`, r.quantity]));

  function buildEntries(locId: string) {
    const activeFlavors = flavors.filter((f) => f.active);
    return activeFlavors.flatMap((flavor) =>
      packSizes.map((pack) => {
        const skuId = `${flavor.id}__${pack.id}`;
        const current = stockMap.get(`${locId}__${skuId}`) ?? 0;
        return { skuId, flavorName: flavor.name, packName: pack.name, currentStock: current, count: current };
      })
    );
  }

  function handleLocationChange(locId: string) {
    setLocationId(locId);
    setEntries(buildEntries(locId));
  }

  // Build entries when component mounts with first location
  if (entries.length === 0 && locationId) {
    setEntries(buildEntries(locationId));
  }

  function setCount(index: number, value: number) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, count: Math.max(0, value) } : e)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!initials.trim()) { setError("Please enter your initials"); return; }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, initials: initials.trim().toUpperCase(), notes, entries: entries.map((e) => ({ skuId: e.skuId, quantity: e.count })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSuccess(true);
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save count");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-[#1E3A5F] mb-2">Count Saved!</h2>
        <p className="text-gray-500 mb-6">Inventory updated for {locations.find((l) => l.id === locationId)?.name}</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => router.push("/count")}
            className="bg-[#1E3A5F] text-white px-6 py-3 rounded-xl font-semibold">
            Log Another
          </button>
          <button onClick={() => router.push("/")}
            className="bg-[#93C5FD] text-[#1E3A5F] px-6 py-3 rounded-xl font-semibold">
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto pb-28">
      {/* Location & Initials */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4 space-y-3">
        <div>
          <label className="block text-sm font-semibold text-[#1E3A5F] mb-1">Location</label>
          <select
            value={locationId}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1E3A5F] mb-1">Your Initials</label>
          <input
            type="text"
            value={initials}
            onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="e.g. JD"
            maxLength={4}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1E3A5F] mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. post-weekend count"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
          />
        </div>
      </div>

      {/* SKU Entries */}
      {entries.map((entry, i) => (
        <div key={entry.skuId} className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-3`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-[#1E3A5F]">{entry.flavorName}</p>
              <p className="text-xs text-gray-500">{entry.packName}</p>
            </div>
            <span className="text-xs text-gray-400">System: {entry.currentStock}</span>
          </div>
          <div className="flex items-center gap-4 justify-center">
            <button
              type="button"
              onClick={() => setCount(i, entry.count - 1)}
              className="w-14 h-14 rounded-full bg-gray-100 text-2xl font-bold text-gray-700 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center select-none"
            >
              −
            </button>
            <input
              type="number"
              value={entry.count}
              min={0}
              onChange={(e) => setCount(i, parseInt(e.target.value, 10) || 0)}
              className="w-20 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl py-2 focus:outline-none focus:border-[#93C5FD]"
            />
            <button
              type="button"
              onClick={() => setCount(i, entry.count + 1)}
              className="w-14 h-14 rounded-full bg-gray-100 text-2xl font-bold text-gray-700 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center select-none"
            >
              +
            </button>
          </div>
        </div>
      ))}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Sticky Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-20">
        <button
          type="submit"
          disabled={submitting || isPending}
          className="w-full bg-[#1E3A5F] text-white font-bold py-4 rounded-2xl text-base disabled:opacity-50 active:scale-[0.99] transition-transform"
        >
          {submitting ? "Saving…" : "Save Count"}
        </button>
      </div>
    </form>
  );
}
