"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import Shell from "@/components/Shell";
import { Head, Panel, Tag } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { test } from "@/lib/data/catalog";
import { facilities } from "@/lib/select";
import { kindName, statusName, testName } from "@/components/reasons";

export default function FacilityPage() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const t = useT();
  const f = facilities(s).find((x) => x.id === id);
  if (!f) return <Shell crumbs={["Facility"]}><div className="empty">{t("Facility not found.")}</div></Shell>;
  const w = s.windows.find((x) => x.facilityId === f.id);
  return (
    <Shell crumbs={["Facilities", f.short]}>
      <Head eyebrow={`${t(f.owner)} · ${t(f.city)}, ${t(f.state)}`} title={t(f.name)} right={<div className="row">{f.nabl && <Tag tone="i">NABL</Tag>}<Tag tone={f.verified ? "i" : "a"}>{f.verified ? t("Details verified") : t("Details unverified")}</Tag></div>} />
      <div className="grid g2">
        <Panel title={t("Tests offered")}>
          <div className="tw"><table><thead><tr><th>{t("Test")}</th><th>{t("Standard")}</th><th className="r">{t("Hours per trial")}</th></tr></thead><tbody>
            {f.tests.map((x) => <tr key={x}><td>{testName(t, x)}</td><td className="mono">{test(x)?.standards.map((st) => t(st)).join(", ")}</td><td className="r mono">{test(x)?.hours}</td></tr>)}
          </tbody></table></div>
        </Panel>
        <Panel title={t("Booking")}>
          <div className="pb stack">
            <dl className="kv">
              <dt>{t("Kind")}</dt><dd>{kindName(t, f.kind)}</dd>
              <dt>{t("Next slot")}</dt><dd>{t("About {d} days", { d: f.nextSlotDays })}</dd>
              <dt>{t("Reserved window")}</dt><dd>{f.kind === "proof_range" ? (w ? `${w.quarter} · ${t("{n} days", { n: w.days.length })} · ${statusName(t, w.status)}` : t("3 days a quarter under the SOP")) : t("Not a proof range: regular calendar")}</dd>
            </dl>
            {f.note && <p className="notice">{t(f.note)}</p>}
            <div className="row"><Link className="btn p" href={`/check?f=${f.id}`}>{t("Check eligibility")} →</Link>{w && <Link className="btn" href="/book">{t("See reserved window")}</Link>}</div>
          </div>
        </Panel>
      </div>
    </Shell>
  );
}
