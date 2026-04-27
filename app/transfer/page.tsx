import { getLocations, getFlavors, getPackSizes, getCurrentInventory } from "@/lib/inventory";
import TransferForm from "@/components/TransferForm";

export default async function TransferPage() {
  const [locations, flavors, packSizes, stock] = await Promise.all([
    getLocations(),
    getFlavors(),
    getPackSizes(),
    getCurrentInventory(),
  ]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Log Transfer</h1>
        <p className="text-sm text-gray-500 mt-0.5">Record product moving between locations</p>
      </div>
      <TransferForm locations={locations} flavors={flavors} packSizes={packSizes} stock={stock} />
    </div>
  );
}
