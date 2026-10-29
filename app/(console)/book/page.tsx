"use client";
import { useState } from "react";
import Shell from "@/components/Shell";
import { Head, Strip, Tag, fmtDate, fmtDay } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { FIRMS } from "@/lib/data/catalog";
import { allocate, priorityOf } from "@/lib/core/scheduler";
import { lm7Request } from "@/lib/select";
import { LM7_REQUEST } from "@/lib/data/seed";
import { batchLabel, explainP, family, placementReason, schemeName, waitReason } from "@/components/reasons";
import type { Allocation, SlotRequest } from "@/lib/types";

const firmName = (id: string) => FIRMS.find((f) => f.id === id)?.name ?? id;

export default function Book() {
  const s = useStore();
  const t = useT();
  const role = s.role;
  const w = s.windows[0];
  const reqs = s.requests.filter((r) => r.windowId === w.id);
  const mine = lm7Request(s);
  const a = w.allocation;
  const asOf = w.closesOn;
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<number>(a ? 999 : 0);
  const [bumpFor, setBumpFor] = useState<string | null>(null);
  const [bumpReason, setBumpReason] = useState(t("Service trial (Army) needs this day"));
  const isRange = role === "range";
  const isApplicant = role === "applicant";

  async function run() {
    setBusy(true);
    let result: Allocation;
    try {
      const res = await fetch("/api/v1/allocate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ window: w, requests: reqs, asOf }) });
      if (!res.ok) throw new Error();
      result = await res.json();
    } catch {
      result = allocate(w, reqs, asOf);
    }
    setRevealed(0);
    s.runAllocation(w.id, result);
    result.placements.forEach((_, i) => setTimeout(() => setRevealed(i + 1), 150 + i * 120));
    setTimeout(() => setBusy(false), 200 + result.placements.length * 120);
  }

  const byId = (id: string) => reqs.find((r) => r.id === id) as SlotRequest;
  const myPl = mine && a?.placements.find((p) => p.requestId === mine.id);
  const myWait = mine && a ? a.waitlist.findIndex((x) => x.requestId === mine.id) : -1;
  const statusTone = { open: "i", closed: "a", proposed: "a", published: "i" } as const;
  const sorted = [...reqs].sort((x, y) => priorityOf(y, asOf).total - priorityOf(x, asOf).total);
  const preview = { ...LM7_REQUEST, id: "preview", submittedAt: "2026-10-28" } as SlotRequest;

  return (
    <Shell crumbs={[isRange ? "CPE Itarsi" : "SkyVeer Drones", "Book a slot"]}>
      <Head eyebrow={`04 · ${t("Book a slot")} · ${t("Reserved window")}`} title={t("Central Proof Establishment, Itarsi")}
        sub={t("{q} · {days} · {h} h of range time a day · {s} h per set-up · requests close {close}", { q: w.quarter, days: w.days.map((d) => fmtDay(d)).join(", "), h: w.dayHours, s: w.setupHours, close: fmtDate(w.closesOn) })}
        right={<div className="row">
          <Tag tone={statusTone[w.status]}>{w.status === "proposed" ? t("Proposed · awaiting approval") : t(w.status)}</Tag>
          {isApplicant && w.status === "open" && !mine && <button className="btn p" onClick={() => s.requestSlot(w.id)}>{t("Request this slot")} · LM-7</button>}
          {isRange && w.status === "open" && <button className="btn" onClick={() => s.closeWindow(w.id)}>{t("Close window")}</button>}
          {isRange && (w.status === "closed" || w.status === "proposed") && <button className="btn p" disabled={busy} onClick={run}>{a ? t("Re-run allocation") : t("Run allocation")}</button>}
          {isRange && w.status === "proposed" && <button className="btn p" onClick={() => s.publish(w.id)}>{t("Approve and publish")}</button>}
          {isRange && w.status !== "open" && <button className="btn g" onClick={() => s.reopenWindow(w.id)}>{t("Reopen (demo)")}</button>}
        </div>} />

      {isApplicant && !mine && w.status === "open" && <div className="banner"><Tag tone="a">{t("Next action")}</Tag><span className="x"><b>{t("Your LM-7 warhead safety unit qualifies for this window.")}</b> {t("iDEX milestone due, first time at a proof range: priority {p}.", { p: explainP(t, preview, asOf) })}</span></div>}
      {isApplicant && mine && !a && <div className="banner i"><Tag tone="i">{t("Requested")}</Tag><span className="x"><b>{t("LM-7 is in the queue with priority {p}.", { p: explainP(t, mine, asOf) })}</b> {t("The range authority allocates after the window closes. Switch to Range authority to run it.")}</span></div>}
      {isApplicant && mine && myPl && <div className="banner i"><Tag tone="i">{w.status === "published" ? t("Confirmed") : t("Proposed")}</Tag><span className="x"><b>{t("LM-7 is on {date}, {batch}.", { date: fmtDate(w.days[myPl.day]), batch: batchLabel(t, mine, myPl.why) })}</b> {placementReason(t, mine, asOf, myPl.why)}</span></div>}
      {isApplicant && mine && myWait >= 0 && <div className="banner"><Tag tone="a">{t("Waitlist")}</Tag><span className="x"><b>{t("LM-7 is number {n} on the waitlist.", { n: myWait + 1 })}</b> {waitReason(t, mine, asOf, a!.waitlist[myWait].why, a!.waitlist[myWait].priority)}</span></div>}

      <Strip items={[
        { l: t("Requests"), v: reqs.length, s: t("{f} firms · {s} schemes", { f: new Set(reqs.map((r) => r.firmId)).size, s: new Set(reqs.map((r) => r.scheme)).size }) },
        { l: t("Without batching"), v: a ? a.withoutBatching : "—", s: t("Each trial needs its own set-up") },
        { l: t("Fitted"), v: a ? <>{a.withBatching}<small>{t("trials")}</small></> : "—", s: a ? t("+{n} by sharing set-ups", { n: a.withBatching - a.withoutBatching }) : t("Run the allocation"), c: a ? "i" : "" },
        { l: t("Waitlist"), v: a ? a.waitlist.length : "—", s: t("First offer of freed time"), c: "a" }
      ]} />

      {!a ? (
        <section className="panel">
          <div className="ph"><h3>{t("Queue · ranked by the published rule")}</h3><span className="meta">{t("MILESTONE 40 + WAITING ≤30 + FUNDED 20 + FIRST-TIME 10")}</span></div>
          <div className="tw"><table className="dense"><thead><tr><th>#</th><th>{t("Trial")}</th><th>{t("Firm · scheme")}</th><th>{t("Set-up")}</th><th className="r">{t("Priority")}</th></tr></thead><tbody>
            {sorted.map((r, i) => (
              <tr key={r.id} className={r.productId === "p-lm7" ? "you" : ""}>
                <td className="mono">{i + 1}</td>
                <td>{t(r.item)}<div className="m">{t("{h} h · submitted {date}", { h: r.hours, date: fmtDate(r.submittedAt) })}</div></td>
                <td>{firmName(r.firmId)}<div className="m">{schemeName(t, r.scheme)}</div></td>
                <td className="mono small">{family(t, r.testFamily)} · {t(r.calibre)} · {r.safetyTemplate}</td>
                <td className="r mono">{explainP(t, r, asOf)}</td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      ) : (
        <div className="board">
          <div className="col">
            <div className="ch"><b>{t("Waitlist")}</b><span>{t("auto-offer")}</span></div>
            <div className="cb">
              {a.waitlist.map((x, i) => {
                const r = byId(x.requestId);
                const bumped = w.bumps.some((b) => b.requestId === x.requestId);
                return (
                  <div key={x.requestId} className={`tr wait ${r.productId === "p-lm7" ? "you" : ""} ${bumped ? "bumped" : ""}`} title={waitReason(t, r, asOf, x.why, x.priority)}>
                    <b>{i + 1}. {t(r.item)}</b><span className="p">{x.priority}</span>
                    <span className="m">{firmName(r.firmId)}{bumped ? ` · ${t("bumped")}` : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {w.days.map((d, di) => {
            const on = a.placements.map((p, i) => ({ p, i })).filter(({ p }) => p.day === di);
            const used = on.reduce((sum, { p }) => sum + byId(p.requestId).hours, 0) + new Set(on.map(({ p }) => p.batchKey)).size * w.setupHours;
            let last = "";
            return (
              <div className="col" key={d}>
                <div className="ch"><b>{t("Day {n}", { n: di + 1 })} · {fmtDay(d)}</b><span>{used} / {w.dayHours} h</span></div>
                <div className="cb">
                  {on.map(({ p, i }) => {
                    const r = byId(p.requestId);
                    const head = p.batchKey !== last ? <div className="batch">{batchLabel(t, r, p.why)}</div> : null;
                    last = p.batchKey;
                    return (
                      <div key={p.requestId}>
                        {head}
                        <div className={`tr ${r.productId === "p-lm7" ? "you" : ""} ${i < revealed ? "" : "ghost"}`}>
                          <b>{t(r.item)}</b><span className="p">{p.priority}</span>
                          <span className="m">{firmName(r.firmId)} · {schemeName(t, r.scheme)} · {r.hours} h</span>
                          {(isApplicant ? r.productId === "p-lm7" : true) && <span className="reason">{placementReason(t, r, asOf, p.why)}</span>}
                          {isRange && w.status === "proposed" && (bumpFor === r.id ? (
                            <span className="row" style={{ gridColumn: "1/-1", marginTop: 6 }}>
                              <input className="input" style={{ flex: 1 }} value={bumpReason} onChange={(e) => setBumpReason(e.target.value)} aria-label={t("Reason")} />
                              <button className="btn" style={{ borderColor: "var(--red)", color: "var(--red)" }} disabled={!bumpReason.trim()} onClick={() => { s.bump(w.id, r.id, bumpReason.trim()); setBumpFor(null); }}>{t("Bump")}</button>
                              <button className="btn g" onClick={() => setBumpFor(null)}>{t("Cancel")}</button>
                            </span>
                          ) : <button className="btn g" style={{ gridColumn: "1/-1", height: 24, justifySelf: "start", padding: "0 6px", fontSize: 11.5 }} onClick={() => setBumpFor(r.id)}>{t("Bump for a Service trial…")}</button>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {w.bumps.length > 0 && <div className="banner"><Tag tone="r">{t("Bumps")}</Tag><span className="x">{w.bumps.map((b) => `${t(byId(b.requestId).item)}: ${t(b.reason)} (${t(b.by)})`).join(" · ")}</span></div>}
      <p className="notice">{t("Rule: {v}.", { v: t(a?.rulesVersion ?? "SOP 7 Oct 2026 · scheduler rules v1") })} {t("Trials share a day's set-up only when test family, calibre, instrumentation and safety template all match. Same inputs always give the same schedule. Every bump needs a reason and is logged.")}</p>
    </Shell>
  );
}
