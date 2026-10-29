"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Shell from "@/components/Shell";
import { Head, Panel, Tag, fmtDate } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { FIRMS, facility, test } from "@/lib/data/catalog";
import { evaluate } from "@/lib/core/eligibility";
import { facilityName, myProducts } from "@/lib/select";
import { firmType, schemeName, statusName, testName } from "@/components/reasons";

const TONE = { draft: "s", submitted: "i", query: "a", approved: "i", rejected: "r" } as const;

function NewApplication({ pid, fid, tests }: { pid: string; fid: string; tests: string[] }) {
  const s = useStore();
  const t = useT();
  const router = useRouter();
  const p = s.products.find((x) => x.id === pid)!;
  const f = facility(fid)!;
  const r = evaluate(p, f, tests);
  const auto = (k: string) => k === "profile" || (k === "sanction" && !!p.sanctionRef) || k === "trial_plan";
  const [docs, setDocs] = useState<Record<string, boolean>>(Object.fromEntries(r.docs.map((d) => [d.key, auto(d.key)])));
  const done = r.docs.every((d) => docs[d.key]);
  const firm = FIRMS.find((x) => x.id === p.firmId)!;
  const save = (submit: boolean) => {
    const id = s.createApplication({ productId: p.id, facilityId: f.id, tests, docs });
    if (submit) s.submitApplication(id);
    router.push(`/apply/${id}`);
  };
  return (
    <div className="grid g2">
      <Panel title={t("Auto-filled from your profile")} meta={t("ENTERED ONCE")}>
        <div className="pb"><dl className="kv">
          <dt>{t("Firm")}</dt><dd>{firm.name} · {firmType(t, firm.type)} · {t(firm.city)}</dd>
          <dt>{t("Product")}</dt><dd>{p.name} ({t(p.category)})</dd>
          <dt>{t("Scheme")}</dt><dd>{schemeName(t, p.scheme)} · <span className="mono">{p.sanctionRef ?? "—"}</span></dd>
          <dt>{t("Facility")}</dt><dd>{t(f.name)}, {t(f.city)}</dd>
          <dt>{t("Tests")}</dt><dd>{tests.map((x) => `${testName(t, x)} (${t(test(x)?.standards[0] ?? "")})`).join(", ")}</dd>
          <dt>{t("Charges")}</dt><dd>{r.charges.waived ? t("Waived under the SOP") : t(r.charges.note)}</dd>
          <dt>{t("Disputes")}</dt><dd>{t("Conciliation clause (SOP format)")}</dd>
        </dl></div>
      </Panel>
      <Panel title={t("Documents")} meta={`${Object.values(docs).filter(Boolean).length} / ${r.docs.length}`}>
        {r.docs.map((d) => (
          <label className="check" key={d.key}>
            <input type="checkbox" checked={!!docs[d.key]} disabled={auto(d.key)} onChange={(e) => setDocs({ ...docs, [d.key]: e.target.checked })} />
            <span className="x" style={{ flex: 1 }}><b style={{ fontWeight: 500 }}>{t(d.label, d.params ? { scheme: t(String(d.params.scheme)) } : undefined)}</b>
              <div className="reason">{auto(d.key) ? t("Filled from your profile") : t("Tick when attached (demo: no file upload needed)")}</div></span>
          </label>
        ))}
        <div className="pb row" style={{ justifyContent: "flex-end", borderTop: "1px solid var(--line)" }}>
          <button className="btn g" onClick={() => save(false)}>{t("Save draft")}</button>
          <button className="btn p" disabled={!done} onClick={() => save(true)}>{t("Submit to {facility}", { facility: t(f.short) })} →</button>
        </div>
      </Panel>
    </div>
  );
}

function Apply() {
  const s = useStore();
  const t = useT();
  const sp = useSearchParams();
  const mine = myProducts(s);
  const apps = s.applications.filter((a) => mine.some((p) => p.id === a.productId));
  const pid = sp.get("p"), fid = sp.get("f"), tests = (sp.get("t") ?? "").split(",").filter(Boolean);
  const [answer, setAnswer] = useState<Record<string, string>>({});
  return (
    <Shell crumbs={["SkyVeer Drones", "Apply"]}>
      <Head eyebrow={`03 · ${t("Apply")}`} title={t("Fill once. Every owner gets the pack it needs.")} />
      {pid && fid && tests.length > 0 ? <NewApplication pid={pid} fid={fid} tests={tests} /> : (
        <div className="banner i"><Tag tone="i">{t("New")}</Tag><span className="x">{t("Start from Check eligibility so the rules and documents are filled for you.")}</span><Link className="btn" href="/check">{t("Check eligibility")} →</Link></div>
      )}
      <Panel title={t("Your applications")} meta={`${apps.length}`}>
        <div className="tw"><table><thead><tr><th>{t("Application")}</th><th>{t("Facility")}</th><th>{t("Status")}</th><th>{t("Updated")}</th><th className="r"></th></tr></thead><tbody>
          {apps.map((a) => (
            <tr key={a.id}>
              <td className="mono">{a.id}<div className="m">{s.products.find((p) => p.id === a.productId)?.name}</div></td>
              <td>{facilityName(a.facilityId, t)}<div className="m">{a.tests.map((x) => testName(t, x)).join(", ")}</div></td>
              <td><Tag tone={TONE[a.status]}>{statusName(t, a.status)}</Tag>{a.status === "query" && <div className="reason" style={{ whiteSpace: "normal", maxWidth: 320 }}>{t("Query")}: {a.query}</div>}</td>
              <td className="mono">{fmtDate(a.updatedAt)}</td>
              <td className="r">
                {a.status === "draft" && <button className="btn p" onClick={() => s.submitApplication(a.id)}>{t("Submit")}</button>}
                {a.status === "query" && <span className="row"><input className="input" placeholder={t("Your answer")} value={answer[a.id] ?? ""} onChange={(e) => setAnswer({ ...answer, [a.id]: e.target.value })} /><button className="btn p" disabled={!answer[a.id]} onClick={() => s.answerQuery(a.id, answer[a.id])}>{t("Reply")}</button></span>}
                {" "}<Link className="btn" href={`/apply/${a.id}`}>{t("Pack")}</Link>
              </td>
            </tr>
          ))}
        </tbody></table></div>
      </Panel>
    </Shell>
  );
}

export default function Page() { return <Suspense><Apply /></Suspense>; }
