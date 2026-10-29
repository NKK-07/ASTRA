"use client";
import Shell from "@/components/Shell";
import { Head, Panel, Strip, Tag } from "@/components/ui";
import { useStore } from "@/lib/store";
import { greeting, useT } from "@/lib/i18n";
import { FIRMS, SCHEMES } from "@/lib/data/catalog";
import { schemeName, stageName } from "@/components/reasons";

export default function Programme() {
  const s = useStore();
  const t = useT();
  const funded = s.products.filter((p) => SCHEMES[p.scheme].funded);
  const pending = funded.filter((p) => p.schemeStatus === "pending");
  const stuck = funded.filter((p) => p.stage <= 1 && !s.records.some((r) => r.productId === p.id && r.seal));
  return (
    <Shell crumbs={["DIO · iDEX", "Overview"]}>
      <Head eyebrow={t("Defence Innovation Organisation · iDEX and TDF")} title={`${greeting(t)}, Meera`} sub={t("Confirm scheme status so the SOP waiver applies, and see where funded projects are stuck.")} />
      <Strip items={[
        { l: t("Funded projects"), v: funded.length, s: t("iDEX, TDF, Make") },
        { l: t("Awaiting verification"), v: pending.length, s: pending.length ? t("Waiver blocked until you confirm") : t("None"), c: pending.length ? "a" : "i" },
        { l: t("Past testing"), v: funded.filter((p) => p.stage >= 2).length, s: t("In QA or beyond"), c: "i" },
        { l: t("Stuck before testing"), v: stuck.length, s: t("No sealed record yet"), c: stuck.length ? "a" : "i" }
      ]} />
      <Panel title={t("Scheme verification")} meta={t("{n} PENDING", { n: pending.length })}>
        {pending.length === 0 ? <div className="empty">{t("All scheme claims are verified.")}</div> : pending.map((p) => (
          <div className="li" key={p.id}>
            <span className="x"><b>{p.name}</b><span>{FIRMS.find((f) => f.id === p.firmId)?.name} · {schemeName(t, p.scheme)} · <span className="mono">{p.sanctionRef}</span></span></span>
            <button className="btn" style={{ color: "var(--red)", borderColor: "var(--red)" }} onClick={() => s.setSchemeStatus(p.id, "rejected")}>{t("Refuse")}</button>
            <button className="btn p" onClick={() => s.setSchemeStatus(p.id, "verified")}>{t("Confirm sanction")}</button>
          </div>
        ))}
      </Panel>
      <Panel title={t("Funded projects")} meta={t("TESTING PROGRESS")}>
        <div className="tw"><table><thead><tr><th>{t("Project")}</th><th>{t("Scheme")}</th><th>{t("Status")}</th><th>{t("Stage")}</th></tr></thead><tbody>
          {funded.map((p) => <tr key={p.id}><td>{p.name}<div className="m">{FIRMS.find((f) => f.id === p.firmId)?.name}</div></td><td>{schemeName(t, p.scheme)}<div className="m mono">{p.sanctionRef ?? "—"}</div></td>
            <td><Tag tone={p.schemeStatus === "verified" ? "i" : p.schemeStatus === "rejected" ? "r" : "a"}>{t(p.schemeStatus)}</Tag></td><td>{stageName(t, p.stage)}{stuck.includes(p) && <div className="m amber">{t("no sealed record yet")}</div>}</td></tr>)}
        </tbody></table></div>
      </Panel>
    </Shell>
  );
}
