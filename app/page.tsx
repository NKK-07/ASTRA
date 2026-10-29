"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { HOME, ROLES, ROLE_LABEL } from "@/lib/nav";
import { PEOPLE } from "@/lib/data/catalog";
import { LangSwitch } from "@/components/Shell";
import { Reticle } from "@/components/ui";
import { useHydrated } from "@/lib/useHydrated";
import type { Role } from "@/lib/types";

function Rings() {
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i * 5 * Math.PI) / 180, r2 = i % 6 ? 410 : 396;
    return <line key={i} x1={450 + 420 * Math.cos(a)} y1={450 + 420 * Math.sin(a)} x2={450 + r2 * Math.cos(a)} y2={450 + r2 * Math.sin(a)} />;
  });
  return (
    <svg className="rings" viewBox="0 0 900 900" aria-hidden="true">
      <g fill="none" stroke="rgba(255,255,255,.07)">{[420, 340, 260, 180, 100].map((r) => <circle key={r} cx="450" cy="450" r={r} />)}<path d="M450 20v860M20 450h860" /></g>
      <g stroke="rgba(255,255,255,.14)">{ticks}</g>
      <path d="M430 880 Q 470 360 640 300" fill="none" stroke="var(--amber)" strokeWidth="2" strokeDasharray="4 6" opacity=".8" />
      <circle cx="640" cy="300" r="7" fill="var(--amber)" />
      <circle cx="640" cy="300" r="18" fill="none" stroke="var(--amber)" opacity=".4" />
    </svg>
  );
}

export default function SignIn() {
  const ok = useHydrated();
  const setRole = useStore((s) => s.setRole);
  const lang = useStore((s) => s.lang);
  const windows = useStore((s) => s.windows);
  const requests = useStore((s) => s.requests);
  const t = useT();
  const router = useRouter();
  const go = (r: Role) => { setRole(r); router.push(HOME[r]); };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (/^[1-8]$/.test(e.key) && (e.target as HTMLElement).tagName !== "INPUT") go(ROLES[+e.key - 1]); };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  });

  const w = windows[0];
  const n = requests.filter((r) => r.windowId === w?.id).length;

  return (
    <div className="login">
      <section className="lg-l">
        <Rings />
        <div className="spread" style={{ position: "relative" }}>
          <span className="mark"><Reticle size={22} /><b>ASTRATEST</b><span>BHARAT</span></span>
          {ok && <LangSwitch />}
        </div>
        <div style={{ position: "relative" }}>
          <p className="eyebrow a">{t("Shared defence testing · SOP of 7 Oct 2026")}</p>
          <h1 style={{ marginTop: 18 }}>{lang === "hi" ? <>अस्त्रटेस्ट<br /><span>भारत</span></> : <>AstraTest<br /><span>Bharat</span></>}</h1>
          <p className="lead">{t("One front door to India’s defence test ranges.")}</p>
        </div>
        <div className="ticker">
          <div><span className="l">CPE Itarsi · Q1-27</span><span className="v">{t("Window")} <b>{t(ok ? w?.status ?? "open" : "open")}</b> · {t("{n} requests", { n: ok ? n : 19 })}</span></div>
          <div><span className="l">DTIS Kanpur</span><span className="v">{t("EMI chamber · next slot {d} days", { d: 9 })}</span></div>
          <div><span className="l">{t("Reserved days, FY")}</span><span className="v">{t("12 per proof range")}</span></div>
        </div>
      </section>
      <section className="lg-r">
        <div>
          <p className="eyebrow">{t("Demo sign-in")}</p>
          <h2 className="h1" style={{ marginTop: 10 }}>{t("Choose who you are")}</h2>
          <p className="sub" style={{ marginTop: 6 }}>{t("Eight users share one record. Each gets its own console.")}</p>
        </div>
        <div className="roles">
          {ROLES.map((r, i) => (
            <button key={r} className={`role ${i === 0 ? "sel" : ""}`} onClick={() => go(r)}>
              <span className="ix">{i + 1}</span>
              <span className="x"><b>{t(ROLE_LABEL[r])}</b><span>{t(PEOPLE[r].name)} · {t(PEOPLE[r].org)}</span></span>
              <span className="go">↵</span>
            </button>
          ))}
        </div>
        <p className="notice">{t("Unclassified demo data only")} · {t("Press 1–8")} · {t("State is kept in this browser; switch roles any time from the top bar.")}</p>
      </section>
    </div>
  );
}
