import type { Application, AuditEvent, BuyerNeed, Inspection, Product, ReservedWindow, SlotRequest, TrialRecord } from "../types";
import seals from "./seed-seals.json";

// Initial demo state. Everything here is invented and unclassified.

export const DEMO_TODAY = "2026-10-28";

export const seedProducts: Product[] = [
  { id: "p-swarm", firmId: "skyveer", name: "Swarm-ISR payload v2", category: "UAS payload", scheme: "idex", sanctionRef: "iDEX/DISC-11/0427 (demo)",
    schemeStatus: "verified", stage: 1, tags: ["uas", "isr", "payload", "swarm"], testNeeds: ["emi_emc", "env_vibration", "env_thermal", "uas_flight"] },
  { id: "p-lm7", firmId: "skyveer", name: "LM-7 warhead safety unit", category: "Loitering munition sub-system", scheme: "idex", sanctionRef: "iDEX/DISC-12/0611 (demo)",
    schemeStatus: "verified", stage: 1, tags: ["loitering munition", "fuze", "safety"], testNeeds: ["fuze_safety", "warhead"] },
  { id: "p-mesh", firmId: "skyveer", name: "MeshLink tactical radio", category: "Tactical radio", scheme: "tdf", sanctionRef: "TDF/2026/CS-14 (demo)",
    schemeStatus: "pending", stage: 0, tags: ["radio", "comms", "swarm", "mesh"], testNeeds: ["emi_emc", "env_vibration", "env_thermal", "antenna"] },
  { id: "p-radio", firmId: "vajra", name: "Rugged tactical radio", category: "Tactical radio", scheme: "make2", schemeStatus: "verified", stage: 2,
    tags: ["radio", "comms"], testNeeds: ["env_thermal", "env_vibration"] },
  { id: "p-thermal", firmId: "thermosight", name: "Thermal imager core", category: "Electro-optics", scheme: "idex", sanctionRef: "iDEX/DISC-10/0388 (demo)",
    schemeStatus: "pending", stage: 1, tags: ["electro-optics", "thermal", "night vision"], testNeeds: ["emi_emc", "env_thermal"] },
  { id: "p-airframe", firmId: "aerofab", name: "UAV airframe, fatigue-rated", category: "UAS payload", scheme: "tdf", sanctionRef: "TDF/2025/AE-07 (demo)",
    schemeStatus: "verified", stage: 2, tags: ["uas", "airframe"], testNeeds: ["env_vibration", "uas_flight"] },
  { id: "p-netround", firmId: "sudarshan", name: "Anti-drone net round, 40 mm", category: "Small arms ammunition", scheme: "idex", sanctionRef: "iDEX/DISC-11/0502 (demo)",
    schemeStatus: "verified", stage: 4, tags: ["counter-drone", "uas", "ammunition"], testNeeds: ["proof_ammunition"] }
];

const R = (id: string, firmId: string, item: string, scheme: SlotRequest["scheme"], family: string, calibre: string, instr: string, tpl: string,
  hours: number, milestone: boolean, firstTime: boolean, submittedAt: string): SlotRequest =>
  ({ id, windowId: "w-cpe-q1-27", firmId, item, scheme, testFamily: family, calibre, instrumentation: instr, safetyTemplate: tpl, hours, milestone, firstTime, submittedAt });

