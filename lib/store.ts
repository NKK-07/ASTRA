"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Application, AuditEvent, BuyerNeed, EvidenceFile, Inspection, Product, ReservedWindow, Role, SignOff, SlotRequest, TrialRecord
} from "./types";
import {
  DEMO_TODAY, LM7_REQUEST, seedApplications, seedAudit, seedInspections, seedNeeds, seedProducts, seedRecords, seedRequests, seedWindows
} from "./data/seed";
import { PEOPLE, facility } from "./data/catalog";
import { allocate } from "./core/scheduler";
import { recordDigest } from "./core/seal";

// Demo persistence: one shared record in this browser (localStorage), so every role sees the
// same state when you switch roles. Swap this module for API calls to a database in production.

export type Lang = "en" | "hi";

interface Data {
  role: Role;
  lang: Lang;
  products: Product[];
  applications: Application[];
  requests: SlotRequest[];
  windows: ReservedWindow[];
  records: TrialRecord[];
  inspections: Inspection[];
  needs: BuyerNeed[];
  audit: AuditEvent[];
  facilityVerified: Record<string, boolean>;
  trialInvites: string[];
}

interface Actions {
  setRole: (r: Role) => void;
  setLang: (l: Lang) => void;
  reset: () => void;
  log: (action: string, target: string, params?: Record<string, string | number>) => void;
  createApplication: (a: Omit<Application, "id" | "createdAt" | "updatedAt" | "status">) => string;
  submitApplication: (id: string) => void;
  decideApplication: (id: string, status: "approved" | "rejected" | "query", note?: string) => void;
  answerQuery: (id: string, answer: string) => void;
  requestSlot: (windowId: string) => string | null;
  closeWindow: (windowId: string) => void;
  runAllocation: (windowId: string, result: ReturnType<typeof allocate>) => void;
  bump: (windowId: string, requestId: string, reason: string) => void;
  publish: (windowId: string) => void;
  reopenWindow: (windowId: string) => void;
  createRecord: (r: { productId: string; facilityId: string; test: string; date: string; requiredSignoffs: string[] }) => string;
  addFiles: (recordId: string, files: EvidenceFile[]) => void;
  signOff: (recordId: string, s: SignOff) => void;
  seal: (recordId: string, seal: NonNullable<TrialRecord["seal"]>) => void;
  share: (recordId: string, body: Inspection["body"]) => void;
  setIntegrity: (inspectionId: string, v: "verified" | "failed") => void;
  planVisit: (inspectionId: string, date: string) => void;
  verdict: (inspectionId: string, pass: boolean, note: string) => void;
  setSchemeStatus: (productId: string, s: Product["schemeStatus"]) => void;
  postNeed: (n: Omit<BuyerNeed, "id" | "postedAt">) => void;
  inviteToTrial: (productId: string) => void;
  toggleFacilityVerified: (id: string) => void;
}

const initial = (): Data => ({
  role: "applicant",
  lang: "en",
  products: structuredClone(seedProducts),
  applications: structuredClone(seedApplications),
  requests: structuredClone(seedRequests),
  windows: structuredClone(seedWindows),
  records: structuredClone(seedRecords),
  inspections: structuredClone(seedInspections),
  needs: structuredClone(seedNeeds),
  audit: structuredClone(seedAudit),
  facilityVerified: {},
  trialInvites: []
});

