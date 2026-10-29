"use client";
import { APPLICANT_FIRM, FACILITIES, facility } from "./data/catalog";
import { useStore } from "./store";
import type { Facility } from "./types";

type S = ReturnType<typeof useStore.getState>;

export const myProducts = (s: S) => s.products.filter((p) => p.firmId === APPLICANT_FIRM);
export const productById = (s: S, id?: string) => s.products.find((p) => p.id === id);
export const recordById = (s: S, id?: string) => s.records.find((r) => r.id === id);

export const facilities = (s: S): Facility[] =>
  FACILITIES.map((f) => ({ ...f, verified: s.facilityVerified[f.id] ?? f.verified }));

export const facilityName = (id: string, t?: (s: string) => string) => { const n = facility(id)?.short ?? id; return t ? t(n) : n; };

export function lm7Request(s: S) {
  return s.requests.find((r) => r.productId === "p-lm7");
}

export function placementOf(s: S, requestId?: string) {
  const w = s.windows[0];
  if (!requestId || !w?.allocation) return null;
  const p = w.allocation.placements.find((x) => x.requestId === requestId);
  const wi = w.allocation.waitlist.findIndex((x) => x.requestId === requestId);
  return { window: w, placement: p, waitIndex: wi };
}
