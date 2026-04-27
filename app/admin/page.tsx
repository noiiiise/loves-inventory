import { getLocations, getFlavors, getPackSizes, getThresholds } from "@/lib/inventory";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const [locations, flavors, packSizes, thresholds] = await Promise.all([
    getLocations(),
    getFlavors(),
    getPackSizes(),
    getThresholds(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Admin</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage flavors, locations, and reorder thresholds</p>
      </div>
      <AdminClient locations={locations} flavors={flavors} packSizes={packSizes} thresholds={thresholds} />
    </div>
  );
}
