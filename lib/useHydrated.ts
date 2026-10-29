"use client";
import { useEffect, useState } from "react";
import { useStore } from "./store";

/** True once the persisted demo state has loaded from localStorage (avoids hydration mismatches). */
export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (useStore.persist.hasHydrated()) setOk(true);
    const unsub = useStore.persist.onFinishHydration(() => setOk(true));
    return unsub;
  }, []);
  return ok;
}
