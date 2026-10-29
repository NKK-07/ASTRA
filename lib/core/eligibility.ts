import type { DocKey, Facility, Product } from "../types";
import { SCHEMES, test } from "../data/catalog";
import { fill, type Msg, type Params } from "./text";

export const SOP_RULES_VERSION = "SOP 7 Oct 2026 (from public reports; annexures pending)";

export interface Verdict {
  id: string;
  ok: boolean | "pending";
  title: string; // rendered English
  detail: string; // rendered English
  rule: string;
  tTitle: string; // template for translation
  tDetail: string;
  params: Params;
}

export interface DocReq {
  key: DocKey;
  label: string;
  why: string;
  params?: Params;
}

const V = (id: string, ok: Verdict["ok"], rule: string, tTitle: string, tDetail: string, params: Params = {}): Verdict =>
  ({ id, ok, rule, tTitle, tDetail, params, title: fill(tTitle, params), detail: fill(tDetail, params) });

// Placeholder rates (₹ per trial) used only when charges apply. The real rate cards are
// in SOP annexures that are not public yet.
const RATE: Record<string, number> = {
  emc: 85000, environmental: 60000, flight: 150000, rf: 70000, proof: 45000, rocket: 120000, explosive: 180000
};

export function evaluate(product: Product, fac: Facility, tests: string[]) {
  const scheme = SCHEMES[product.scheme];
  const verdicts: Verdict[] = [];

  // Rule W: charges waived for iDEX, TDF, Make and other MoD developmental projects.
  const sp = { scheme: scheme.name, ref: product.sanctionRef ?? "" };
  if (scheme.funded) {
    const ok = product.schemeStatus === "verified" ? true : product.schemeStatus === "rejected" ? false : "pending";
    verdicts.push(ok === true
      ? V("waiver", ok, "SOP §charges · waiver for MoD developmental projects", "Testing charges waived", "{scheme} project {ref} is verified by the programme body.", sp)
      : ok === "pending"
        ? V("waiver", ok, "SOP §charges · waiver for MoD developmental projects", "Waiver pending scheme verification", "{scheme} status must be confirmed by the programme body before the waiver applies.", sp)
        : V("waiver", ok, "SOP §charges · waiver for MoD developmental projects", "Waiver refused: scheme not confirmed", "The programme body could not confirm the {scheme} sanction.", sp));
  } else {
    verdicts.push(V("waiver", false, "SOP §charges · calculation and payment", "Charges apply", "Own-initiative projects pay testing charges under the SOP's charges procedure."));
  }

  // Rule S: 3-day reserved slot per quarter at proof ranges, own-initiative included.
  if (fac.kind === "proof_range") {
    verdicts.push(V("slot", true, "SOP §slots · 3 days per quarter at proof ranges", "Eligible for the reserved slot", "Domestic industry projects, including own-initiative ones, can request the quarterly 3-day window."));
  } else {
    verdicts.push(V("slot", true, "SOP §allotment · simplified procedure", "Book through the facility calendar", "{facility} is not a proof range; trials are booked on its regular calendar (next slot about {days} days).", { facility: fac.short, days: fac.nextSlotDays }));
  }

  // Facility can run the tests.
  const missing = tests.filter((t) => !fac.tests.includes(t));
  verdicts.push(missing.length
    ? V("capability", false, "Facility capability list", "Facility cannot run every test", "Not available here: {tests}.", { tests: missing.map((t) => test(t)?.name).join(", ") })
    : V("capability", true, "Facility capability list", "Facility runs all selected tests", "{tests}", { tests: tests.map((t) => test(t)?.name).join(", ") }));

  // Disputes go to conciliation.
  verdicts.push(V("dispute", true, "SOP §agreement · conciliation clause", "Disputes by conciliation", "The agreement uses the SOP's conciliation clause instead of arbitration."));

  const docs: DocReq[] = [
    ...(scheme.funded ? [{ key: "sanction" as const, label: "Sanction letter ({scheme})", why: "Proves the waiver", params: { scheme: scheme.name } }] : []),
    { key: "profile", label: "Company and product profile", why: "From your AstraTest profile" },
    { key: "trial_plan", label: "Trial plan and test matrix", why: "Drafted from the selected tests" },
    { key: "nda", label: "Non-disclosure and data-handling undertaking", why: "Required by every owner" },
    { key: "agreement", label: "Agreement with conciliation clause", why: "SOP format" },
    ...(fac.kind !== "lab" && tests.some((t) => ["proof", "rocket", "explosive"].includes(test(t)?.family ?? ""))
      ? [{ key: "safety" as const, label: "Range safety clearance", why: "Energetic items at a range" }] : [])
  ];

  const waived = verdicts[0].ok === true;
  const estimate = tests.reduce((s, t) => s + (RATE[test(t)?.family ?? "emc"] ?? 50000), 0);
  return { verdicts, docs, charges: { waived, estimate, note: waived ? "₹0 under the SOP waiver" : "Placeholder rates until the SOP annexures are public" }, rulesVersion: SOP_RULES_VERSION };
}

/** Rank facilities for a set of test needs: coverage first, then accreditation, waiver fit and wait. */
export function rankFacilities(facs: Facility[], needs: string[], filters: { nabl?: boolean; owner?: string; state?: string } = {}) {
  return facs
    .filter((f) => (!filters.nabl || f.nabl) && (!filters.owner || f.owner === filters.owner) && (!filters.state || f.state === filters.state))
    .map((f) => {
      const covered = needs.length ? needs.filter((n) => f.tests.includes(n)).length : f.tests.length ? 1 : 0;
      const coverage = needs.length ? covered / needs.length : 1;
      const score = Math.round(coverage * 60 + (f.nabl ? 15 : 0) + (f.verified ? 5 : 0) + Math.max(0, 20 - f.nextSlotDays / 3));
      const reasons: Msg[] = [
        needs.length ? { k: "Runs {n} of {m} tests you need", p: { n: covered, m: needs.length } } : { k: "All tests" },
        { k: f.nabl ? "NABL accredited" : "Not NABL accredited" },
        { k: "Next slot in about {d} days", p: { d: f.nextSlotDays } },
        { k: f.verified ? "Details verified" : "Details unverified" }
      ];
      return { facility: f, score, covered, reasons };
    })
    .filter((r) => !needs.length || r.covered > 0)
    .sort((a, b) => b.score - a.score || a.facility.nextSlotDays - b.facility.nextSlotDays);
}

/** Tests a product category usually needs (the test matrix). */
export const TEST_MATRIX: Record<string, string[]> = {
  "UAS payload": ["emi_emc", "env_vibration", "env_thermal", "uas_flight"],
  "Tactical radio": ["emi_emc", "env_vibration", "env_thermal", "antenna"],
  "Loitering munition sub-system": ["fuze_safety", "warhead"],
  "Small arms ammunition": ["proof_small_arms"],
  "Rocket motor": ["rocket_static", "rocket_trajectory"],
  "Electro-optics": ["emi_emc", "env_thermal"]
};
