"use client";
import { STAGES } from "@/lib/data/catalog";
import { useT } from "@/lib/i18n";

export default function Journey({ stage, metas }: { stage: number; metas?: string[] }) {
  const t = useT();
  return (
    <div className="journey">
      {STAGES.map((name, i) => (
        <div key={name} className={`st ${i < stage ? "done" : i === stage ? "now" : ""}`}>
          <span className="n">0{i + 1}</span>
          <b>{t(name)}</b>
          <span>{metas?.[i] ?? ""}</span>
        </div>
      ))}
    </div>
  );
}
