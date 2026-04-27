import { NextResponse } from "next/server";
import { updateThreshold } from "@/lib/inventory";

export async function POST(req: Request) {
  try {
    const { locationId, skuId, minQuantity } = await req.json();
    if (!locationId || !skuId || minQuantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    await updateThreshold(locationId, skuId, minQuantity);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
