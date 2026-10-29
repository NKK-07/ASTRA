import { it } from "vitest";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { FACILITIES, FIRMS, PEOPLE, SCHEMES, STAGES, TESTS } from "@/lib/data/catalog";
import { seedApplications, seedAudit, seedNeeds, seedProducts, seedRequests, LM7_REQUEST } from "@/lib/data/seed";
import { evaluate, rankFacilities, SOP_RULES_VERSION } from "@/lib/core/eligibility";
import { RULES_VERSION } from "@/lib/core/scheduler";
import { NAV, ROLE_LABEL } from "@/lib/nav";
import { HI } from "@/lib/i18n-hi";
import seals from "@/lib/data/seed-seals.json";

// Collects every string the interface passes to t(), and reports any without a Hindi entry.
function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (["node_modules", ".next", "tests"].includes(f)) continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|ts)$/.test(f)) out.push(p);
  }
  return out;
}

export function allKeys() {
  const keys = new Set<string>();
  for (const f of walk(path.resolve(__dirname, ".."))) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) keys.add(m[1].replace(/\\"/g, '"'));
    for (const m of src.matchAll(/\blog\(\s*"((?:[^"\\]|\\.)*)"/g)) keys.add(m[1]);
    for (const m of src.matchAll(/\? "([A-Z][^"]+)" : "([A-Z][^"]+)"\s*,\s*(id|productId)\)/g)) { keys.add(m[1]); keys.add(m[2]); }
  }
  const add = (s?: string) => s && keys.add(s);
  TESTS.forEach((x) => { add(x.name); add(x.family); x.standards.forEach(add); });
  FACILITIES.forEach((f) => { add(f.note); add(f.name); add(f.short); add(f.city); add(f.state); add(f.owner); });
  FIRMS.forEach((f) => add(f.city));
  seedAudit.forEach((a) => add(a.actor));
  Object.values(SCHEMES).forEach((s) => add(s.name));
  STAGES.forEach(add);
  Object.values(ROLE_LABEL).forEach(add);
  Object.values(PEOPLE).forEach((p) => { add(p.org); add(p.name); });
  seedProducts.forEach((p) => add(p.category));
  seedNeeds.forEach((n) => { add(n.title); add(n.org); add(n.source); });
  [...seedRequests, LM7_REQUEST].forEach((r) => { add(r.item); add(r.testFamily); if (!/\d/.test(r.calibre)) add(r.calibre); });
  seedApplications.forEach((a) => { add(a.query); add(a.answer); });
  seedAudit.forEach((a) => add(a.action));
  Object.values(seals as Record<string, { files: { kind: string }[]; signoffs: { role: string }[] }>).forEach((r) => { r.files.forEach((f) => add(f.kind)); r.signoffs.forEach((s) => { add(s.role); add((s as { name?: string }).name); }); });
  ["Observer, user Service", "Firm test lead", "Range officer, DTIS Kanpur"].forEach(add);
  add(SOP_RULES_VERSION); add(RULES_VERSION);
  Object.values(NAV).flat().forEach((n) => add(n.label));
  ["Good morning", "Good afternoon", "Good evening", "Overview", "Facilities", "Application", "Insights", "Platform",
   "Waiver refused: scheme not confirmed", "The programme body could not confirm the {scheme} sanction.", "Charges apply",
   "Own-initiative projects pay testing charges under the SOP's charges procedure.", "SOP §charges · calculation and payment"].forEach(add);
  for (const m of readFileSync(path.resolve(__dirname, "../app/(console)/order/page.tsx"), "utf8").matchAll(/"([A-Z][^"]{3,})"/g)) add(m[1]);
  for (const p of seedProducts) for (const f of FACILITIES) {
    const r = evaluate(p, f, p.testNeeds);
    r.verdicts.forEach((v) => { add(v.tTitle); add(v.tDetail); add(v.rule); });
    r.docs.forEach((d) => { add(d.label); add(d.why); });
    add(r.charges.note);
  }
  rankFacilities(FACILITIES, ["emi_emc"]).forEach((x) => x.reasons.forEach((m) => add(m.k)));
  rankFacilities(FACILITIES, []).forEach((x) => x.reasons.forEach((m) => add(m.k)));
  ["draft", "submitted", "query", "approved", "rejected", "open", "closed", "proposed", "published", "queued", "visit planned", "passed", "failed",
   "verified", "pending", "none", "Strong", "Partial", "Lab", "Proof range", "Field firing range", "Test range", "startup", "MSME", "DPSU", "large firm", "DRDO", "DGQA", "DTIS", "Army"].forEach(add);
  return [...keys].filter((k) => k.trim() && /[A-Za-z]/.test(k));
}

it("has a Hindi entry for every interface string", () => {
  const keys = allKeys();
  const missing = keys.filter((k) => !(k in HI));
  writeFileSync(path.resolve(__dirname, "../scripts/i18n-missing.json"), JSON.stringify(missing, null, 1));
  console.log(`keys ${keys.length}, missing ${missing.length}`);
  // Proper names stay as written in every language.
  const names = new Set(["SkyVeer Drones"]);
  if (missing.some((k) => !names.has(k))) throw new Error(`Missing Hindi for: ${missing.filter((k) => !names.has(k)).join(" | ")}`);
});
