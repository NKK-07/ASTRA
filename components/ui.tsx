"use client";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export function Reticle({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="var(--ink-2)" strokeWidth="1.4" />
      <path d="M12 1v5M12 18v5M1 12h5M18 12h5" stroke="var(--ink-2)" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="2.6" fill="var(--amber)" />
    </svg>
  );
}

export type Tone = "a" | "i" | "r" | "s";
export const Tag = ({ tone = "s", children }: { tone?: Tone; children: ReactNode }) => <span className={`tag t-${tone}`}>{children}</span>;

export function Strip({ items }: { items: { l: string; v: ReactNode; s?: ReactNode; c?: "a" | "i" | "r" | "" }[] }) {
  return (
    <div className="strip">
      {items.map((x, i) => (
        <div key={i}>
          <span className="l">{x.l}</span>
          <span className="v">{x.v}</span>
          {x.s !== undefined && <span className={`s ${x.c ?? ""}`}>{x.s}</span>}
        </div>
      ))}
    </div>
  );
}

export function Panel({ title, meta, actions, children, className = "" }: { title?: ReactNode; meta?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      {(title || meta || actions) && (
        <div className="ph">
          <h3>{title}</h3>
          <div className="row">{meta && <span className="meta">{meta}</span>}{actions}</div>
        </div>
      )}
      {children}
    </section>
  );
}

export function Head({ eyebrow, title, sub, right, big }: { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode; big?: boolean }) {
  return (
    <div className="head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className={`h1 ${big ? "big" : ""}`}>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {right ?? <DemoTag />}
    </div>
  );
}

function DemoTag() {
  const t = useT();
  return <span className="demo">{t("Demo data")}</span>;
}

const loc = () => (useStore.getState().lang === "hi" ? "hi-IN" : "en-GB");
export const fmtDate = (iso: string) => {
  const d = new Date(iso.length === 10 ? iso + "T00:00:00+05:30" : iso);
  return d.toLocaleDateString(loc(), { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
};
export const fmtDay = (iso: string) => new Date(iso + "T00:00:00+05:30").toLocaleDateString(loc(), { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" });
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString(loc(), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Kolkata" }) + " IST";
export const fmtSize = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n > 1e3 ? `${(n / 1e3).toFixed(1)} KB` : `${n} B`);
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
