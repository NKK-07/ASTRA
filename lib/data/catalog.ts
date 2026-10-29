import type { Facility, Firm, SchemeId, TestType } from "../types";

// Reference data. Facility names marked verified:false are illustrative or unconfirmed
// and are labelled "unverified" in the interface. Demo data only, unclassified.

export const TESTS: TestType[] = [
  { id: "emi_emc", name: "EMI/EMC", family: "emc", standards: ["MIL-STD-461G"], hours: 6 },
  { id: "env_vibration", name: "Vibration", family: "environmental", standards: ["JSS 55555"], hours: 4 },
  { id: "env_thermal", name: "Thermal cycling", family: "environmental", standards: ["JSS 55555"], hours: 8 },
  { id: "uas_flight", name: "UAS flight trial", family: "flight", standards: ["Telemetry, runway"], hours: 5 },
  { id: "antenna", name: "Antenna pattern", family: "rf", standards: ["Far-field range"], hours: 4 },
  { id: "ew", name: "Electronic warfare", family: "rf", standards: ["Threat simulators"], hours: 6 },
  { id: "proof_small_arms", name: "Small arms proof", family: "proof", standards: ["Chronograph, accuracy"], hours: 1 },
  { id: "proof_ammunition", name: "Ammunition proof firing", family: "proof", standards: ["Lot acceptance"], hours: 1.5 },
  { id: "fuze_safety", name: "Fuze safety and arming", family: "proof", standards: ["High-speed camera"], hours: 1 },
  { id: "rocket_static", name: "Rocket motor static firing", family: "rocket", standards: ["Thrust stand"], hours: 1.5 },
  { id: "rocket_trajectory", name: "Rocket trajectory", family: "rocket", standards: ["Radar, telemetry"], hours: 2 },
  { id: "warhead", name: "Warhead arena trial", family: "explosive", standards: ["Witness panels"], hours: 3 },
  { id: "vehicle_emc", name: "Full-vehicle EMC", family: "emc", standards: ["MIL-STD-461G"], hours: 8 }
];

export const test = (id: string) => TESTS.find((t) => t.id === id);

export const FACILITIES: Facility[] = [
  { id: "dtis-kanpur", name: "DTIS UAS Test Facility", short: "DTIS Kanpur", owner: "DTIS", kind: "test_range", city: "Kanpur", state: "Uttar Pradesh",
    tests: ["uas_flight", "emi_emc", "env_vibration"], nabl: true, verified: false, nextSlotDays: 9,
    note: "One of the shared facilities under the Defence Testing Infrastructure Scheme. Name and operator unverified." },
  { id: "dtis-chennai", name: "DTIS EW and Environmental Test Facility", short: "DTIS Chennai", owner: "DTIS", kind: "lab", city: "Chennai", state: "Tamil Nadu",
    tests: ["emi_emc", "ew", "env_thermal", "env_vibration"], nabl: true, verified: false, nextSlotDays: 12,
    note: "DTIS facility in Tamil Nadu. Name and operator unverified." },
  { id: "lrde-emi", name: "LRDE EMI/EMC Laboratory", short: "LRDE Bengaluru", owner: "DRDO", kind: "lab", city: "Bengaluru", state: "Karnataka",
    tests: ["emi_emc", "antenna"], nabl: false, verified: false, nextSlotDays: 14 },
  { id: "atr-challakere", name: "Aeronautical Test Range", short: "ATR Challakere", owner: "DRDO", kind: "test_range", city: "Challakere", state: "Karnataka",
    tests: ["uas_flight"], nabl: false, verified: true, nextSlotDays: 21 },
  { id: "vrde-ahmednagar", name: "VRDE Vehicle EMC Chamber", short: "VRDE Ahmednagar", owner: "DRDO", kind: "lab", city: "Ahmednagar", state: "Maharashtra",
    tests: ["vehicle_emc", "emi_emc"], nabl: false, verified: false, nextSlotDays: 30 },
  { id: "itr-chandipur", name: "Integrated Test Range", short: "ITR Chandipur", owner: "DRDO", kind: "test_range", city: "Chandipur", state: "Odisha",
    tests: ["rocket_trajectory"], nabl: false, verified: true, nextSlotDays: 45 },
  { id: "pxe-chandipur", name: "Proof and Experimental Establishment", short: "PXE Chandipur", owner: "DRDO", kind: "proof_range", city: "Chandipur", state: "Odisha",
    tests: ["proof_ammunition", "fuze_safety", "rocket_static"], nabl: false, verified: true, nextSlotDays: 38 },
  { id: "cpe-itarsi", name: "Central Proof Establishment", short: "CPE Itarsi", owner: "DGQA", kind: "proof_range", city: "Itarsi", state: "Madhya Pradesh",
    tests: ["proof_small_arms", "proof_ammunition", "fuze_safety", "rocket_static"], nabl: false, verified: true, nextSlotDays: 76 },
  { id: "lpr-khamaria", name: "Long Proof Range", short: "LPR Khamaria", owner: "DGQA", kind: "proof_range", city: "Jabalpur", state: "Madhya Pradesh",
    tests: ["proof_ammunition", "proof_small_arms"], nabl: false, verified: false, nextSlotDays: 52 },
  { id: "tbrl-ramgarh", name: "TBRL Ramgarh Range", short: "TBRL Ramgarh", owner: "DRDO", kind: "test_range", city: "Chandigarh", state: "Punjab / Haryana",
    tests: ["warhead"], nabl: false, verified: false, nextSlotDays: 40 },
  { id: "pokhran-ffr", name: "Pokhran Field Firing Range", short: "Pokhran FFR", owner: "Army", kind: "field_firing_range", city: "Pokhran", state: "Rajasthan",
    tests: ["proof_ammunition", "rocket_trajectory", "warhead"], nabl: false, verified: true, nextSlotDays: 60 }
];

