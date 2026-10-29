// Shared domain types. One record per product and per trial, read by every role.

export type Role =
  | "applicant"
  | "operator"
  | "range"
  | "qa"
  | "programme"
  | "buyer"
  | "ministry"
  | "admin";

export type SchemeId = "idex" | "tdf" | "make1" | "make2" | "mod_dev" | "own";

export type Owner = "DRDO" | "DGQA" | "DTIS" | "Army" | "IAF" | "Navy";
export type FacilityKind = "lab" | "proof_range" | "field_firing_range" | "test_range";

export interface TestType {
  id: string;
  name: string;
  family: string;
  standards: string[];
  hours: number; // range or chamber time for one trial, excluding set-up
}

export interface Facility {
  id: string;
  name: string;
  short: string;
  owner: Owner;
  kind: FacilityKind;
  city: string;
  state: string;
  tests: string[];
  nabl: boolean;
  verified: boolean; // details checked against an official source
  nextSlotDays: number;
  note?: string;
}

export interface Firm {
  id: string;
  name: string;
  type: "startup" | "msme" | "dpsu" | "large";
  city: string;
}

export type SchemeStatus = "none" | "pending" | "verified" | "rejected";

export interface Product {
  id: string;
  firmId: string;
  name: string;
  category: string;
  scheme: SchemeId;
  sanctionRef?: string;
  schemeStatus: SchemeStatus;
  stage: number; // 0..6, see STAGES
  tags: string[];
  testNeeds: string[];
}

export type DocKey = "sanction" | "profile" | "trial_plan" | "nda" | "agreement" | "safety";

export type ApplicationStatus = "draft" | "submitted" | "query" | "approved" | "rejected";

export interface Application {
  id: string;
  productId: string;
  facilityId: string;
  tests: string[];
  status: ApplicationStatus;
  docs: Record<string, boolean>;
  query?: string;
  answer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlotRequest {
  id: string;
  windowId: string;
  firmId: string;
  productId?: string;
  item: string;
  scheme: SchemeId;
  testFamily: string;
  calibre: string;
  instrumentation: string;
  safetyTemplate: string;
  hours: number;
  milestone: boolean;
  firstTime: boolean;
  submittedAt: string; // ISO date
}

/** Structured facts behind a scheduling reason, so the interface can render it in any language. */
export interface Why {
  shared: boolean;
  hours: number;
  setup: number;
  batchSize: number;
  letter?: string;
  bumped?: string;
}

export interface Placement {
  requestId: string;
  day: number;
  batchKey: string;
  batchLabel: string;
  priority: number;
  reason: string;
  why?: Why;
}

export interface WaitItem {
  requestId: string;
  priority: number;
  reason: string;
  why?: Why;
}

export interface Bump {
  requestId: string;
  reason: string;
  at: string;
  by: string;
}

export interface Allocation {
  placements: Placement[];
  waitlist: WaitItem[];
  withoutBatching: number;
  withBatching: number;
  computedAt: string;
  rulesVersion: string;
}

export type WindowStatus = "open" | "closed" | "proposed" | "published";

export interface ReservedWindow {
  id: string;
  facilityId: string;
  quarter: string;
  days: string[]; // ISO dates
  dayHours: number;
  setupHours: number;
  closesOn: string;
  status: WindowStatus;
  allocation?: Allocation;
  bumps: Bump[];
}

export interface EvidenceFile {
  name: string;
  kind: string;
  size: number;
  sha256: string;
}

export interface SignOff {
  role: string;
  name: string;
  at: string;
}

export interface Seal {
  digest: string;
  signature: string;
  publicKey: string;
  keyId: string;
  signedAt: string;
}

export interface TrialRecord {
  id: string;
  productId: string;
  facilityId: string;
  test: string;
  date: string;
  files: EvidenceFile[];
  signoffs: SignOff[];
  requiredSignoffs: string[];
  seal?: Seal;
  sharedWith: string[];
}

export type InspectionStatus = "queued" | "visit_planned" | "passed" | "failed";

export interface Inspection {
  id: string;
  recordId: string;
  productId: string;
  body: "DGAQA" | "DGQA" | "CEMILAC";
  status: InspectionStatus;
  queuedAt: string;
  visitOn?: string;
  verdictNote?: string;
  integrity?: "unchecked" | "verified" | "failed";
}

export interface BuyerNeed {
  id: string;
  title: string;
  org: string;
  source: string;
  tags: string[];
  postedAt: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  role: Role;
  action: string; // an English template, e.g. "Ran allocation: {n} trials fitted"
  params?: Record<string, string | number>;
  target: string;
}
