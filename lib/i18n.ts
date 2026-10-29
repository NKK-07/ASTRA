"use client";
import { useStore } from "./store";
import { HI } from "./i18n-hi";
import { fill, type Params } from "./core/text";

// Every on-screen string goes through t(). Keys are the English text; {placeholders} are filled after
// translation. Record data (names of firms, facilities and products, IDs, standards) stays as entered.

export type T = (s: string, p?: Params) => string;

export function translate(lang: string, s: string, p?: Params) {
  const tpl = lang === "hi" ? HI[s] ?? s : s;
  return p ? fill(tpl, p) : tpl;
}

export function useT(): T {
  const lang = useStore((s) => s.lang);
  return (s, p) => translate(lang, s, p);
}

export function greeting(t: T) {
  const h = Number(new Date().toLocaleString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }));
  return t(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
}

/** Hindi-aware Latin-script check used by the translation coverage test. */
export const isHindi = () => useStore.getState().lang === "hi";
