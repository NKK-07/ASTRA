import { NextResponse } from "next/server";
import { recordDigest } from "@/lib/core/seal";
import { signDigest } from "@/lib/server/keys";
import { parseRecord } from "@/lib/server/validate";

// Seals a trial record: the server recomputes the canonical digest itself, then signs it with the
// platform's Ed25519 key. Files never leave the browser; only names, sizes and SHA-256 hashes do.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const record = parseRecord(body?.record);
  if (!record) return NextResponse.json({ error: "invalid_record" }, { status: 400 });
  if (record.signoffs.length === 0) return NextResponse.json({ error: "no_signoffs" }, { status: 400 });
  const digest = await recordDigest(record);
  return NextResponse.json({ digest, ...signDigest(digest) });
}
