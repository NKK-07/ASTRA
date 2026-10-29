import { describe, expect, it } from "vitest";
import { allocate, batchKeyOf, priorityOf } from "@/lib/core/scheduler";
import { evaluate, rankFacilities } from "@/lib/core/eligibility";
import { recordDigest } from "@/lib/core/seal";
import { signDigest, verifyDigest } from "@/lib/server/keys";
import { FACILITIES, facility } from "@/lib/data/catalog";
import { LM7_REQUEST, seedProducts, seedRecords, seedRequests, seedWindows } from "@/lib/data/seed";

const asOf = "2026-11-30";
const reqs = [...seedRequests, { ...LM7_REQUEST, id: "rq-20", submittedAt: "2026-10-28" }];

describe("scheduler", () => {
  it("scores by the published rule", () => {
    const p = priorityOf(reqs[19], asOf);
    expect(p.milestone + p.funded + p.first).toBe(70);
    expect(p.total).toBe(70 + p.waiting);
  });
  it("is deterministic", () => {
    expect(allocate(seedWindows[0], reqs, asOf)).toEqual(allocate(seedWindows[0], [...reqs].reverse(), asOf));
  });
  it("fits more trials with batching than without", () => {
    const a = allocate(seedWindows[0], reqs, asOf);
    expect(a.withBatching).toBeGreaterThan(a.withoutBatching);
    expect(a.placements.length + a.waitlist.length).toBe(reqs.length);
  });
  it("never exceeds a day's hours", () => {
    const w = seedWindows[0];
    const a = allocate(w, reqs, asOf);
    w.days.forEach((_, d) => {
      const on = a.placements.filter((p) => p.day === d);
      const setups = new Set(on.map((p) => p.batchKey)).size;
      const hours = on.reduce((s, p) => s + reqs.find((r) => r.id === p.requestId)!.hours, 0);
      expect(hours + setups * w.setupHours).toBeLessThanOrEqual(w.dayHours);
    });
  });
  it("batches only fully compatible trials", () => {
    expect(batchKeyOf(reqs[0])).toBe(batchKeyOf(reqs[1]));
    expect(batchKeyOf(reqs[0])).not.toBe(batchKeyOf(reqs[14]));
  });
});

describe("eligibility", () => {
  it("waives charges for a verified iDEX project", () => {
    const r = evaluate(seedProducts[0], facility("dtis-kanpur")!, ["emi_emc"]);
    expect(r.verdicts.find((v) => v.id === "waiver")!.ok).toBe(true);
    expect(r.charges.waived).toBe(true);
  });
  it("holds the waiver until the scheme is verified", () => {
    const r = evaluate(seedProducts[2], facility("lrde-emi")!, ["emi_emc"]);
    expect(r.verdicts.find((v) => v.id === "waiver")!.ok).toBe("pending");
  });
  it("offers the reserved slot only at proof ranges and asks for safety clearance", () => {
    const r = evaluate(seedProducts[1], facility("cpe-itarsi")!, ["fuze_safety"]);
    expect(r.verdicts.find((v) => v.id === "slot")!.title).toMatch(/reserved slot/);
    expect(r.docs.some((d) => d.key === "safety")).toBe(true);
  });
  it("ranks a facility that runs every needed test first", () => {
    const top = rankFacilities(FACILITIES, ["emi_emc", "uas_flight"])[0];
    expect(top.facility.id).toBe("dtis-kanpur");
  });
});

describe("sealing", () => {
  it("seeded seals match the canonical digest and verify", async () => {
    for (const r of seedRecords) {
      expect(await recordDigest(r)).toBe(r.seal!.digest);
      expect(verifyDigest(r.seal!.digest, r.seal!.signature, r.seal!.publicKey)).toBe(true);
    }
  });
  it("detects tampering", async () => {
    const r = { ...seedRecords[0], files: seedRecords[0].files.map((f, i) => (i ? f : { ...f, size: f.size + 1 })) };
    const d = await recordDigest(r);
    expect(verifyDigest(d, r.seal!.signature, r.seal!.publicKey)).toBe(false);
  });
  it("signs new digests", () => {
    const s = signDigest("ab".repeat(32));
    expect(verifyDigest("ab".repeat(32), s.signature, s.publicKey)).toBe(true);
  });
});
