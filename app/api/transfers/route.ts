import { NextResponse } from "next/server";
import { recordTransfer } from "@/lib/inventory";

type TransferLine = { skuId: string; quantity: number };

export async function POST(req: Request) {
  try {
    const { fromLocationId, toLocationId, initials, notes, lines } = await req.json() as {
      fromLocationId: string;
      toLocationId: string;
      initials: string;
      notes?: string;
      lines: TransferLine[];
    };

    if (!fromLocationId || !toLocationId || !initials || !Array.isArray(lines)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (fromLocationId === toLocationId) {
      return NextResponse.json({ error: "Source and destination must differ" }, { status: 400 });
    }

    const results = await Promise.all(
      lines.map((l) => recordTransfer(fromLocationId, toLocationId, l.skuId, l.quantity, initials, notes))
    );

    const flaggedCount = results.filter((r) => r.flagged).length;
    return NextResponse.json({ results, flagged: flaggedCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
