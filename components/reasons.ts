"use client";
import type { T } from "@/lib/i18n";
import type { SlotRequest, Why } from "@/lib/types";
import { priorityOf } from "@/lib/core/scheduler";
import { SCHEMES, STAGES, test } from "@/lib/data/catalog";

// Renders the scheduler's structured facts as sentences in the chosen language.

export function explainP(t: T, r: SlotRequest, asOf: string) {
  const p = priorityOf(r, asOf);
  const parts = [
    p.milestone ? t("milestone {n}", { n: p.milestone }) : null,
    t("waiting {n}", { n: p.waiting }),
    p.funded ? t("funded scheme {n}", { n: p.funded }) : null,
    p.first ? t("first-time {n}", { n: p.first }) : null
  ].filter(Boolean);
  return `${p.total} = ${parts.join(" + ")}`;
}

export const family = (t: T, f: string) => t(f);

export function batchLabel(t: T, r: SlotRequest, why?: Why) {
  const head = why?.letter ? t("Batch {l}", { l: why.letter }) : t("Single");
  return `${head} · ${family(t, r.testFamily)} · ${t(r.calibre)} · ${r.safetyTemplate}`;
}

export function placementReason(t: T, r: SlotRequest, asOf: string, why?: Why) {
  if (!why) return "";
  const first = t("Priority {p}.", { p: explainP(t, r, asOf) });
  const how = why.shared ? t("Shares the set-up already on this day, adding only {h} h", { h: why.hours }) : t("Opens a set-up ({s} h) on the day with most time left", { s: why.setup });
  const batch = why.batchSize > 1 ? (why.batchSize > 2 ? t(", batched with {n} compatible trials", { n: why.batchSize - 1 }) : t(", batched with 1 compatible trial")) : "";
  return `${first} ${how}${batch}.`;
}

export function waitReason(t: T, r: SlotRequest, asOf: string, why?: Why, priority?: number) {
  if (why?.bumped) return t("Bumped: {reason}. Keeps priority {p} and is first in line for freed time.", { reason: t(why.bumped), p: priority ?? "" });
  if (!why) return "";
  return `${t("Priority {p}.", { p: explainP(t, r, asOf) })} ${t("Needs {h} h with its own set-up; no day has that much left after the set-ups ranked above it. First in line for freed time.", { h: why.setup + why.hours })}`;
}

export const schemeName = (t: T, id: keyof typeof SCHEMES) => t(SCHEMES[id].name);
export const testName = (t: T, id: string) => t(test(id)?.name ?? id);
export const stageName = (t: T, i: number) => t(STAGES[i]);
export const kindName = (t: T, k: string) => t({ lab: "Lab", proof_range: "Proof range", field_firing_range: "Field firing range", test_range: "Test range" }[k] ?? k);
export const firmType = (t: T, k: string) => t({ startup: "startup", msme: "MSME", dpsu: "DPSU", large: "large firm" }[k] ?? k);
export const statusName = (t: T, s: string) => t(s.replace("_", " "));
