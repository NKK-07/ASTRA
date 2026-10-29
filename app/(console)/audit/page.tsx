"use client";
import Shell from "@/components/Shell";
import { Head, Panel, Tag, fmtTime } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { ROLE_LABEL } from "@/lib/nav";

export default function Audit() {
  const s = useStore();
  const t = useT();
  const tp = (p?: Record<string, string | number>) => p && Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" ? t(v) : v]));
  const targetLabel = (x: string) => s.products.find((p) => p.id === x)?.name ?? (x.startsWith("w-") ? `${t("CPE Itarsi")} ${s.windows[0].quarter}` : x);
  return (
    <Shell crumbs={["Audit log"]}>
      <Head eyebrow={t("Accountability")} title={t("Audit log")} sub={t("Every action on the shared record: who, what, when.")} />
      <Panel title={t("Events")} meta={`${s.audit.length}`}>
        <div className="tw"><table className="dense"><thead><tr><th>{t("When")}</th><th>{t("Who")}</th><th>{t("Action")}</th><th>{t("Target")}</th></tr></thead><tbody>
          {s.audit.map((e) => <tr key={e.id}><td className="mono">{fmtTime(e.at)}</td><td>{t(e.actor)}<div className="m">{t(ROLE_LABEL[e.role])}</div></td><td>{t(e.action, tp(e.params))}</td><td><Tag>{targetLabel(e.target)}</Tag></td></tr>)}
        </tbody></table></div>
      </Panel>
    </Shell>
  );
}
