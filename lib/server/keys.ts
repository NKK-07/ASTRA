import "server-only";
import { createHash, createPrivateKey, createPublicKey, sign, verify } from "node:crypto";

// The platform's Ed25519 sealing key is derived from SEAL_SECRET (set it in Vercel).
// Without it a public demo key is used, which is fine for a demo and wrong for production.
const PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function load() {
  const secret = process.env.SEAL_SECRET || "astratest-bharat-demo-seal-v1";
  const seed = createHash("sha256").update(secret).digest();
  const priv = createPrivateKey({ key: Buffer.concat([PKCS8_PREFIX, seed]), format: "der", type: "pkcs8" });
  const pubRaw = createPublicKey(priv).export({ format: "der", type: "spki" }).subarray(12);
  return { priv, pubRaw, keyId: createHash("sha256").update(pubRaw).digest("hex").slice(0, 12), demo: !process.env.SEAL_SECRET };
}

let cached: ReturnType<typeof load> | null = null;
const key = () => (cached ??= load());

export function platformKey() {
  const k = key();
  return { publicKey: k.pubRaw.toString("base64"), keyId: k.keyId, demo: k.demo };
}

export function signDigest(digestHex: string) {
  const k = key();
  return {
    signature: sign(null, Buffer.from(digestHex, "hex"), k.priv).toString("base64"),
    publicKey: k.pubRaw.toString("base64"),
    keyId: k.keyId,
    signedAt: new Date().toISOString()
  };
}

export function verifyDigest(digestHex: string, signatureB64: string, publicKeyB64: string) {
  try {
    const pub = createPublicKey({ key: Buffer.concat([SPKI_PREFIX, Buffer.from(publicKeyB64, "base64")]), format: "der", type: "spki" });
    return verify(null, Buffer.from(digestHex, "hex"), pub, Buffer.from(signatureB64, "base64"));
  } catch {
    return false;
  }
}
