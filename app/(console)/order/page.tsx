"use client";
import Link from "next/link";
import { useState } from "react";
import Shell from "@/components/Shell";
import Journey from "@/components/Journey";
import { Head, Panel, Tag } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { stageName, statusName } from "@/components/reasons";
import { matchScore } from "@/lib/core/match";
import { myProducts } from "@/lib/select";

const NEXT: Record<number, { title: string; steps: string[] }> = {
  0: { title: "Get the prototype tested", steps: ["Find a facility that runs your test matrix", "Check the waiver and documents", "Apply, then book the trial"] },
  1: { title: "Finish developmental testing", steps: ["Complete every test in the matrix", "Have the facility seal each record", "Share sealed records with the QA body"] },
  2: { title: "QA inspection", steps: ["QA verifies the sealed evidence", "QA plans an inspection visit", "QA records a verdict"] },
  3: { title: "Certification", steps: ["Submit the certification dossier (CEMILAC for airborne items)", "Answer queries", "Receive certificate"] },
  4: { title: "User trials", steps: ["Agree the trial plan with the user Service", "Book the trial range", "Seal the trial record"] },
  5: { title: "Procurement route", steps: ["Confirm the route (iDEX procurement, Make, or open tender)", "Prepare commercial bid", "Await contract"] },
  6: { title: "Order placed", steps: ["Deliver", "Track field feedback"] }
};

export default function Order() {
  const s = useStore();
  const t = useT();
  const mine = myProducts(s);
  const [pid, setPid] = useState(mine[0].id);
  const p = mine.find((x) => x.id === pid)!;
  const recs = s.records.filter((r) => r.productId === p.id);
  const ins = s.inspections.filter((i) => i.productId === p.id);
  const n = NEXT[p.stage];
  const matches = s.needs.map((need) => ({ need, ...matchScore(need, p) })).filter((m) => m.hits > 0);
  const invited = s.trialInvites.includes(p.id);
  return (
    <Shell crumbs={["SkyVeer Drones", "Prototype to order"]}>
      <Head eyebrow={`06 · ${t("Prototype to order")}`} title={p.name} right={<select className="input" value={pid} onChange={(e) => setPid(e.target.value)} aria-label={t("Product")}>{mine.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>} />
      <Panel title={t("Seven stages")} meta={t("NOW: {stage}", { stage: stageName(t, p.stage).toUpperCase() })}>
        <div className="pb"><Journey stage={p.stage} metas={["", recs.some((r) => r.seal) ? t("{n} sealed record(s)", { n: recs.filter((r) => r.seal).length }) : "", ins[0] ? `${ins[0].body} · ${statusName(t, ins[0].status)}` : "", "", invited ? t("Invited by buyer") : "", "", ""]} /></div>
      </Panel>
      <div className="grid g2">
        <Panel title={`${t("Next step")}: ${t(n.title)}`}>
          {n.steps.map((x, i) => {
            const done = (p.stage === 1 && i === 1 && recs.some((r) => r.seal)) || (p.stage === 1 && i === 2 && recs.some((r) => r.sharedWith.length)) ||
              (p.stage === 2 && i === 0 && ins.some((x) => x.integrity === "verified")) || (p.stage === 2 && i === 1 && ins.some((x) => x.visitOn));
            return <div className="li" key={x}><span className={`box ${done ? "y" : ""}`}>{done ? "✓" : ""}</span><span className="x">{t(x)}</span></div>;
          })}
          <div className="pb row" style={{ borderTop: "1px solid var(--line)" }}>
            {p.stage <= 1 && <Link className="btn p" href={recs.some((r) => r.seal && !r.sharedWith.length) ? `/record/${recs.find((r) => r.seal && !r.sharedWith.length)!.id}` : "/find"}>{recs.some((r) => r.seal && !r.sharedWith.length) ? t("Share sealed record") : t("Find a facility")} →</Link>}
            {p.stage === 2 && <span className="muted small">{t("Waiting for the QA body. Switch to QA and certification to act.")}</span>}
          </div>
        </Panel>
        <Panel title={t("Buyer needs that match")} meta={`${matches.length}`}>
          {matches.length === 0 ? <div className="empty">{t("No posted need matches this product yet.")}</div> : (
            <div className="tw"><table><thead><tr><th>{t("Need")}</th><th>{t("Source")}</th><th>{t("Fit")}</th></tr></thead><tbody>
              {matches.map((m) => <tr key={m.need.id}><td>{t(m.need.title)}<div className="m">{t(m.need.org)}</div></td><td>{t(m.need.source)}</td><td><Tag tone={m.fit === "Strong" ? "a" : "s"}>{t(m.fit)}</Tag></td></tr>)}
            </tbody></table></div>
          )}
        </Panel>
      </div>
    </Shell>
  );
}
