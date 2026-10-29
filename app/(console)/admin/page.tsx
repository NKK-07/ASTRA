"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { Head, Panel, Strip, Tag } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { PEOPLE } from "@/lib/data/catalog";
import { ROLES, ROLE_LABEL } from "@/lib/nav";
import { facilities } from "@/lib/select";
import { kindName } from "@/components/reasons";
import { RULES_VERSION } from "@/lib/core/scheduler";
import { SOP_RULES_VERSION } from "@/lib/core/eligibility";

export default function Admin() {
  const s = useStore();
  const t = useT();
  const facs = facilities(s);
  const [key, setKey] = useState<{ keyId: string; demoKey: boolean } | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { fetch("/api/v1/key").then((r) => r.json()).then(setKey).catch(() => setKey(null)); }, []);
  return (
    <Shell crumbs={["Platform", "Facilities and rules"]}>
      <Head eyebrow={t("AstraTest Bharat operations")} title={t("Facilities and rules")} right={confirm ? <span className="row"><span className="small muted">{t("Erase all demo changes?")}</span><button className="btn" onClick={() => setConfirm(false)}>{t("Cancel")}</button><button className="btn p" onClick={() => { s.reset(); setConfirm(false); }}>{t("Yes, reset")}</button></span> : <button className="btn" onClick={() => setConfirm(true)}>{t("Reset demo data")}</button>} />
      <Strip items={[
        { l: t("Facilities"), v: facs.length, s: t("{n} verified", { n: facs.filter((f) => f.verified).length }) },
        { l: t("Roles"), v: ROLES.length, s: t("One console each") },
        { l: t("Sealing key"), v: <span className="mono" style={{ fontSize: 18 }}>{key?.keyId ?? "…"}</span>, s: key?.demoKey ? t("Public demo key: set SEAL_SECRET") : t("Private key from SEAL_SECRET"), c: key?.demoKey ? "a" : "i" },
        { l: t("Audit events"), v: s.audit.length, s: t("Kept in this demo") }
      ]} />
      <Panel title={t("Facilities")} meta={t("VERIFY AGAINST THE SOP ANNEXURES")}>
        <div className="tw"><table className="dense"><thead><tr><th>{t("Facility")}</th><th>{t("Owner")}</th><th>{t("Kind")}</th><th>{t("Status")}</th><th className="r"></th></tr></thead><tbody>
          {facs.map((f) => <tr key={f.id}><td>{t(f.name)}<div className="m">{t(f.city)}, {t(f.state)}</div></td><td className="mono">{t(f.owner)}</td><td>{kindName(t, f.kind)}</td><td><Tag tone={f.verified ? "i" : "a"}>{f.verified ? t("Verified") : t("Unverified")}</Tag></td><td className="r"><button className="btn g" onClick={() => s.toggleFacilityVerified(f.id)}>{f.verified ? t("Mark unverified") : t("Mark verified")}</button></td></tr>)}
        </tbody></table></div>
      </Panel>
      <div className="grid g2">
        <Panel title={t("Users and roles")}>
          {ROLES.map((r) => <div className="li" key={r}><span className="x"><b>{t(PEOPLE[r].name)}</b><span>{t(PEOPLE[r].org)}</span></span><Tag>{t(ROLE_LABEL[r])}</Tag></div>)}
        </Panel>
        <Panel title={t("Rules in force")}>
          <div className="pb"><dl className="kv">
            <dt>{t("Eligibility")}</dt><dd>{t(SOP_RULES_VERSION)}</dd>
            <dt>{t("Scheduler")}</dt><dd>{t(RULES_VERSION)}</dd>
            <dt>{t("Priority")}</dt><dd>{t("milestone 40 + waiting up to 30 + funded scheme 20 + first time 10")}</dd>
            <dt>{t("Batching")}</dt><dd>{t("Same test family, calibre, instrumentation and safety template")}</dd>
            <dt>{t("Sealing")}</dt><dd>{t("SHA-256 per file, canonical record digest, Ed25519 signature")}</dd>
            <dt>{t("Data")}</dt><dd>{t("Unclassified only. Production: NIC Cloud or a MeitY-empanelled Indian cloud, CERT-In rules.")}</dd>
          </dl></div>
        </Panel>
      </div>
    </Shell>
  );
}
