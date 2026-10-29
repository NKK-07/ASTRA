"use client";
import Link from "next/link";
import Shell from "@/components/Shell";
import { Head, Panel, Tag } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { fmtDate } from "@/components/ui";
import { testName } from "@/components/reasons";
import { facilityName, myProducts } from "@/lib/select";

export default function Evidence() {
  const s = useStore();
  const t = useT();
  const mine = myProducts(s).map((p) => p.id);
  const recs = s.records.filter((r) => mine.includes(r.productId));
  return (
    <Shell crumbs={["SkyVeer Drones", "Evidence"]}>
      <Head eyebrow={`05 · ${t("Evidence")}`} title={t("Trial records no one has to take on trust.")} sub={t("Each record is sealed at the facility: every file hashed, every sign-off included, the whole signed with the platform's Ed25519 key. QA bodies verify it themselves.")} />
      <Panel title={t("Your trial records")} meta={`${recs.length}`}>
        {recs.length === 0 ? <div className="empty">{t("No records yet. The facility opens one when your trial runs.")}</div> : (
          <div className="tw"><table><thead><tr><th>{t("Record")}</th><th>{t("Product")}</th><th>{t("Facility · test")}</th><th>{t("Status")}</th><th>{t("Shared")}</th><th className="r"></th></tr></thead><tbody>
            {recs.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.id}<div className="m">{fmtDate(r.date)}</div></td>
                <td>{s.products.find((p) => p.id === r.productId)?.name}</td>
                <td>{facilityName(r.facilityId, t)}<div className="m">{testName(t, r.test)} · {t("{n} files", { n: r.files.length })}</div></td>
                <td><Tag tone={r.seal ? "i" : "a"}>{r.seal ? t("Sealed") : t("Open")}</Tag></td>
                <td>{r.sharedWith.length ? r.sharedWith.join(", ") : <span className="muted">—</span>}</td>
                <td className="r"><Link className={`btn ${r.seal && !r.sharedWith.length ? "p" : ""}`} href={`/record/${r.id}`}>{r.seal && !r.sharedWith.length ? t("Open and share") : t("Open")}</Link></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </Panel>
    </Shell>
  );
}
