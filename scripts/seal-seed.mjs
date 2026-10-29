// Computes file hashes, record digests and Ed25519 seals for the seeded trial records,
// using the default demo key. Run: npm run seed:seal  (writes lib/data/seed-seals.json)
import { createHash, createPrivateKey, createPublicKey, sign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const files = JSON.parse(readFileSync(new URL("../lib/data/seed-files.json", import.meta.url)));
const records = {
  "TR-2026-1118": { productId: "p-swarm", facilityId: "dtis-kanpur", test: "emi_emc", date: "2026-10-20",
    signoffs: [
      { role: "Range officer, DTIS Kanpur", name: "Vikram Singh", at: "2026-10-20T16:40:00+05:30" },
      { role: "Observer, user Service", name: "Maj. K. Bhatt", at: "2026-10-20T16:52:00+05:30" },
      { role: "Firm test lead", name: "Ananya Rao", at: "2026-10-20T17:05:00+05:30" }
    ] },
  "TR-2026-1087": { productId: "p-radio", facilityId: "dtis-chennai", test: "env_thermal", date: "2026-10-12",
    signoffs: [
      { role: "Range officer, DTIS Chennai", name: "R. Prakash", at: "2026-10-12T15:10:00+05:30" },
      { role: "Firm test lead", name: "S. Kulkarni", at: "2026-10-12T15:30:00+05:30" }
    ] }
};
const seed = createHash("sha256").update(process.env.SEAL_SECRET || "astratest-bharat-demo-seal-v1").digest();
const pkcs8 = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]);
const priv = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
const pubRaw = createPublicKey(priv).export({ format: "der", type: "spki" }).subarray(12);
const keyId = createHash("sha256").update(pubRaw).digest("hex").slice(0, 12);
const out = {};
for (const [id, r] of Object.entries(records)) {
  const f = files[id].map((x) => ({ name: x.name, kind: x.kind, size: Buffer.byteLength(x.content, "utf8"),
    sha256: createHash("sha256").update(x.content, "utf8").digest("hex") }));
  const canonical = JSON.stringify({ v: 1, id, productId: r.productId, facilityId: r.facilityId, test: r.test, date: r.date,
    files: f.map((x) => ({ name: x.name, size: x.size, sha256: x.sha256 })),
    signoffs: r.signoffs.map((s) => ({ role: s.role, name: s.name, at: s.at })) });
  const digest = createHash("sha256").update(canonical, "utf8").digest("hex");
  const signature = sign(null, Buffer.from(digest, "hex"), priv).toString("base64");
  out[id] = { files: f, signoffs: r.signoffs, seal: { digest, signature, publicKey: pubRaw.toString("base64"), keyId, signedAt: r.signoffs.at(-1).at } };
}
writeFileSync(new URL("../lib/data/seed-seals.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log("sealed", Object.keys(out).join(", "), "key", keyId);
