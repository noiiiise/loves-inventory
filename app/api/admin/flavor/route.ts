import { NextResponse } from "next/server";
import { toggleFlavorActive } from "@/lib/inventory";

export async function POST(req: Request) {
  try {
    const { flavorId, active } = await req.json();
    if (!flavorId || active === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    await toggleFlavorActive(flavorId, active);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
