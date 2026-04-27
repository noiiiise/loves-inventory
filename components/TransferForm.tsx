"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Location, Flavor, PackSize, StockRow } from "@/lib/inventory";

type LineItem = {
  skuId: string;
  flavorName: string;
  packName: string;
  quantity: number;
  sourceStock: number;
};

type Props = {
  locations: Location[];
  flavors: Flavor[];
  packSizes: PackSize[];
  stock: StockRow[];
};

export default function TransferForm({ locations, flavors, packSizes, stock }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const igloo = locations.find((l) => l.id === "igloo") ?? locations[0];
  const [fromId, setFromId] = useState(igloo?.id ?? "");
  const [toId, setToId] = useState(locations.find((l) => l.id !== fromId)?.id ?? "");
  const [initials, setInitials] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ count: number; flagged: number } | null>(null);

  const stockMap = new Map(stock.map((r) => [`${r.location_id}__${r.sku_id}`, r.quantity]));

  function addLine() {
    const firstFlavor = flavors.find((f) => f.active);
    const firstPack = packSizes[0];
    if (!firstFlavor || !firstPack) return;
    const skuId = `${firstFlavor.id}__${firstPack.id}`;
    const sourceStock = stockMap.get(`${fromId}__${skuId}`) ?? 0;
    setLines((prev) => [...prev, { skuId, flavorName: firstFlavor.name, packName: firstPack.name, quantity: 1, sourceStock }]);
  }

  function updateLine(index: number, field: "skuId" | "quantity", value: string | number) {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        if (field === "skuId") {
          const [flavorId, packId] = (value as string).split("__");
          const flavor = flavors.find((f) => f.id === flavorId);
          const pack = packSizes.find((p) => p.id === packId);
          const sourceStock = stockMap.get(`${fromId}__${value}`) ?? 0;
          return { ...line, skuId: value as string, flavorName: flavor?.name ?? "", packName: pack?.name ?? "", sourceStock };
        }
        return { ...line, quantity: Math.max(1, value as number) };
      })
    );
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!initials.trim()) { setError("Please enter your initials"); return; }
    if (lines.length === 0) { setError("Add at least one item to transfer"); return; }
    if (fromId === toId) { setError("Source and destination must be different"); return; }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromLocationId: fromId, toLocationId: toId, initials: initials.trim().toUpperCase(), notes, lines: lines.map((l) => ({ skuId: l.skuId, quantity: l.quantity })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setResult({ count: lines.length, flagged: data.flagged ?? 0 });
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save transfer");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">{result.flagged > 0 ? "⚠️" : "✅"}</div>
        <h2 className="text-xl font-bold text-[#1E3A5F] mb-2">Transfer Logged!</h2>
        <p className="text-gray-500 mb-2">
          {result.count} item{result.count !== 1 ? "s" : ""} transferred from{" "}
          {locations.find((l) => l.id === fromId)?.name} to{" "}
          {locations.find((l) => l.id === toId)?.name}
        </p>
        {result.flagged > 0 && (
          <p className="text-amber-700 bg-amber-50 rounded-xl px-4 py-2 text-sm mb-4">
            {result.flagged} item{result.flagged !== 1 ? "s" : ""} flagged as unusual quantity
          </p>
        )}
        <div className="flex justify-center gap-3 mt-4">
          <button onClick={() => { setResult(null); setLines([]); setInitials(""); setNotes(""); }}
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
      {/* Header fields */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-[#1E3A5F] mb-1">From</label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1E3A5F] mb-1">To</label>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
            >
              {locations.filter((l) => l.id !== fromId).map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
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
            placeholder="e.g. big event this weekend"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
          />
        </div>
      </div>

      {/* Line items */}
      {lines.map((line, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-3">
          <div className="flex items-start justify-between mb-3">
            <select
              value={line.skuId}
              onChange={(e) => updateLine(i, "skuId", e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#93C5FD] mr-3"
            >
              {flavors.filter((f) => f.active).map((flavor) =>
                packSizes.map((pack) => (
                  <option key={`${flavor.id}__${pack.id}`} value={`${flavor.id}__${pack.id}`}>
                    {flavor.name} — {pack.name}
                  </option>
                ))
              )}
            </select>
            <button type="button" onClick={() => removeLine(i)}
              className="text-gray-400 hover:text-red-500 text-xl leading-none mt-1">
              ×
            </button>
          </div>
          <div className="flex items-center gap-4 justify-between">
            <span className="text-xs text-gray-500">
              Source stock: <strong>{line.sourceStock}</strong>
            </span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => updateLine(i, "quantity", line.quantity - 1)}
                className="w-11 h-11 rounded-full bg-gray-100 text-xl font-bold flex items-center justify-center hover:bg-gray-200 select-none">
                −
              </button>
              <input
                type="number"
                value={line.quantity}
                min={1}
                onChange={(e) => updateLine(i, "quantity", parseInt(e.target.value, 10) || 1)}
                className="w-16 text-center text-xl font-bold border-2 border-gray-200 rounded-xl py-1.5 focus:outline-none focus:border-[#93C5FD]"
              />
              <button type="button" onClick={() => updateLine(i, "quantity", line.quantity + 1)}
                className="w-11 h-11 rounded-full bg-gray-100 text-xl font-bold flex items-center justify-center hover:bg-gray-200 select-none">
                +
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addLine}
        className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-2xl border-2 border-dashed border-gray-300 hover:bg-gray-50 mb-4 text-sm"
      >
        + Add Item
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-20">
        <button
          type="submit"
          disabled={submitting || isPending || lines.length === 0}
          className="w-full bg-[#93C5FD] text-[#1E3A5F] font-bold py-4 rounded-2xl text-base disabled:opacity-50 active:scale-[0.99] transition-transform"
        >
          {submitting ? "Saving…" : `Log Transfer${lines.length > 0 ? ` (${lines.length} item${lines.length !== 1 ? "s" : ""})` : ""}`}
        </button>
      </div>
    </form>
  );
}
