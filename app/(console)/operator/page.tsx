"use client";
import Link from "next/link";
import Shell from "@/components/Shell";
import { Head, Panel, Strip, Tag, fmtDate } from "@/components/ui";
import { useStore } from "@/lib/store";
import { greeting, useT } from "@/lib/i18n";
import { FIRMS, OPERATOR_FACILITY } from "@/lib/data/catalog";
import { testName } from "@/components/reasons";

export default function OperatorHome() {
  const s = useStore();
  const t = useT();
  const apps = s.applications.filter((a) => a.facilityId === OPERATOR_FACILITY);
  const open = apps.filter((a) => a.status === "submitted");
  const recs = s.records.filter((r) => r.facilityId === OPERATOR_FACILITY);
  const unsealed = recs.filter((r) => !r.seal);
  const firmOf = (pid: string) => FIRMS.find((f) => f.id === s.products.find((p) => p.id === pid)?.firmId)?.name;
  return (
    <Shell crumbs={["DTIS Kanpur", "Overview"]}>
      <Head eyebrow={t("DTIS UAS Test Facility · Kanpur")} title={`${greeting(t)}, Vikram`} />
      <Strip items={[
        { l: t("Open applications"), v: open.length, s: open.length ? t("Waiting for your decision") : t("Inbox clear"), c: open.length ? "a" : "i" },
        { l: t("Approved this quarter"), v: apps.filter((a) => a.status === "approved").length, s: t("Trials to run") },
        { l: t("Records to seal"), v: unsealed.length, s: unsealed.length ? t("Files or sign-offs pending") : t("All sealed"), c: unsealed.length ? "a" : "i" },
        { l: t("Sealed records"), v: recs.filter((r) => r.seal).length, s: t("Verifiable by QA"), c: "i" }
      ]} />
      <div className="grid g-73">
        <Panel title={t("Needs you today")} meta={t("{n} ITEMS", { n: open.length + unsealed.length })}>
          {open.length + unsealed.length === 0 ? <div className="empty">{t("Nothing waiting. Approve applications and seal records as they come in.")}</div> : (
            <div className="tw"><table className="dense"><thead><tr><th>{t("Item")}</th><th>{t("From")}</th><th>{t("Status")}</th><th className="r"></th></tr></thead><tbody>
              {open.map((a) => <tr key={a.id}><td>{t("Application")} · {a.tests.map((x) => testName(t, x)).join(", ")}<div className="m">{a.id}</div></td><td>{firmOf(a.productId)}</td><td><Tag tone={a.answer ? "a" : "i"}>{a.answer ? t("Query answered") : t("New")}</Tag></td><td className="r"><Link className="btn p" href={`/operator/applications?id=${a.id}`}>{t("Review")}</Link></td></tr>)}
              {unsealed.map((r) => <tr key={r.id}><td>{t("Seal record")} {r.id}<div className="m">{t("{n} files · {s} of {m} sign-offs", { n: r.files.length, s: r.signoffs.length, m: r.requiredSignoffs.length })}</div></td><td>{firmOf(r.productId)}</td><td><Tag tone="a">{t("Open")}</Tag></td><td className="r"><Link className="btn" href={`/record/${r.id}`}>{t("Open")}</Link></td></tr>)}
            </tbody></table></div>
          )}
        </Panel>
        <Panel title={t("Recent records")} className="tl">
          {recs.slice(0, 5).map((r) => <div className="li" key={r.id}><span className="d">{fmtDate(r.date)}</span><span className="x"><Link href={`/record/${r.id}`}>{r.id}</Link> · {firmOf(r.productId)} · {r.seal ? t("sealed") : t("open")}</span></div>)}
        </Panel>
      </div>
    </Shell>
  );
}
