import type { TrialRecord } from "../types";

// Isomorphic helpers (browser and Node 18+ both expose globalThis.crypto.subtle).

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

export async function sha256Hex(data: string | ArrayBuffer | Uint8Array) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return hex(await globalThis.crypto.subtle.digest("SHA-256", bytes as BufferSource));
}

/** The exact bytes that get signed. Field order is fixed so any change breaks the seal. */
export function canonicalRecord(r: Pick<TrialRecord, "id" | "productId" | "facilityId" | "test" | "date" | "files" | "signoffs">) {
  return JSON.stringify({
    v: 1,
    id: r.id,
    productId: r.productId,
    facilityId: r.facilityId,
    test: r.test,
    date: r.date,
    files: r.files.map((f) => ({ name: f.name, size: f.size, sha256: f.sha256 })),
    signoffs: r.signoffs.map((s) => ({ role: s.role, name: s.name, at: s.at }))
  });
}

export const recordDigest = (r: Parameters<typeof canonicalRecord>[0]) => sha256Hex(canonicalRecord(r));

export const shortHash = (h?: string) => (h ? `${h.slice(0, 12)}…` : "—");
