"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/count", label: "Log Count" },
  { href: "/transfer", label: "Transfer" },
  { href: "/alerts", label: "Alerts" },
  { href: "/admin", label: "Admin" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="bg-[#1E3A5F] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 h-14">
        <span className="font-bold text-[#93C5FD] mr-4 text-lg whitespace-nowrap">
          🍦 Loves
        </span>
        <nav className="flex gap-1 overflow-x-auto scrollbar-none">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                pathname === l.href
                  ? "bg-[#93C5FD] text-[#1E3A5F]"
                  : "hover:bg-white/10"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
