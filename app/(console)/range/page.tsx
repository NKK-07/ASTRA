"use client";
import Link from "next/link";
import Shell from "@/components/Shell";
import { Head, Panel, Strip, Tag } from "@/components/ui";
import { useStore } from "@/lib/store";
import { greeting, useT } from "@/lib/i18n";

const SERVICE_DAYS = [4, 5, 6, 7, 18, 19, 20, 21, 26, 27];

export default function RangeHome() {
  const s = useStore();
  const t = useT();
  const w = s.windows[0];
  const reqs = s.requests.filter((r) => r.windowId === w.id);
  const action = {
    open: { text: t("The {q} window is open with {n} requests.", { q: w.quarter, n: reqs.length }), cta: t("Close window and allocate") },
    closed: { text: t("Window closed with {n} requests for {d} reserved days.", { n: reqs.length, d: w.days.length }), cta: t("Run allocation") },
    proposed: { text: t("Proposed schedule: {n} trials fitted, {m} waitlisted.", { n: w.allocation?.withBatching ?? 0, m: w.allocation?.waitlist.length ?? 0 }), cta: t("Review and publish") },
    published: { text: t("Schedule published: {n} trials on {d} days.", { n: w.allocation?.withBatching ?? 0, d: w.days.length }), cta: t("View schedule") }
  }[w.status];
  return (
    <Shell crumbs={["CPE Itarsi", "Overview"]}>
      <Head eyebrow={t("Central Proof Establishment · Itarsi")} title={`${greeting(t)}, ${t("Col. Menon")}`} />
      <div className="banner"><Tag tone={w.status === "published" ? "i" : "a"}>{w.status === "published" ? t("Done") : t("Action")}</Tag><span className="x"><b>{action.text}</b> {t("Service trials keep priority; every bump needs a reason and is logged.")}</span><Link className="btn p" href="/book">{action.cta} →</Link></div>
      <Strip items={[
        { l: t("Reserved days left, FY"), v: <>6<small>{t("of {n}", { n: 12 })}</small></>, s: t("Q1 and Q4 still to run") },
        { l: t("Requests, Q1"), v: reqs.length, s: t("{x}× baseline capacity", { x: (reqs.length / 9).toFixed(1) }), c: "a" },
        { l: t("Service trials, Jan"), v: SERVICE_DAYS.length, s: t("Days locked for the Services") },
        { l: t("Bumps"), v: w.bumps.length, s: t("Each with a logged reason"), c: w.bumps.length ? "r" : "i" }
      ]} />
      <Panel title={t("Range calendar · January 2027")} meta={t("AMBER = RESERVED INDUSTRY · GREY = SERVICE TRIALS")}>
        <div className="pb">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(31,minmax(0,1fr))", gap: 3 }}>
            {Array.from({ length: 31 }, (_, i) => {
              const d = i + 1, r = d >= 12 && d <= 14, sv = SERVICE_DAYS.includes(d);
              return <div key={d} title={`${d}`} style={{ aspectRatio: "1/1.6", borderRadius: 3, display: "grid", placeItems: "center", font: "500 9.5px var(--mono)", background: r ? "var(--amber)" : sv ? "var(--raise)" : "var(--panel-2)", color: r ? "#111" : sv ? "var(--ink-2)" : "var(--faint)" }}>{d}</div>;
            })}
          </div>
        </div>
      </Panel>
    </Shell>
  );
}
