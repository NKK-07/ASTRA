import { NextResponse } from "next/server";
import { recordDigest } from "@/lib/core/seal";
import { platformKey, verifyDigest } from "@/lib/server/keys";
import { parseRecord } from "@/lib/server/validate";

// Verifies a sealed record: recomputes the digest from the record as it stands now, compares it
// with the sealed digest and checks the Ed25519 signature.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const record = parseRecord(body?.record);
  const seal = body?.seal;
  if (!record || !seal || typeof seal.signature !== "string" || typeof seal.publicKey !== "string" || typeof seal.digest !== "string")
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const digest = await recordDigest(record);
  const digestMatches = digest === seal.digest;
  const signatureValid = verifyDigest(seal.digest, seal.signature, seal.publicKey);
  const key = platformKey();
  return NextResponse.json({
    valid: digestMatches && signatureValid,
    digestMatches,
    signatureValid,
    recomputedDigest: digest,
    signedByCurrentKey: seal.publicKey === key.publicKey,
    checkedAt: new Date().toISOString()
  });
}
