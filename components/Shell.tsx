"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { HOME, NAV, ROLES, ROLE_LABEL } from "@/lib/nav";
import { PEOPLE } from "@/lib/data/catalog";
import { Reticle } from "./ui";
import type { Role } from "@/lib/types";

function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " IST");
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  return <span className="clock">{t}</span>;
}

export function LangSwitch() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  return (
    <div className="seg" role="group" aria-label={t("Language")}>
      <button className={lang === "en" ? "on" : ""} aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
      <button className={lang === "hi" ? "on" : ""} aria-pressed={lang === "hi"} onClick={() => setLang("hi")}>हि</button>
    </div>
  );
}

export default function Shell({ crumbs, children }: { crumbs: string[]; children: ReactNode }) {
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);
  const state = useStore();
  const lang = useStore((s) => s.lang);
  const t = useT();
  const path = usePathname();
  const router = useRouter();
  const me = PEOPLE[role];

  useEffect(() => { document.documentElement.lang = lang === "hi" ? "hi" : "en"; }, [lang]);

  return (
    <div className="shell">
      <header className="bar">
        <Link className="mark" href="/"><Reticle /><b>ASTRATEST</b><span>BHARAT</span></Link>
        <div className="crumbs"><i>/</i>{crumbs.map((c, i) => (i === crumbs.length - 1 ? <b key={i}>{t(c)}</b> : <span key={i}>{t(c)}<i> / </i></span>))}</div>
        <div className="sp" />
        <Link className="k" href="/find">{t("Search")} <kbd>⌘K</kbd></Link>
        <Clock />
        <LangSwitch />
        <label className="who">
          <select aria-label={t("Switch role")} value={role} onChange={(e) => { const r = e.target.value as Role; setRole(r); router.push(HOME[r]); }}>
            {ROLES.map((r) => <option key={r} value={r}>{t(ROLE_LABEL[r])}</option>)}
          </select>
          <span className="av">{me.initials}</span>
        </label>
      </header>
      <nav className="rail" aria-label={t("Main")}>
        {NAV[role].map((n, i) => {
          if (n.group) return <div key={i} className="rg">{t(n.label)}</div>;
          const on = n.href === path;
          const c = n.count?.(state);
          return (
            <Link key={i} className={`ri ${on ? "on" : ""}`} href={n.href!} aria-current={on ? "page" : undefined}>
              <span className="n">{n.n ?? "◆"}</span>{t(n.label)}{c ? <span className="c">{c}</span> : null}
            </Link>
          );
        })}
        <div className="foot"><b>{t(me.name)}</b>{t(me.org)}<br /><br />{t("Unclassified demo data only")}</div>
      </nav>
      <main><div className="view" key={path}>{children}</div></main>
    </div>
  );
}
