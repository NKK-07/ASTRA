"use client";
import Link from "next/link";
import { useState } from "react";
import Shell from "@/components/Shell";
import { Head, Panel, Strip, Tag, fmtDate } from "@/components/ui";
import { verifyRecord } from "@/components/RecordView";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { FIRMS } from "@/lib/data/catalog";
import { statusName, testName } from "@/components/reasons";

export default function QA() {
  const s = useStore();
  const t = useT();
  const [visit, setVisit] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const list = [...s.inspections].sort((a, b) => Date.parse(a.queuedAt) - Date.parse(b.queuedAt));
  const days = (iso: string) => Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 86_400_000));
  async function check(id: string, recordId: string) {
    const r = s.records.find((x) => x.id === recordId);
    if (!r) return;
    setBusy(id);
    try { const v = await verifyRecord(r); s.setIntegrity(id, v.valid ? "verified" : "failed"); } catch { /* offline */ }
    setBusy(null);
  }
  const open = list.filter((i) => i.status === "queued" || i.status === "visit_planned");
  return (
    <Shell crumbs={["DGAQA", "Inspection queue"]}>
      <Head eyebrow={t("DGAQA regional office · Bengaluru")} title={t("Inspection queue")} sub={t("Evidence arrives sealed. Check integrity yourself, plan the visit, record the verdict. No re-test needed when the seal holds.")} />
      <Strip items={[
        { l: t("Packs waiting"), v: open.length, s: open.length ? t("Oldest {n} days", { n: Math.max(...open.map((i) => days(i.queuedAt))) }) : t("Queue clear"), c: open.length ? "a" : "i" },
        { l: t("Integrity verified"), v: list.filter((i) => i.integrity === "verified").length, s: t("Checked against the seal"), c: "i" },
        { l: t("Verdicts"), v: list.filter((i) => i.status === "passed" || i.status === "failed").length, s: t("{n} passed", { n: list.filter((i) => i.status === "passed").length }) },
        { l: t("Integrity failures"), v: list.filter((i) => i.integrity === "failed").length, s: t("Would trigger a re-test"), c: list.some((i) => i.integrity === "failed") ? "r" : "i" }
      ]} />
      <Panel title={t("Inspection queue")} meta={t("OLDEST FIRST")}>
        {list.length === 0 ? <div className="empty">{t("Nothing shared with QA yet. Firms share sealed records from their Evidence page.")}</div> : (
          <div className="tw"><table className="dense"><thead><tr><th>{t("Product · firm")}</th><th>{t("Evidence")}</th><th>{t("Integrity")}</th><th>{t("Status")}</th><th>{t("Action")}</th></tr></thead><tbody>
            {list.map((i) => {
              const p = s.products.find((x) => x.id === i.productId);
              const r = s.records.find((x) => x.id === i.recordId);
              const mine = i.productId === "p-swarm" || i.productId === "p-lm7";
              return (
                <tr key={i.id} className={mine ? "you" : ""}>
                  <td>{p?.name}<div className="m">{FIRMS.find((f) => f.id === p?.firmId)?.name} · {t("waiting {n} d", { n: days(i.queuedAt) })}</div></td>
                  <td className="mono"><Link href={`/record/${i.recordId}`}>{i.recordId}</Link><div className="m">{r ? `${testName(t, r.test)} · ${t("{n} files", { n: r.files.length })}` : ""}</div></td>
                  <td>{i.integrity === "verified" ? <Tag tone="i">{t("Verified")}</Tag> : i.integrity === "failed" ? <Tag tone="r">{t("Failed")}</Tag> : <button className="btn" disabled={busy === i.id} onClick={() => check(i.id, i.recordId)}>{t("Verify")}</button>}</td>
                  <td><Tag tone={i.status === "passed" ? "i" : i.status === "failed" ? "r" : "a"}>{statusName(t, i.status)}</Tag>{i.visitOn && <div className="m">{t("Visit {date}", { date: fmtDate(i.visitOn) })}</div>}</td>
                  <td>
                    {i.status === "queued" && <span className="row"><input className="input" type="date" value={visit[i.id] ?? ""} onChange={(e) => setVisit({ ...visit, [i.id]: e.target.value })} aria-label={t("Visit date")} /><button className="btn p" disabled={!visit[i.id] || i.integrity !== "verified"} onClick={() => s.planVisit(i.id, visit[i.id])}>{t("Plan visit")}</button></span>}
                    {i.status === "visit_planned" && <span className="row"><input className="input" placeholder={t("Verdict note")} value={note[i.id] ?? ""} onChange={(e) => setNote({ ...note, [i.id]: e.target.value })} /><button className="btn p" onClick={() => s.verdict(i.id, true, note[i.id] ?? "")}>{t("Pass")}</button><button className="btn" style={{ color: "var(--red)", borderColor: "var(--red)" }} onClick={() => s.verdict(i.id, false, note[i.id] ?? "")}>{t("Fail")}</button></span>}
                    {(i.status === "passed" || i.status === "failed") && <span className="muted small">{i.verdictNote || t("Recorded")}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody></table></div>
        )}
      </Panel>
      <p className="notice">{t("Verify integrity first; the visit can only be planned once the seal holds.")}</p>
    </Shell>
  );
}
