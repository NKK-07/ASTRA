"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Shell from "@/components/Shell";
import { Head, Panel, Tag } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { FIRMS, OPERATOR_FACILITY } from "@/lib/data/catalog";
import { fmtDate } from "@/components/ui";
import { testName } from "@/components/reasons";

export default function OperatorRecords() {
  const s = useStore();
  const t = useT();
  const router = useRouter();
  const approved = s.applications.filter((a) => a.facilityId === OPERATOR_FACILITY && a.status === "approved");
  const recs = s.records.filter((r) => r.facilityId === OPERATOR_FACILITY);
  const [appId, setAppId] = useState(approved[0]?.id ?? "");
  const app = approved.find((a) => a.id === appId);
  const [tst, setTst] = useState(app?.tests[0] ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const create = () => {
    if (!app) return;
    const id = s.createRecord({ productId: app.productId, facilityId: OPERATOR_FACILITY, test: tst || app.tests[0], date,
      requiredSignoffs: ["Range officer, DTIS Kanpur", "Observer, user Service", "Firm test lead"] });
    router.push(`/record/${id}`);
  };
  return (
    <Shell crumbs={["DTIS Kanpur", "Trial records"]}>
      <Head eyebrow={t("DTIS UAS Test Facility · Kanpur")} title={t("Trial records")} sub={t("Open a record when a trial runs, add the files, collect sign-offs, then seal.")} />
      <Panel title={t("Open a record for a trial")}>
        <div className="pb row" style={{ alignItems: "flex-end" }}>
          <div className="field" style={{ flex: 2 }}><label>{t("Approved application")}</label>
            <select className="input" value={appId} onChange={(e) => { setAppId(e.target.value); setTst(approved.find((a) => a.id === e.target.value)?.tests[0] ?? ""); }}>
              {approved.map((a) => <option key={a.id} value={a.id}>{a.id} · {s.products.find((p) => p.id === a.productId)?.name}</option>)}
            </select></div>
          <div className="field" style={{ flex: 1 }}><label>{t("Test")}</label>
            <select className="input" value={tst} onChange={(e) => setTst(e.target.value)}>{app?.tests.map((x) => <option key={x} value={x}>{testName(t, x)}</option>)}</select></div>
          <div className="field"><label>{t("Date")}</label><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <button className="btn p" disabled={!app} onClick={create}>{t("Open record")} →</button>
        </div>
        {approved.length === 0 && <div className="empty">{t("Approve an application first.")}</div>}
      </Panel>
      <Panel title={t("Records")} meta={`${recs.length}`}>
        <div className="tw"><table><thead><tr><th>{t("Record")}</th><th>{t("Firm · product")}</th><th>{t("Test")}</th><th>{t("Files")}</th><th>{t("Status")}</th><th className="r"></th></tr></thead><tbody>
          {recs.map((r) => {
            const p = s.products.find((x) => x.id === r.productId);
            return <tr key={r.id}><td className="mono">{r.id}<div className="m">{fmtDate(r.date)}</div></td><td>{FIRMS.find((f) => f.id === p?.firmId)?.name}<div className="m">{p?.name}</div></td><td>{testName(t, r.test)}</td><td className="mono">{r.files.length}</td><td><Tag tone={r.seal ? "i" : "a"}>{r.seal ? t("Sealed") : t("Open")}</Tag></td><td className="r"><Link className="btn" href={`/record/${r.id}`}>{t("Open")}</Link></td></tr>;
          })}
        </tbody></table></div>
      </Panel>
    </Shell>
  );
}
