"use client";

import type { CountNote, Location } from "@/lib/inventory";

type Props = {
  notes: CountNote[];
  locations: Location[];
};

export default function RecentNotes({ notes, locations }: Props) {
  if (notes.length === 0) return null;

  const locationMap = new Map(locations.map((l) => [l.id, l.name]));

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold text-[#1E3A5F] mb-3">Count Notes</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">Date &amp; Time</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">Initials</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">Location</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {notes.map((n) => (
              <tr key={n.id} className="bg-white hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                  {new Date(n.recorded_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-2.5 font-mono font-semibold text-[#1E3A5F]">{n.recorded_by}</td>
                <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                  {locationMap.get(n.location_id) ?? n.location_id}
                </td>
                <td className="px-4 py-2.5 text-gray-700">{n.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
