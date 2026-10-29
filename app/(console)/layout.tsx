"use client";
import type { ReactNode } from "react";
import { useHydrated } from "@/lib/useHydrated";
import { useT } from "@/lib/i18n";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  const ok = useHydrated();
  const t = useT();
  if (!ok) return <div className="loading">{t("Loading console…")}</div>;
  return <>{children}</>;
}
