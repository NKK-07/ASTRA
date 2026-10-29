import type { Role } from "./types";

export type NavItem = { n?: string; label: string; href?: string; group?: boolean; count?: (s: any) => number };

export const HOME: Record<Role, string> = {
  applicant: "/home", operator: "/operator", range: "/range", qa: "/qa",
  programme: "/programme", buyer: "/buyer", ministry: "/ministry", admin: "/admin"
};

export const NAV: Record<Role, NavItem[]> = {
  applicant: [
    { label: "Overview", href: "/home" },
    { label: "Journey", group: true },
    { n: "01", label: "Find a facility", href: "/find" },
    { n: "02", label: "Check eligibility", href: "/check" },
    { n: "03", label: "Apply", href: "/apply" },
    { n: "04", label: "Book a slot", href: "/book" },
    { n: "05", label: "Evidence", href: "/evidence" },
    { n: "06", label: "Prototype to order", href: "/order" },
    { label: "Tools", group: true },
    { label: "Verify a record", href: "/verify" }
  ],
  operator: [
    { label: "Overview", href: "/operator" },
    { label: "Facility", group: true },
    { label: "Applications", href: "/operator/applications", count: (s) => s.applications.filter((a: any) => a.facilityId === "dtis-kanpur" && a.status === "submitted").length },
    { label: "Trial records", href: "/operator/records" },
    { label: "Verify a record", href: "/verify" }
  ],
  range: [
    { label: "Overview", href: "/range" },
    { label: "Range", group: true },
    { label: "Reserved window", href: "/book" },
    { label: "Audit log", href: "/audit" }
  ],
  qa: [
    { label: "Overview", href: "/qa" },
    { label: "Work", group: true },
    { label: "Inspection queue", href: "/qa", count: (s) => s.inspections.filter((i: any) => i.status === "queued" || i.status === "visit_planned").length },
    { label: "Verify a record", href: "/verify" }
  ],
  programme: [
    { label: "Overview", href: "/programme" },
    { label: "Projects", group: true },
    { label: "Audit log", href: "/audit" }
  ],
  buyer: [
    { label: "Overview", href: "/buyer" },
    { label: "Needs and matches", group: true },
    { label: "Verify a record", href: "/verify" }
  ],
  ministry: [
    { label: "Insights", href: "/ministry" },
    { label: "Oversight", group: true },
    { label: "Reserved window", href: "/book" },
    { label: "Audit log", href: "/audit" }
  ],
  admin: [
    { label: "Overview", href: "/admin" },
    { label: "Platform", group: true },
    { label: "Audit log", href: "/audit" },
    { label: "Verify a record", href: "/verify" }
  ]
};

export const ROLE_LABEL: Record<Role, string> = {
  applicant: "Industry applicant", operator: "Facility operator", range: "Range authority", qa: "QA and certification",
  programme: "Programme body", buyer: "Buyer", ministry: "Ministry oversight", admin: "Platform admin"
};

export const ROLES: Role[] = ["applicant", "operator", "range", "qa", "programme", "buyer", "ministry", "admin"];
