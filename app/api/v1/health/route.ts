export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({ ok: true, service: "astratest-bharat", time: new Date().toISOString() });
}
