"use client";
import Link from "next/link";
import Shell from "@/components/Shell";
import Journey from "@/components/Journey";
import { Head, Panel, Strip, Tag, fmtDate } from "@/components/ui";
import { inr } from "@/components/ui";
import { useStore } from "@/lib/store";
import { greeting, useT } from "@/lib/i18n";
import { facility } from "@/lib/data/catalog";
import { facilityName, lm7Request, myProducts, placementOf } from "@/lib/select";
import { evaluate } from "@/lib/core/eligibility";
import { matchesFor } from "@/lib/core/match";
import { batchLabel, placementReason, schemeName, stageName, statusName, waitReason } from "@/components/reasons";

export default function ApplicantHome() {
  const s = useStore();
  const t = useT();
  const mine = myProducts(s);
  const req = lm7Request(s);
  const pl = placementOf(s, req?.id);
  const w = s.windows[0];
  const swarmRec = s.records.find((r) => r.id === "TR-2026-1118");
  const swarmIns = s.inspections.find((i) => i.recordId === "TR-2026-1118");

  let next: { text: string; sub: string; href: string; cta: string; tone: "a" | "i" };
  if (!req && w.status === "open")
    next = { text: t("Request the reserved proof-firing slot at CPE Itarsi for the LM-7 warhead safety unit."), sub: t("Q1 2027 window closes {date}. Your iDEX project qualifies; charges are waived.", { date: fmtDate(w.closesOn) }), href: "/book", cta: t("Request slot"), tone: "a" };
  else if (swarmRec && swarmRec.sharedWith.length === 0)
    next = { text: t("Share sealed record TR-2026-1118 with DGAQA to start QA inspection of the Swarm-ISR payload."), sub: t("QA can verify the sealed hashes themselves, so no re-test is needed."), href: "/record/TR-2026-1118", cta: t("Open record"), tone: "a" };
  else if (w.status === "published" && pl?.placement)
    next = { text: t("Your slot at CPE Itarsi is confirmed for {date}. Upload the range safety clearance before the trial.", { date: fmtDate(w.days[pl.placement.day]) }), sub: placementReason(t, req!, w.closesOn, pl.placement.why), href: "/book", cta: t("See schedule"), tone: "i" };
  else if (pl && pl.waitIndex >= 0)
    next = { text: t("LM-7 is number {n} on the CPE Itarsi waitlist and will be offered the first freed time.", { n: pl.waitIndex + 1 }), sub: waitReason(t, req!, w.closesOn, w.allocation!.waitlist[pl.waitIndex].why, w.allocation!.waitlist[pl.waitIndex].priority), href: "/book", cta: t("See schedule"), tone: "a" };
  else if (req)
    next = { text: t("Your LM-7 request is in the CPE Itarsi queue. The range authority allocates after the window closes."), sub: t("{n} requests for {d} reserved days.", { n: s.requests.filter((r) => r.windowId === w.id).length, d: w.days.length }), href: "/book", cta: t("See queue"), tone: "i" };
  else next = { text: t("Find a facility for your next test."), sub: t("Search by the test you need."), href: "/find", cta: t("Find a facility"), tone: "i" };

  const approved = s.applications.filter((a) => mine.some((p) => p.id === a.productId) && a.status === "approved");
  const waived = approved.reduce((sum, a) => {
    const p = mine.find((x) => x.id === a.productId)!;
    const e = evaluate(p, facility(a.facilityId)!, a.tests);
    return sum + (e.charges.waived ? e.charges.estimate : 0);
  }, 0);
  const strong = s.needs.flatMap((n) => matchesFor(n, mine)).filter((m) => m.fit === "Strong").length;
  const upcoming: [string, string][] = [
    ...(pl?.placement && w.status === "published" ? [[fmtDate(w.days[pl.placement.day]), t("Proof firing · CPE Itarsi · {batch}", { batch: batchLabel(t, req!, pl.placement.why).split(" · ")[0] })] as [string, string]] : []),
    [fmtDate(w.closesOn), t("CPE Itarsi Q1 2027 request window closes")],
    ...s.applications.filter((a) => mine.some((p) => p.id === a.productId) && a.status !== "approved").map((a) => [t("Pending"), `${a.id} · ${facilityName(a.facilityId, t)} · ${statusName(t, a.status)}`] as [string, string]),
    ...(swarmIns?.visitOn ? [[fmtDate(swarmIns.visitOn), t("DGAQA inspection visit")] as [string, string]] : [])
  ];

  return (
    <Shell crumbs={["SkyVeer Drones", "Overview"]}>
      <div className="calm stack" style={{ gap: 22 }}>
        <Head eyebrow="SkyVeer Drones · iDEX" title={`${greeting(t)}, Ananya`} />
        <div className="next">
          <div>
            <Tag tone={next.tone}>{t("Next action")}</Tag>
            <p className="big">{next.text}</p>
            <p className="sub">{next.sub}</p>
          </div>
          <Link className="btn p" href={next.href}>{next.cta} →</Link>
        </div>
        <Strip items={[
          { l: t("Products in testing"), v: mine.filter((p) => p.stage >= 1 && p.stage < 6).length, s: mine.map((p) => p.name.split(" ")[0]).join(", ") },
          { l: t("Trials booked"), v: <>{approved.length + (pl?.placement ? 1 : 0)}</>, s: req ? t("LM-7 slot requested") : t("No proof slot yet"), c: req ? "i" : "" },
          { l: t("Charges waived"), v: inr(waived), s: t("Placeholder rates until annexures") },
          { l: t("Buyer matches"), v: <>{strong}<small>{t("strong")}</small></>, s: t("From posted needs"), c: "a" }
        ]} />
        <Panel title={mine[0].name} meta={t("STAGE {n} / 7", { n: mine[0].stage + 1 })}>
          <div className="pb"><Journey stage={mine[0].stage} metas={[t("Sep 2026"), swarmRec?.seal ? t("TR-2026-1118 sealed") : t("In progress"), swarmIns ? `${swarmIns.body} · ${statusName(t, swarmIns.status)}` : "DGAQA", "CEMILAC", t("Indian Army"), t("iDEX route"), "—"]} /></div>
        </Panel>
        <div className="grid g2">
          <Panel title={t("Your products")}>
            <div className="tw"><table><thead><tr><th>{t("Product")}</th><th>{t("Scheme")}</th><th>{t("Stage")}</th></tr></thead><tbody>
              {mine.map((p) => (
                <tr key={p.id}><td>{p.name}<div className="m">{t(p.category)}</div></td>
                  <td>{schemeName(t, p.scheme)}<div className="m">{p.schemeStatus === "verified" ? t("verified") : p.schemeStatus === "pending" ? t("verification pending") : t(p.schemeStatus)}</div></td>
                  <td><Tag tone={p.stage >= 2 ? "a" : "i"}>{stageName(t, p.stage)}</Tag></td></tr>
              ))}
            </tbody></table></div>
          </Panel>
          <Panel title={t("Upcoming")} className="tl">
            {upcoming.map((e, i) => <div className="li" key={i}><span className="d">{e[0]}</span><span className="x">{e[1]}</span></div>)}
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
