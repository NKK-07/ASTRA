"use client";
import Shell from "@/components/Shell";
import { Head, Panel, Strip, Tag, fmtTime } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { SCHEMES, facility } from "@/lib/data/catalog";
import { otherRangeDemand } from "@/lib/data/seed";
import { allocate } from "@/lib/core/scheduler";

export default function Ministry() {
  const s = useStore();
  const t = useT();
  const tp = (p?: Record<string, string | number>) => p && Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" ? t(v) : v]));
  const targetLabel = (x: string) => s.products.find((p) => p.id === x)?.name ?? (x.startsWith("w-") ? t("CPE Itarsi") + " " + w.quarter : x);
  const w = s.windows[0];
  const reqs = s.requests.filter((r) => r.windowId === w.id);
  const a = w.allocation ?? allocate(w, reqs, w.closesOn);
  const rows = [{ facilityId: w.facilityId, requests: reqs.length, capacity: a.withBatching, live: true }, ...otherRangeDemand.map((x) => ({ ...x, live: false }))];
  const max = Math.max(...rows.map((r) => Math.max(r.requests, r.capacity)));
  const totalReq = rows.reduce((x, r) => x + r.requests, 0);
  const totalFit = rows.reduce((x, r) => x + Math.min(r.requests, r.capacity), 0);
  const byScheme = Object.entries(SCHEMES).map(([id, sc]) => ({ name: sc.name, funded: sc.funded, n: reqs.filter((r) => r.scheme === id).length })).filter((x) => x.n);
  const pts = [21, 19, 17, 14, 12, 9, 8, 7, 6, 6, 6, 6];
  const W = 600, H = 120, px = (i: number) => i * (W / (pts.length - 1)), py = (v: number) => H - 8 - (v / 22) * (H - 20);
  const path = pts.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ");
  return (
    <Shell crumbs={["DDP", "Insights"]}>
      <Head eyebrow={t("Department of Defence Production")} title={`${t("Utilisation insights")} · ${w.quarter}`} sub={t("CPE Itarsi figures are live from this platform; other ranges are illustrative.")} />
      <Strip items={[
        { l: t("Requests"), v: totalReq, s: t("{n} proof ranges", { n: rows.length }) },
        { l: t("Trials fitted"), v: totalFit, s: w.allocation ? t("Batching added {n} at CPE", { n: a.withBatching - a.withoutBatching }) : t("Projected, before allocation"), c: "i" },
        { l: t("Unmet demand"), v: totalReq - totalFit, s: t("Case for more reserved days"), c: "a" },
        { l: t("Bumps logged"), v: w.bumps.length, s: t("Every one with a reason") }
      ]} />
      <div className="grid g-73">
        <Panel title={t("Demand against reserved capacity")} meta={t("REQUESTS / TRIALS THAT FIT")}>
          <div className="bars">
            {rows.map((r) => (
              <div className="bar-r" key={r.facilityId}>
                <span>{t(facility(r.facilityId)?.short ?? "")}{r.live && <span className="ice small"> · {t("live")}</span>}</span>
                <div className="tk"><div className="d" style={{ width: `${(r.requests / max) * 100}%` }} /><div className="c" style={{ left: `${(r.capacity / max) * 100}%` }} /></div>
                <span className="v">{r.requests} / {r.capacity}</span>
              </div>
            ))}
          </div>
          <div className="legend"><span><i style={{ background: "var(--amber)" }} />{t("Trial requests")}</span><span><i style={{ background: "var(--ice)" }} />{t("Trials that fit the reserved days")}</span></div>
        </Panel>
        <Panel title={t("CPE Itarsi requests by scheme")}>
          <div className="tw"><table className="dense"><thead><tr><th>{t("Scheme")}</th><th className="r">{t("Requests")}</th><th>{t("Charges")}</th></tr></thead><tbody>
            {byScheme.map((x) => <tr key={x.name}><td>{t(x.name)}</td><td className="r mono">{x.n}</td><td><Tag tone={x.funded ? "i" : "s"}>{x.funded ? t("Waived") : t("Charged")}</Tag></td></tr>)}
          </tbody></table></div>
        </Panel>
      </div>
      <div className="grid g2">
        <Panel title={t("Request to slot, median days")} meta={t("PILOT TARGET · ILLUSTRATIVE")}>
          <div className="pb">
            <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={t("Target: median days from request to slot falling from 21 to 6 over 12 months")}>
              <defs><linearGradient id="gf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--amber)" stopOpacity=".28" /><stop offset="1" stopColor="var(--amber)" stopOpacity="0" /></linearGradient></defs>
              <path d={`${path} L${W} ${H} L0 ${H}Z`} fill="url(#gf)" /><path d={path} fill="none" stroke="var(--amber)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="spread mono faint small mt8"><span>{t("Month {m} · {d} d", { m: 1, d: 21 })}</span><span>{t("Month {m} · {d} d", { m: 12, d: 6 })}</span></div>
          </div>
        </Panel>
        <Panel title={t("Recent activity")} meta={t("AUDIT LOG")}>
          {s.audit.slice(0, 7).map((e) => <div className="li" key={e.id}><span className="x"><b>{t(e.action, tp(e.params))}</b><span>{t(e.actor)} · {targetLabel(e.target)}</span></span><span className="mono faint small">{fmtTime(e.at)}</span></div>)}
        </Panel>
      </div>
    </Shell>
  );
}
