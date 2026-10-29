"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Shell from "@/components/Shell";
import { Head, Panel, Tag, inr } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { evaluate } from "@/lib/core/eligibility";
import { facilities, myProducts } from "@/lib/select";
import { schemeName, testName } from "@/components/reasons";

function Check() {
  const s = useStore();
  const t = useT();
  const sp = useSearchParams();
  const mine = myProducts(s);
  const facs = facilities(s);
  const [pid, setPid] = useState(sp.get("p") ?? mine[0].id);
  const [fid, setFid] = useState(sp.get("f") ?? "dtis-kanpur");
  const p = mine.find((x) => x.id === pid) ?? mine[0];
  const f = facs.find((x) => x.id === fid) ?? facs[0];
  const initial = (sp.get("t") ?? "").split(",").filter(Boolean);
  const [tests, setTests] = useState<string[]>(initial.length ? initial : p.testNeeds.filter((x) => f.tests.includes(x)));
  const r = evaluate(p, f, tests);
  const ready = tests.length > 0 && r.verdicts.every((v) => v.id !== "capability" || v.ok === true);
  const onFile = (k: string) => k === "profile" || (k === "sanction" && !!p.sanctionRef);
  const V = (tpl: string, params: Record<string, string | number>) => t(tpl, { ...params, scheme: params.scheme ? t(String(params.scheme)) : "", facility: params.facility ? t(String(params.facility)) : "" });

  return (
    <Shell crumbs={["SkyVeer Drones", "Check eligibility"]}>
      <Head eyebrow={`02 · ${t("Check eligibility")}`} title={t("The SOP’s rules, applied before you apply.")} right={<span className="demo">{t(r.rulesVersion)}</span>} />
      <div className="grid g-37">
        <Panel title={t("Project")}>
          <div className="pb stack">
            <div className="field"><label>{t("Product")}</label>
              <select className="input" value={pid} onChange={(e) => { setPid(e.target.value); const np = mine.find((x) => x.id === e.target.value)!; setTests(np.testNeeds.filter((x) => f.tests.includes(x))); }}>
                {mine.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select></div>
            <div className="field"><label>{t("Facility")}</label>
              <select className="input" value={fid} onChange={(e) => { setFid(e.target.value); const nf = facs.find((x) => x.id === e.target.value)!; setTests(p.testNeeds.filter((x) => nf.tests.includes(x))); }}>
                {facs.map((x) => <option key={x.id} value={x.id}>{t(x.short)} · {t(x.owner)}</option>)}
              </select></div>
            <div className="field"><label>{t("Tests at this facility")}</label>
              <div className="chips">{f.tests.map((x) => <button key={x} className={`chip ${tests.includes(x) ? "on" : ""}`} onClick={() => setTests((ts) => ts.includes(x) ? ts.filter((y) => y !== x) : [...ts, x])}>{testName(t, x)}</button>)}</div></div>
            <dl className="kv">
              <dt>{t("Scheme")}</dt><dd>{schemeName(t, p.scheme)}</dd>
              <dt>{t("Sanction")}</dt><dd className="mono">{p.sanctionRef ?? "—"}</dd>
              <dt>{t("Status")}</dt><dd><Tag tone={p.schemeStatus === "verified" ? "i" : "a"}>{p.schemeStatus === "verified" ? t("Verified by programme body") : t("Awaiting programme body")}</Tag></dd>
            </dl>
          </div>
        </Panel>
        <div className="stack">
          <div className="grid g2">
            {r.verdicts.slice(0, 2).map((v) => (
              <div key={v.id} className={`verdict ${v.ok === true ? "ok" : "am"}`}>
                <span className="ic">{v.id === "waiver" ? (v.ok === true ? "₹0" : "₹") : v.ok === true ? "3d" : "!"}</span>
                <div><b>{t(v.tTitle)}</b><span>{V(v.tDetail, v.params)}</span><div className="reason mono">{t(v.rule)}</div></div>
              </div>
            ))}
          </div>
          <Panel title={t("Rules applied")} meta={t("{n} / {m} CLEAR", { n: r.verdicts.filter((v) => v.ok === true).length, m: r.verdicts.length })}>
            {r.verdicts.slice(2).map((v) => (
              <div className="li" key={v.id}><span className={`box ${v.ok === true ? "y" : ""}`}>{v.ok === true ? "✓" : "!"}</span>
                <span className="x"><b>{t(v.tTitle)}</b><span>{v.id === "capability" ? tests.map((x) => testName(t, x)).join(", ") : V(v.tDetail, v.params)}</span></span><span className="mono faint small">{t(v.rule)}</span></div>
            ))}
            <div className="li"><span className="box y">₹</span><span className="x"><b>{t("Charges for this request: {amount}", { amount: r.charges.waived ? "₹0" : inr(r.charges.estimate) })}</b>
              <span>{r.charges.waived ? t("Would be about {amount} without the waiver.", { amount: inr(r.charges.estimate) }) + " " : ""}{t(r.charges.note)}</span></span></div>
          </Panel>
          <Panel title={t("Documents")} meta={t("{n} REQUIRED", { n: r.docs.length })}>
            {r.docs.map((d) => (
              <div className="li" key={d.key}><span className={`box ${onFile(d.key) ? "y" : ""}`}>{onFile(d.key) ? "✓" : ""}</span>
                <span className="x"><b>{t(d.label, d.params ? { scheme: t(String(d.params.scheme)) } : undefined)}</b><span>{t(d.why)}</span></span>
                <Tag tone={onFile(d.key) ? "i" : "a"}>{d.key === "profile" ? t("From profile") : d.key === "sanction" && p.sanctionRef ? t("On file") : t("To attach")}</Tag></div>
            ))}
          </Panel>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            {ready ? <Link className="btn p" href={`/apply?p=${p.id}&f=${f.id}&t=${tests.join(",")}`}>{t("Start application")} →</Link> : <button className="btn p" disabled>{t("Pick tests this facility runs")}</button>}
          </div>
        </div>
      </div>
    </Shell>
  );
}

export default function Page() { return <Suspense><Check /></Suspense>; }