// 19 requests already in the CPE Itarsi Q1 2027 window. SkyVeer's LM-7 request is added in the demo.
export const seedRequests: SlotRequest[] = [
  R("rq-01", "kavach", "7.62 mm barrel endurance", "tdf", "small arms", "7.62 mm", "chronograph", "SA-1", 1, true, false, "2026-09-02"),
  R("rq-02", "kavach", "7.62 mm sniper accuracy", "own", "small arms", "7.62 mm", "chronograph", "SA-1", 1, false, true, "2026-09-20"),
  R("rq-03", "shaurya", "7.62 mm ammunition lot", "make2", "small arms", "7.62 mm", "chronograph", "SA-1", 1, true, false, "2026-09-05"),
  R("rq-04", "bharatforge", "7.62 mm match ammunition", "own", "small arms", "7.62 mm", "chronograph", "SA-1", 1, false, false, "2026-10-10"),
  R("rq-05", "trishul", "Proximity fuze, 155 mm", "make1", "fuze", "155 mm", "high-speed camera", "FZ-2", 1, true, false, "2026-09-01"),
  R("rq-06", "trishul", "Point-detonating fuze, 155 mm", "make1", "fuze", "155 mm", "high-speed camera", "FZ-2", 1, false, false, "2026-09-12"),
  R("rq-07", "garuda", "Electronic time fuze, 155 mm", "mod_dev", "fuze", "155 mm", "high-speed camera", "FZ-2", 1, false, false, "2026-10-01"),
  R("rq-08", "agnipath", "Rocket motor static firing", "tdf", "rocket", "122 mm", "thrust stand + radar", "RK-1", 1.5, true, true, "2026-08-28"),
  R("rq-09", "agnipath", "Rocket propellant lot", "own", "rocket", "122 mm", "thrust stand + radar", "RK-1", 1.5, false, false, "2026-09-25"),
  R("rq-10", "garuda", "Guided rocket motor", "mod_dev", "rocket", "122 mm", "thrust stand + radar", "RK-1", 1.5, true, false, "2026-09-08"),
  R("rq-11", "rudra", "125 mm sabot round", "make2", "ammunition", "125 mm", "doppler radar", "AM-3", 1.5, true, false, "2026-09-03"),
  R("rq-12", "sudarshan", "Anti-drone net round, 40 mm", "idex", "ammunition", "40 mm", "doppler radar", "AM-1", 1, true, true, "2026-09-15"),
  R("rq-13", "netra", "Loitering munition seeker drop", "idex", "fuze", "seeker", "high-speed camera", "FZ-4", 1, false, true, "2026-10-05"),
  R("rq-14", "rudra", "81 mm mortar bomb lot", "own", "ammunition", "81 mm", "doppler radar", "AM-2", 1, false, false, "2026-10-12"),
  R("rq-15", "shaurya", "12.7 mm ammunition lot", "make2", "small arms", "12.7 mm", "chronograph", "SA-2", 1, false, false, "2026-09-30"),
  R("rq-16", "kavach", "Rifle grenade", "idex", "ammunition", "40 mm", "doppler radar", "AM-4", 1, false, false, "2026-10-14"),
  R("rq-17", "bharatforge", "30 mm cannon round lot", "own", "ammunition", "30 mm", "doppler radar", "AM-2", 1, false, false, "2026-10-18"),
  R("rq-18", "garuda", "84 mm illuminating round", "mod_dev", "ammunition", "84 mm", "doppler radar", "AM-2", 1, false, false, "2026-10-20"),
  R("rq-19", "trishul", "Mortar fuze, 81 mm", "make1", "fuze", "81 mm", "high-speed camera", "FZ-3", 1, false, false, "2026-10-22")
];

export const LM7_REQUEST: Omit<SlotRequest, "id" | "submittedAt"> = {
  windowId: "w-cpe-q1-27", firmId: "skyveer", productId: "p-lm7", item: "LM-7 warhead safety unit", scheme: "idex",
  testFamily: "fuze", calibre: "155 mm", instrumentation: "high-speed camera", safetyTemplate: "FZ-2", hours: 1, milestone: true, firstTime: true
};

export const seedWindows: ReservedWindow[] = [
  { id: "w-cpe-q1-27", facilityId: "cpe-itarsi", quarter: "Q1 2027", days: ["2027-01-12", "2027-01-13", "2027-01-14"],
    dayHours: 8, setupHours: 2, closesOn: "2026-11-30", status: "open", bumps: [] }
];

