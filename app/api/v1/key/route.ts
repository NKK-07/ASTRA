export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { platformKey } from "@/lib/server/keys";

export function GET() {
  const k = platformKey();
  return NextResponse.json({ algorithm: "Ed25519", publicKey: k.publicKey, keyId: k.keyId, demoKey: k.demo });
}
