"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Shell from "@/components/Shell";
import { Head, Panel, Tag, fmtDate } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { FIRMS, OPERATOR_FACILITY, facility } from "@/lib/data/catalog";
import { schemeName, statusName, testName } from "@/components/reasons";
import { evaluate } from "@/lib/core/eligibility";

const TONE = { draft: "s", submitted: "i", query: "a", approved: "i", rejected: "r" } as const;

function Apps() {
  const s = useStore();
  const t = useT();
  const sp = useSearchParams();
  const apps = s.applications.filter((a) => a.facilityId === OPERATOR_FACILITY && a.status !== "draft");
  const [sel, setSel] = useState(sp.get("id") ?? apps.find((a) => a.status === "submitted")?.id ?? apps[0]?.id);
  const [q, setQ] = useState("");
  const a = apps.find((x) => x.id === sel);
  const p = a && s.products.find((x) => x.id === a.productId);
  const r = a && p ? evaluate(p, facility(a.facilityId)!, a.tests) : null;
  return (
    <Shell crumbs={["DTIS Kanpur", "Applications"]}>
      <Head eyebrow={t("DTIS UAS Test Facility · Kanpur")} title={t("Applications")} sub={t("Every application arrives complete, with the SOP rules already applied.")} />
      <div className="grid g-37">
        <Panel title={t("Inbox")} meta={`${apps.length}`}>
          {apps.map((x) => {
            const px = s.products.find((y) => y.id === x.productId)!;
            return (
              <button key={x.id} className="li" style={{ width: "100%", textAlign: "left", background: x.id === sel ? "var(--panel-2)" : undefined }} onClick={() => setSel(x.id)}>
                <span className="x"><b>{px.name}</b><span>{FIRMS.find((f) => f.id === px.firmId)?.name} · {x.id}</span></span>
                <Tag tone={TONE[x.status]}>{statusName(t, x.status)}</Tag>
              </button>
            );
          })}
        </Panel>
        {a && p && r ? (
          <div className="stack">
            <Panel title={<span className="mono">{a.id}</span>} meta={t("UPDATED {date}", { date: fmtDate(a.updatedAt) })}>
              <div className="pb stack">
                <dl className="kv">
                  <dt>{t("Firm")}</dt><dd>{FIRMS.find((f) => f.id === p.firmId)?.name}</dd>
                  <dt>{t("Product")}</dt><dd>{p.name} · {t(p.category)}</dd>
                  <dt>{t("Scheme")}</dt><dd>{schemeName(t, p.scheme)} · {p.schemeStatus === "verified" ? <span className="ice">{t("verified by programme body")}</span> : <span className="amber">{t("verification pending")}</span>}</dd>
                  <dt>{t("Tests")}</dt><dd>{a.tests.map((x) => testName(t, x)).join(", ")}</dd>
                  <dt>{t("Charges")}</dt><dd>{r.charges.waived ? t("Waived (SOP)") : t(r.charges.note)}</dd>
                </dl>
                {a.query && <div className="banner"><Tag tone="a">{t("Query")}</Tag><span className="x">{t(a.query)}{a.answer && <><br /><b>{t("Answer")}:</b> {t(a.answer)}</>}</span></div>}
              </div>
            </Panel>
            <Panel title={t("Documents")} meta={`${Object.values(a.docs).filter(Boolean).length} / ${r.docs.length}`}>
              {r.docs.map((d) => <div className="li" key={d.key}><span className={`box ${a.docs[d.key] ? "y" : ""}`}>{a.docs[d.key] ? "✓" : ""}</span><span className="x">{t(d.label, d.params ? { scheme: t(String(d.params.scheme)) } : undefined)}</span></div>)}
            </Panel>
            {(a.status === "submitted" || a.status === "query") && (
              <Panel title={t("Decision")}>
                <div className="pb stack">
                  <textarea className="input" placeholder={t("Query for the firm (only needed to raise a query)")} value={q} onChange={(e) => setQ(e.target.value)} />
                  <div className="row" style={{ justifyContent: "flex-end" }}>
                    <button className="btn" style={{ color: "var(--red)", borderColor: "var(--red)" }} onClick={() => s.decideApplication(a.id, "rejected")}>{t("Reject")}</button>
                    <button className="btn" disabled={!q.trim()} onClick={() => { s.decideApplication(a.id, "query", q.trim()); setQ(""); }}>{t("Raise query")}</button>
                    <button className="btn p" onClick={() => s.decideApplication(a.id, "approved")}>{t("Approve")}</button>
                  </div>
                </div>
              </Panel>
            )}
          </div>
        ) : <div className="empty">{t("No applications.")}</div>}
      </div>
    </Shell>
  );
}

export default function Page() { return <Suspense><Apps /></Suspense>; }