export const facility = (id: string) => FACILITIES.find((f) => f.id === id);

export const SCHEMES: Record<SchemeId, { name: string; funded: boolean }> = {
  idex: { name: "iDEX", funded: true },
  tdf: { name: "TDF", funded: true },
  make1: { name: "Make-I", funded: true },
  make2: { name: "Make-II", funded: true },
  mod_dev: { name: "Other MoD developmental project", funded: true },
  own: { name: "Own initiative", funded: false }
};

export const STAGES = [
  "Prototype ready",
  "Developmental testing",
  "QA inspection",
  "Certification",
  "User trials",
  "Procurement route",
  "Order placed"
];

export const FIRMS: Firm[] = [
  { id: "skyveer", name: "SkyVeer Drones", type: "startup", city: "Bengaluru" },
  { id: "vajra", name: "Vajra Comms", type: "msme", city: "Bengaluru" },
  { id: "thermosight", name: "ThermoSight Labs", type: "startup", city: "Chennai" },
  { id: "aerofab", name: "AeroFab Kanpur", type: "startup", city: "Kanpur" },
  { id: "rudra", name: "Rudra Munitions", type: "msme", city: "Nagpur" },
  { id: "kavach", name: "Kavach Arms", type: "startup", city: "Pune" },
  { id: "agnipath", name: "Agnipath Propulsion", type: "startup", city: "Hyderabad" },
  { id: "trishul", name: "Trishul Fuzes", type: "msme", city: "Pune" },
  { id: "bharatforge", name: "Deccan Precision", type: "large", city: "Pune" },
  { id: "netra", name: "Netra Seekers", type: "startup", city: "Bengaluru" },
  { id: "shaurya", name: "Shaurya Defence Works", type: "msme", city: "Kanpur" },
  { id: "garuda", name: "Garuda Ordnance", type: "dpsu", city: "Jabalpur" },
  { id: "sudarshan", name: "Sudarshan Systems", type: "startup", city: "Ahmedabad" }
];

export const firm = (id: string) => FIRMS.find((f) => f.id === id);

export const PEOPLE: Record<string, { name: string; org: string; initials: string }> = {
  applicant: { name: "Ananya Rao", org: "SkyVeer Drones · iDEX startup", initials: "AR" },
  operator: { name: "Vikram Singh", org: "DTIS UAS Test Facility, Kanpur", initials: "VS" },
  range: { name: "Col. R. Menon", org: "Central Proof Establishment, Itarsi", initials: "RM" },
  qa: { name: "S. Iyer", org: "DGAQA regional office, Bengaluru", initials: "SI" },
  programme: { name: "Meera Nair", org: "Defence Innovation Organisation (iDEX)", initials: "MN" },
  buyer: { name: "Lt Col A. Sharma", org: "Army user directorate", initials: "AS" },
  ministry: { name: "A. Verma", org: "Department of Defence Production", initials: "AV" },
  admin: { name: "Platform operations", org: "AstraTest Bharat", initials: "PO" }
};

export const APPLICANT_FIRM = "skyveer";
export const OPERATOR_FACILITY = "dtis-kanpur";
export const RANGE_FACILITY = "cpe-itarsi";