const now = () => new Date().toISOString();
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const useStore = create<Data & Actions>()(
  persist(
    (set, get) => ({
      ...initial(),
      setRole: (role) => set({ role }),
      setLang: (lang) => set({ lang }),
      reset: () => set({ ...initial(), role: get().role, lang: get().lang }),
      log: (action, target, params) => {
        const role = get().role;
        set((s) => ({ audit: [{ id: uid("a"), at: now(), actor: PEOPLE[role].name, role, action, params, target }, ...s.audit].slice(0, 200) }));
      },

      createApplication: (a) => {
        const id = `APP-2026-${String(440 + get().applications.length).padStart(4, "0")}`;
        set((s) => ({ applications: [{ ...a, id, status: "draft", createdAt: now(), updatedAt: now() }, ...s.applications] }));
        get().log("Drafted application", id);
        return id;
      },
      submitApplication: (id) => {
        set((s) => ({ applications: s.applications.map((x) => (x.id === id ? { ...x, status: "submitted", updatedAt: now() } : x)) }));
        get().log("Submitted application", id);
      },
      decideApplication: (id, status, note) => {
        set((s) => ({ applications: s.applications.map((x) => (x.id === id ? { ...x, status, query: status === "query" ? note : x.query, updatedAt: now() } : x)) }));
        get().log(status === "approved" ? "Approved an application" : status === "rejected" ? "Rejected application" : "Raised a query", id);
      },
      answerQuery: (id, answer) => {
        set((s) => ({ applications: s.applications.map((x) => (x.id === id ? { ...x, answer, status: "submitted", updatedAt: now() } : x)) }));
        get().log("Answered query", id);
      },

      requestSlot: (windowId) => {
        if (get().requests.some((r) => r.productId === LM7_REQUEST.productId && r.windowId === windowId)) return null;
        const id = `rq-${String(get().requests.length + 1).padStart(2, "0")}`;
        set((s) => ({ requests: [...s.requests, { ...LM7_REQUEST, windowId, id, submittedAt: DEMO_TODAY }] }));
        get().log("Requested reserved slot", id);
        return id;
      },
      closeWindow: (windowId) => {
        set((s) => ({ windows: s.windows.map((w) => (w.id === windowId ? { ...w, status: "closed" } : w)) }));
        get().log("Closed request window", windowId);
      },
      runAllocation: (windowId, result) => {
        set((s) => ({ windows: s.windows.map((w) => (w.id === windowId ? { ...w, status: "proposed", allocation: result, bumps: [] } : w)) }));
        get().log("Ran allocation: {n} trials fitted", windowId, { n: result.withBatching });
      },
      bump: (windowId, requestId, reason) => {
        const by = PEOPLE[get().role].name;
        set((s) => ({
          windows: s.windows.map((w) => {
            if (w.id !== windowId || !w.allocation) return w;
            const p = w.allocation.placements.find((x) => x.requestId === requestId);
            if (!p) return w;
            return {
              ...w,
              bumps: [...w.bumps, { requestId, reason, at: now(), by }],
              allocation: {
                ...w.allocation,
                placements: w.allocation.placements.filter((x) => x.requestId !== requestId),
                waitlist: [{ requestId, priority: p.priority, reason: `Bumped: ${reason}. Keeps priority ${p.priority} and is first in line for freed time.`, why: { shared: false, hours: 0, setup: 0, batchSize: 1, bumped: reason } }, ...w.allocation.waitlist]
              }
            };
          })
        }));
        get().log("Bumped a slot: {reason}", requestId, { reason });
      },
      publish: (windowId) => {
        set((s) => ({ windows: s.windows.map((w) => (w.id === windowId ? { ...w, status: "published" } : w)) }));
        get().log("Approved and published schedule", windowId);
      },
      reopenWindow: (windowId) => {
        set((s) => ({ windows: s.windows.map((w) => (w.id === windowId ? { ...w, status: "open", allocation: undefined, bumps: [] } : w)) }));
        get().log("Reopened window (demo reset)", windowId);
      },

      createRecord: (r) => {
        const id = `TR-2026-${1120 + get().records.length}`;
        set((s) => ({ records: [{ ...r, id, files: [], signoffs: [], sharedWith: [] }, ...s.records] }));
        get().log("Opened trial record", id);
        return id;
      },
      addFiles: (recordId, files) => {
        set((s) => ({ records: s.records.map((r) => (r.id === recordId && !r.seal ? { ...r, files: [...r.files, ...files] } : r)) }));
        get().log("Added {n} file(s) with SHA-256", recordId, { n: files.length });
      },
      signOff: (recordId, so) => {
        set((s) => ({ records: s.records.map((r) => (r.id === recordId && !r.seal && !r.signoffs.some((x) => x.role === so.role) ? { ...r, signoffs: [...r.signoffs, so] } : r)) }));
        get().log("Signed off as {role}", recordId, { role: so.role });
      },
      seal: (recordId, seal) => {
        set((s) => ({ records: s.records.map((r) => (r.id === recordId ? { ...r, seal } : r)) }));
        get().log("Sealed trial record (Ed25519)", recordId);
      },
      share: (recordId, body) => {
        const rec = get().records.find((r) => r.id === recordId);
        if (!rec || rec.sharedWith.includes(body)) return;
        set((s) => ({
          records: s.records.map((r) => (r.id === recordId ? { ...r, sharedWith: [...r.sharedWith, body] } : r)),
          inspections: [{ id: uid("INS"), recordId, productId: rec.productId, body, status: "queued", queuedAt: now(), integrity: "unchecked" }, ...s.inspections],
          products: s.products.map((p) => (p.id === rec.productId && p.stage < 2 ? { ...p, stage: 2 } : p))
        }));
        get().log("Shared evidence with {body}", recordId, { body });
      },
      setIntegrity: (id, v) => {
        set((s) => ({ inspections: s.inspections.map((i) => (i.id === id ? { ...i, integrity: v } : i)) }));
        get().log(v === "verified" ? "Verified evidence integrity" : "Integrity check failed", id);
      },
      planVisit: (id, date) => {
        set((s) => ({ inspections: s.inspections.map((i) => (i.id === id ? { ...i, status: "visit_planned", visitOn: date } : i)) }));
        get().log("Planned inspection visit for {date}", id, { date });
      },
      verdict: (id, pass, note) => {
        const ins = get().inspections.find((i) => i.id === id);
        set((s) => ({
          inspections: s.inspections.map((i) => (i.id === id ? { ...i, status: pass ? "passed" : "failed", verdictNote: note } : i)),
          products: s.products.map((p) => (ins && p.id === ins.productId && pass && p.stage < 3 ? { ...p, stage: 3 } : p))
        }));
        get().log(pass ? "QA inspection passed" : "QA inspection failed", id);
      },
      setSchemeStatus: (productId, st) => {
        set((s) => ({ products: s.products.map((p) => (p.id === productId ? { ...p, schemeStatus: st } : p)) }));
        get().log(st === "verified" ? "Verified scheme status" : "Refused scheme status", productId);
      },
      postNeed: (n) => {
        set((s) => ({ needs: [{ ...n, id: uid("N"), postedAt: now() }, ...s.needs] }));
        get().log("Posted a need", n.title);
      },
      inviteToTrial: (productId) => {
        set((s) => ({
          trialInvites: [...new Set([...s.trialInvites, productId])],
          products: s.products.map((p) => (p.id === productId && p.stage < 4 ? { ...p, stage: 4 } : p))
        }));
        get().log("Invited to user trials", productId);
      },
      toggleFacilityVerified: (id) => {
        set((s) => ({ facilityVerified: { ...s.facilityVerified, [id]: !(s.facilityVerified[id] ?? facility(id)?.verified) } }));
        get().log("Changed facility verification", id);
      }
    }),
    { name: "astratest-bharat-v1", storage: createJSONStorage(() => localStorage), version: 2,
      // Older demo state lacks structured reasons; start fresh but keep the chosen language.
      migrate: (old) => ({ lang: (old as { lang?: Lang })?.lang ?? "en" }) as unknown as Data & Actions }
  )
);

export { recordDigest };
