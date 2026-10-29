"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { Head, Panel, Tag } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { TESTS, test } from "@/lib/data/catalog";
import { TEST_MATRIX, rankFacilities } from "@/lib/core/eligibility";
import { facilities, myProducts } from "@/lib/select";
import { kindName, testName } from "@/components/reasons";

export default function Find() {
  const s = useStore();
  const t = useT();
  const mine = myProducts(s);
  const [q, setQ] = useState(t("EMI/EMC and flight trial for a UAS payload"));
  const [needs, setNeeds] = useState<string[]>(["emi_emc", "uas_flight"]);
  const [nabl, setNabl] = useState(false);
  const [owner, setOwner] = useState("");
  const [product, setProduct] = useState(mine[0].id);
  const facs = facilities(s);
  const ranked = useMemo(() => {
    const words = q.toLowerCase();
    const fromText = TESTS.filter((x) => words.includes(x.name.toLowerCase().split(" ")[0]) || words.includes(t(x.name).toLowerCase()) || x.standards.some((st) => words.includes(st.toLowerCase()))).map((x) => x.id);
    const all = [...new Set([...needs, ...(needs.length ? [] : fromText)])];
    return rankFacilities(facs, all, { nabl, owner: owner || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, needs, nabl, owner, facs]);
  const [sel, setSel] = useState<string | null>(null);
  const top = ranked.find((r) => r.facility.id === sel) ?? ranked[0];
  const toggle = (id: string) => setNeeds((n) => (n.includes(id) ? n.filter((x) => x !== id) : [...n, id]));
  const p = mine.find((x) => x.id === product)!;
  const matrix = TEST_MATRIX[p.category] ?? p.testNeeds;
  const full = top && top.covered === needs.length;

  return (
    <Shell crumbs={["SkyVeer Drones", "Find a facility"]}>
      <Head eyebrow={`01 · ${t("Find a facility")}`} title={t("Search by the test you need, not by who owns the range.")}
        sub={t("{n} facilities across DRDO, DGQA, the Services and DTIS. Names marked unverified are illustrative until checked against the SOP annexures.", { n: facs.length })} />
      <label className="q">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("Search")} />
        <span className="tag t-s">{t("{n} results", { n: ranked.length })}</span>
      </label>
      <div className="chips">
        {TESTS.map((x) => <button key={x.id} className={`chip ${needs.includes(x.id) ? "on" : ""}`} onClick={() => toggle(x.id)}>{t(x.name)}</button>)}
      </div>
      <div className="row">
        <button className={`chip ${nabl ? "on" : ""}`} onClick={() => setNabl(!nabl)}>{t("NABL accredited only")}</button>
        <select className="input" value={owner} onChange={(e) => setOwner(e.target.value)} aria-label={t("Owner")}>
          <option value="">{t("Any owner")}</option>{["DRDO", "DGQA", "DTIS", "Army"].map((o) => <option key={o} value={o}>{t(o)}</option>)}
        </select>
        <span className="muted small">{t("Test matrix for")}</span>
        <select className="input" value={product} onChange={(e) => setProduct(e.target.value)} aria-label={t("Product")}>
          {mine.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <button className="btn" onClick={() => setNeeds(matrix)}>{t("Use its {n} tests", { n: matrix.length })}</button>
      </div>
      <div className="grid g-73">
        <Panel title={t("Facilities")} meta={t("RANKED BY FIT")}>
          {ranked.length === 0 ? <div className="empty">{t("No facility runs these tests. Remove a filter.")}</div> : (
            <div className="tw"><table><thead><tr><th>{t("Facility")}</th><th>{t("Owner")}</th><th>{t("Tests and standards")}</th><th>{t("Next slot")}</th><th>{t("Match")}</th></tr></thead><tbody>
              {ranked.map((r, i) => (
                <tr key={r.facility.id} className={i === 0 ? "best" : ""} onClick={() => setSel(r.facility.id)} style={{ cursor: "pointer", background: top?.facility.id === r.facility.id ? "rgba(255,255,255,.03)" : undefined }}>
                  <td><b style={{ fontWeight: 500 }}>{t(r.facility.name)}</b><div className="m">{t(r.facility.city)}, {t(r.facility.state)} · {kindName(t, r.facility.kind)}</div></td>
                  <td className="mono">{t(r.facility.owner)}</td>
                  <td>{r.facility.tests.map((x) => testName(t, x)).join(" · ")}<div className="m">{[...new Set(r.facility.tests.flatMap((x) => test(x)?.standards ?? []))].map((x) => t(x)).join(" · ")}</div></td>
                  <td className="mono">{t("{d} d", { d: r.facility.nextSlotDays })}<div className="m">{r.facility.nabl ? "NABL ✓" : r.facility.verified ? t("verified") : t("unverified")}</div></td>
                  <td><span className="score" style={{ ["--w" as string]: `${Math.min(100, r.score)}%` }}><i />{r.score}</span></td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </Panel>
        {top && (
          <Panel title={t("Why it ranks here")} meta={t(top.facility.short).toUpperCase()}>
            <div className="pb why">
              {top.reasons.map((x, i) => <div className="li" key={i}><span className={`box ${i === 0 && full ? "y" : ""}`}>{i === 0 && full ? "✓" : ""}</span><span className="x">{t(x.k, x.p)}</span></div>)}
              {top.facility.note && <p className="notice mt8">{t(top.facility.note)}</p>}
              <div className="row mt16">
                <Link className="btn p" href={`/check?f=${top.facility.id}&p=${product}&t=${needs.filter((n) => top.facility.tests.includes(n)).join(",")}`}>{t("Check eligibility")} →</Link>
                <Link className="btn" href={`/facility/${top.facility.id}`}>{t("Facility page")}</Link>
              </div>
            </div>
          </Panel>
        )}
      </div>
      <div className="banner i"><Tag tone="i">{t("Test matrix")}</Tag><span className="x"><b>{t("{cat} usually needs {n} tests:", { cat: t(p.category), n: matrix.length })}</b> <span className="muted">{matrix.map((x) => `${testName(t, x)} (${t(test(x)?.standards[0] ?? "")})`).join(", ")}.</span></span></div>
    </Shell>
  );
}
