"use client";
import Link from "next/link";
import { useState } from "react";
import Shell from "@/components/Shell";
import { Head, Panel, Tag } from "@/components/ui";
import { useStore } from "@/lib/store";
import { greeting, useT } from "@/lib/i18n";
import { FIRMS } from "@/lib/data/catalog";
import { matchesFor } from "@/lib/core/match";
import { stageName } from "@/components/reasons";

export default function Buyer() {
  const s = useStore();
  const t = useT();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  return (
    <Shell crumbs={["Army user directorate", "Overview"]}>
      <Head eyebrow={t("Army user directorate")} title={`${greeting(t)}, ${t("Lt Col Sharma")}`} sub={t("Post what you need. See Indian products that match, how far each has got, and the sealed evidence behind it.")} />
      <Panel title={t("Post a need")}>
        <div className="pb row" style={{ alignItems: "flex-end" }}>
          <div className="field" style={{ flex: 2 }}><label>{t("Need")}</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("e.g. Thermal sight for night patrols")} /></div>
          <div className="field" style={{ flex: 2 }}><label>{t("Tags, comma separated")}</label><input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t("thermal, electro-optics, night vision")} /></div>
          <button className="btn p" disabled={!title.trim() || !tags.trim()} onClick={() => { s.postNeed({ title: title.trim(), org: "Army user directorate", source: "Posted on AstraTest", tags: tags.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean) }); setTitle(""); setTags(""); }}>{t("Post need")}</button>
        </div>
      </Panel>
      {s.needs.map((n) => {
        const m = matchesFor(n, s.products);
        return (
          <Panel key={n.id} title={t(n.title)} meta={`${t(n.source).toUpperCase()} · ${t("{n} matches", { n: m.length })}`}>
            {m.length === 0 ? <div className="empty">{t("No product matches yet.")}</div> : (
              <div className="tw"><table className="dense"><thead><tr><th>{t("Product")}</th><th>{t("Firm")}</th><th>{t("Stage")}</th><th>{t("Evidence")}</th><th>{t("Fit")}</th><th className="r"></th></tr></thead><tbody>
                {m.map(({ product: p, fit }) => {
                  const recs = s.records.filter((r) => r.productId === p.id && r.seal);
                  const invited = s.trialInvites.includes(p.id);
                  return (
                    <tr key={p.id}>
                      <td>{p.name}<div className="m">{t(p.category)}</div></td>
                      <td>{FIRMS.find((f) => f.id === p.firmId)?.name}</td>
                      <td>{stageName(t, p.stage)}</td>
                      <td>{recs.length ? recs.map((r) => <Link key={r.id} className="mono" href={`/record/${r.id}`}>{r.id} </Link>) : <span className="muted">{t("none yet")}</span>}</td>
                      <td><Tag tone={fit === "Strong" ? "a" : "s"}>{t(fit)}</Tag></td>
                      <td className="r">{invited ? <Tag tone="i">{t("Invited")}</Tag> : <button className="btn" disabled={p.stage < 3} title={p.stage < 3 ? t("Available after QA") : ""} onClick={() => s.inviteToTrial(p.id)}>{t("Invite to user trials")}</button>}</td>
                    </tr>
                  );
                })}
              </tbody></table></div>
            )}
          </Panel>
        );
      })}
    </Shell>
  );
}
