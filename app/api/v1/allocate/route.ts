import { NextResponse } from "next/server";
import { allocate } from "@/lib/core/scheduler";
import type { ReservedWindow, SlotRequest } from "@/lib/types";

// Runs the published, deterministic allocation for one reserved window.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const w = body?.window as ReservedWindow | undefined;
  const requests = body?.requests as SlotRequest[] | undefined;
  if (!w || !Array.isArray(w.days) || !Array.isArray(requests) || requests.length > 500)
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const asOf = typeof body.asOf === "string" ? body.asOf : w.closesOn;
  return NextResponse.json(allocate(w, requests, asOf));
}
