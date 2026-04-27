import { getLocations, getFlavors, getPackSizes, getCurrentInventory } from "@/lib/inventory";
import CountForm from "@/components/CountForm";

export default async function CountPage() {
  const [locations, flavors, packSizes, stock] = await Promise.all([
    getLocations(),
    getFlavors(),
    getPackSizes(),
    getCurrentInventory(),
  ]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Log Inventory Count</h1>
        <p className="text-sm text-gray-500 mt-0.5">Enter the current quantity for each item at your location</p>
      </div>
      <CountForm locations={locations} flavors={flavors} packSizes={packSizes} initialStock={stock} />
    </div>
  );
}
