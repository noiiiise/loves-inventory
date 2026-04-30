import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { recordCount } from "@/lib/inventory";

type CountEntry = { skuId: string; quantity: number };

export async function POST(req: Request) {
  try {
    const { locationId, initials, notes, entries } = await req.json() as {
      locationId: string;
      initials: string;
      notes?: string;
      entries: CountEntry[];
    };

    if (!locationId || !initials || !Array.isArray(entries)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const submissionId = randomUUID();
    const ids = await Promise.all(
      entries.map((e) => recordCount(locationId, e.skuId, e.quantity, initials, notes, submissionId))
    );

    revalidatePath("/");
    revalidatePath("/alerts");
    return NextResponse.json({ ids });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
