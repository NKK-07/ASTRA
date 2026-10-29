import type { Allocation, Placement, ReservedWindow, SlotRequest, WaitItem } from "../types";
import { SCHEMES } from "../data/catalog";

export const RULES_VERSION = "SOP 7 Oct 2026 · scheduler rules v1";

/** Published priority rule. Every point is explainable to the firm. */
export function priorityOf(r: SlotRequest, asOf: string) {
  const milestone = r.milestone ? 40 : 0;
  const days = Math.max(0, Math.floor((Date.parse(asOf) - Date.parse(r.submittedAt)) / 86_400_000));
  const waiting = Math.min(30, Math.floor(days / 3));
  const funded = SCHEMES[r.scheme].funded ? 20 : 0;
  const first = r.firstTime ? 10 : 0;
  return { total: milestone + waiting + funded + first, milestone, waiting, funded, first, days };
}

export function explainPriority(r: SlotRequest, asOf: string) {
  const p = priorityOf(r, asOf);
  const parts = [
    p.milestone ? `milestone ${p.milestone}` : null,
    `waiting ${p.waiting}`,
    p.funded ? `funded scheme ${p.funded}` : null,
    p.first ? `first-time ${p.first}` : null
  ].filter(Boolean);
  return `${p.total} = ${parts.join(" + ")}`;
}

/** Trials share a range day's set-up only when all four match. */
export const batchKeyOf = (r: SlotRequest) =>
  [r.testFamily, r.calibre, r.instrumentation, r.safetyTemplate].join("|");

function batchLabel(r: SlotRequest) {
  return `${r.testFamily} · ${r.calibre} · ${r.safetyTemplate}`;
}

/** Trials that would fit if every trial needed its own set-up (today's practice). */
export function capacityWithoutBatching(w: ReservedWindow, reqs: SlotRequest[], asOf: string) {
  const sorted = [...reqs].sort((a, b) => compare(a, b, asOf));
  const left = w.days.map(() => w.dayHours);
  let n = 0;
  for (const r of sorted) {
    const need = w.setupHours + r.hours;
    const d = left.findIndex((h) => h >= need);
    if (d >= 0) { left[d] -= need; n++; }
  }
  return n;
}

function compare(a: SlotRequest, b: SlotRequest, asOf: string) {
  const d = priorityOf(b, asOf).total - priorityOf(a, asOf).total;
  if (d) return d;
  const t = Date.parse(a.submittedAt) - Date.parse(b.submittedAt);
  return t || a.id.localeCompare(b.id);
}

/**
 * Deterministic allocation for one reserved window.
 * 1. Score each request by the published rule.
 * 2. Group compatible requests into batches (same family, calibre, instrumentation, safety template).
 * 3. Rank set-ups by their highest-priority trial. Place each trial on a day that already has its
 *    set-up (adding only trial time), else open the set-up on the day with most time left.
 * 4. Anything that does not fit goes to the waitlist, ranked, and is offered any freed slot.
 */
export function allocate(w: ReservedWindow, reqs: SlotRequest[], asOf: string, excluded: string[] = []): Allocation {
  const pool = reqs.filter((r) => !excluded.includes(r.id));
  const batches = new Map<string, SlotRequest[]>();
  for (const r of [...pool].sort((a, b) => compare(a, b, asOf))) {
    const k = batchKeyOf(r);
    batches.set(k, [...(batches.get(k) ?? []), r]);
  }
  const order = [...batches.entries()].sort((a, b) => compare(a[1][0], b[1][0], asOf));

  const left = w.days.map(() => w.dayHours);
  const setOn = w.days.map(() => new Set<string>());
  const placements: Placement[] = [];
  const waitlist: WaitItem[] = [];
  const letters = new Map<string, string>();

  for (const [key, members] of order) {
    const multi = members.length > 1;
    if (multi && !letters.has(key)) letters.set(key, String.fromCharCode(65 + letters.size));
    for (const r of members) {
      const p = priorityOf(r, asOf).total;
      let day = setOn.findIndex((s, i) => s.has(key) && left[i] >= r.hours);
      let shared = day >= 0;
      if (!shared) {
        const need = w.setupHours + r.hours;
        let best = -1;
        left.forEach((h, i) => { if (h >= need && (best < 0 || h > left[best])) best = i; });
        day = best;
      }
      if (day < 0) {
        waitlist.push({ requestId: r.id, priority: p, why: { shared: false, hours: r.hours, setup: w.setupHours, batchSize: members.length },
          reason: `Priority ${explainPriority(r, asOf)}. Needs ${w.setupHours + r.hours} h with its own set-up; no day has that much left after the set-ups ranked above it. First in line for freed time.` });
        continue;
      }
      left[day] -= shared ? r.hours : w.setupHours + r.hours;
      setOn[day].add(key);
      const label = multi ? `Batch ${letters.get(key)} · ${batchLabel(r)}` : `Single · ${batchLabel(r)}`;
      placements.push({ requestId: r.id, day, batchKey: key, batchLabel: label, priority: p,
        why: { shared, hours: r.hours, setup: w.setupHours, batchSize: members.length, letter: multi ? letters.get(key) : undefined },
        reason: `Priority ${explainPriority(r, asOf)}. ${shared ? `Shares the set-up already on this day, adding only ${r.hours} h` : `Opens a set-up (${w.setupHours} h) on the day with most time left`}${multi ? `, batched with ${members.length - 1} compatible trial${members.length > 2 ? "s" : ""}` : ""}.` });
    }
  }
  waitlist.sort((a, b) => b.priority - a.priority);
  return {
    placements,
    waitlist,
    withoutBatching: capacityWithoutBatching(w, pool, asOf),
    withBatching: placements.length,
    computedAt: asOf,
    rulesVersion: RULES_VERSION
  };
}
