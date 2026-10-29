import { NextResponse } from "next/server";
import { evaluate } from "@/lib/core/eligibility";
import { facility } from "@/lib/data/catalog";
import type { Product } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const fac = facility(body?.facilityId);
  const product = body?.product as Product | undefined;
  if (!fac || !product || !Array.isArray(body?.tests)) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  return NextResponse.json(evaluate(product, fac, body.tests));
}