// Demand vs reserved capacity at the other proof ranges (illustrative, for the Ministry view).
export const otherRangeDemand = [
  { facilityId: "lpr-khamaria", requests: 14, capacity: 9 },
  { facilityId: "pxe-chandipur", requests: 9, capacity: 7 },
  { facilityId: "pokhran-ffr", requests: 6, capacity: 6 }
];

export const seedApplications: Application[] = [
  { id: "APP-2026-0412", productId: "p-swarm", facilityId: "dtis-kanpur", tests: ["emi_emc"], status: "approved",
    docs: { sanction: true, profile: true, trial_plan: true, nda: true, agreement: true }, createdAt: "2026-10-02", updatedAt: "2026-10-06" },
  { id: "APP-2026-0431", productId: "p-thermal", facilityId: "dtis-kanpur", tests: ["emi_emc"], status: "submitted",
    docs: { sanction: true, profile: true, trial_plan: true, nda: true, agreement: true }, createdAt: "2026-10-21", updatedAt: "2026-10-21" },
  { id: "APP-2026-0438", productId: "p-airframe", facilityId: "dtis-kanpur", tests: ["uas_flight", "env_vibration"], status: "query",
    query: "Please attach the airframe's flight envelope and the ground-station frequency plan.", answer: "Attached: envelope v3 and frequency plan.",
    docs: { sanction: true, profile: true, trial_plan: true, nda: true, agreement: true }, createdAt: "2026-10-15", updatedAt: "2026-10-24" }
];

const s = seals as Record<string, { files: TrialRecord["files"]; signoffs: TrialRecord["signoffs"]; seal: NonNullable<TrialRecord["seal"]> }>;

export const seedRecords: TrialRecord[] = [
  { id: "TR-2026-1118", productId: "p-swarm", facilityId: "dtis-kanpur", test: "emi_emc", date: "2026-10-20",
    files: s["TR-2026-1118"].files, signoffs: s["TR-2026-1118"].signoffs,
    requiredSignoffs: ["Range officer, DTIS Kanpur", "Observer, user Service", "Firm test lead"], seal: s["TR-2026-1118"].seal, sharedWith: [] },
  { id: "TR-2026-1087", productId: "p-radio", facilityId: "dtis-chennai", test: "env_thermal", date: "2026-10-12",
    files: s["TR-2026-1087"].files, signoffs: s["TR-2026-1087"].signoffs,
    requiredSignoffs: ["Range officer, DTIS Chennai", "Firm test lead"], seal: s["TR-2026-1087"].seal, sharedWith: ["DGAQA"] }
];

export const seedInspections: Inspection[] = [
  { id: "INS-0091", recordId: "TR-2026-1087", productId: "p-radio", body: "DGAQA", status: "queued", queuedAt: "2026-10-19", integrity: "unchecked" }
];

export const seedNeeds: BuyerNeed[] = [
  { id: "N-01", title: "ISR payload for small UAS", org: "Army user directorate", source: "iDEX challenge", tags: ["uas", "isr", "payload"], postedAt: "2026-09-10" },
  { id: "N-02", title: "Swarm communication module", org: "Army user directorate", source: "Open RFI", tags: ["swarm", "comms", "mesh"], postedAt: "2026-10-01" },
  { id: "N-03", title: "Counter-drone kinetic round", org: "Navy (Directorate of Naval Armament)", source: "iDEX challenge", tags: ["counter-drone", "ammunition"], postedAt: "2026-08-22" }
];

export const seedAudit: AuditEvent[] = [
  { id: "a1", at: "2026-10-20T17:05:00+05:30", actor: "Platform", role: "admin", action: "Sealed trial record", target: "TR-2026-1118" },
  { id: "a2", at: "2026-10-19T11:00:00+05:30", actor: "R. Prakash", role: "operator", action: "Shared evidence with DGAQA", target: "TR-2026-1087" },
  { id: "a3", at: "2026-10-06T10:12:00+05:30", actor: "Vikram Singh", role: "operator", action: "Approved an application", target: "APP-2026-0412" }
];
