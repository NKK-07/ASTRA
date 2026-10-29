"use client";
import Link from "next/link";
import { useState } from "react";
import Shell from "@/components/Shell";
import { Head, Panel, Tag, fmtTime } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { verifyRecord } from "@/components/RecordView";
import { facilityName } from "@/lib/select";

export default function Verify() {
  const s = useStore();
  const t = useT();
  const sealed = s.records.filter((r) => r.seal);
  const [res, setRes] = useState<Record<string, { valid: boolean; at: string }>>({});
  const [busy, setBusy] = useState(false);
  async function all() {
    setBusy(true);
    const out: typeof res = {};
    for (const r of sealed) {
      try { const v = await verifyRecord(r); out[r.id] = { valid: v.valid, at: v.checkedAt }; } catch { /* ignore */ }
    }
    setRes(out); setBusy(false);
  }
  return (
    <Shell crumbs={["Verify a record"]}>
      <Head eyebrow={t("Public check")} title={t("Anyone with access can check a seal.")} sub={t("The server recomputes each record's digest from its file hashes and sign-offs and checks the Ed25519 signature. Open a record to check individual files.")} right={<button className="btn p" disabled={busy} onClick={all}>{t("Verify all {n}", { n: sealed.length })}</button>} />
      <Panel title={t("Sealed records")}>
        <div className="tw"><table><thead><tr><th>{t("Record")}</th><th>{t("Facility")}</th><th>{t("Files")}</th><th>{t("Result")}</th><th className="r"></th></tr></thead><tbody>
          {sealed.map((r) => (
            <tr key={r.id}><td className="mono">{r.id}</td><td>{facilityName(r.facilityId, t)}</td><td className="mono">{r.files.length}</td>
              <td>{res[r.id] ? <><Tag tone={res[r.id].valid ? "i" : "r"}>{res[r.id].valid ? t("Verified") : t("Failed")}</Tag> <span className="muted small">{fmtTime(res[r.id].at)}</span></> : <span className="muted">{t("Not checked")}</span>}</td>
              <td className="r"><Link className="btn" href={`/record/${r.id}`}>{t("Open")}</Link></td></tr>
          ))}
        </tbody></table></div>
      </Panel>
      <p className="notice">{t("Public key and algorithm:")} <a className="ice" href="/api/v1/key">/api/v1/key</a>. {t("Files are hashed in the browser and never uploaded.")}</p>
    </Shell>
  );
}
