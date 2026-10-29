import "server-only";
import type { TrialRecord } from "../types";

const HEX64 = /^[0-9a-f]{64}$/;
type RecordInput = Pick<TrialRecord, "id" | "productId" | "facilityId" | "test" | "date" | "files" | "signoffs">;

/** Narrow, strict check of a posted trial record. Returns null when anything is off. */
export function parseRecord(x: unknown): RecordInput | null {
  if (!x || typeof x !== "object") return null;
  const r = x as Record<string, unknown>;
  const str = (v: unknown, max = 200) => typeof v === "string" && v.length > 0 && v.length <= max;
  if (!str(r.id, 40) || !str(r.productId, 40) || !str(r.facilityId, 40) || !str(r.test, 40) || !str(r.date, 40)) return null;
  if (!Array.isArray(r.files) || r.files.length === 0 || r.files.length > 50) return null;
  if (!Array.isArray(r.signoffs) || r.signoffs.length > 10) return null;
  const files = r.files.map((f) => f as Record<string, unknown>);
  if (!files.every((f) => str(f.name, 200) && typeof f.size === "number" && f.size >= 0 && typeof f.sha256 === "string" && HEX64.test(f.sha256))) return null;
  const signoffs = r.signoffs.map((s) => s as Record<string, unknown>);
  if (!signoffs.every((s) => str(s.role, 100) && str(s.name, 100) && str(s.at, 40))) return null;
  return {
    id: r.id as string, productId: r.productId as string, facilityId: r.facilityId as string, test: r.test as string, date: r.date as string,
    files: files.map((f) => ({ name: f.name as string, kind: typeof f.kind === "string" ? f.kind : "", size: f.size as number, sha256: f.sha256 as string })),
    signoffs: signoffs.map((s) => ({ role: s.role as string, name: s.name as string, at: s.at as string }))
  };
}
