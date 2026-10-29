# AstraTest Bharat

One front door to India's defence test ranges, from prototype to procurement.
Built for the Seva Innovation Challenge 2026 (shared defence testing, certification and prototype-to-procurement access), on the Raksha Mantri's revised SOP of 7 October 2026.

> Prototype with **unclassified demo data only**. Facility names marked "unverified" are illustrative until checked against the SOP annexures.

## What works

| Promise (pitch deck) | In the app |
| --- | --- |
| **Find** any DRDO, DGQA, Service or DTIS facility by test and standard | `/find`: search, test chips, owner and NABL filters, product test matrix, ranked results with reasons |
| **Check** the SOP waiver and slot rules before applying | `/check`: rules engine (`lib/core/eligibility.ts`) with rule references, charges estimate, document list |
| **Apply** once, auto-filled | `/apply`: application built from the firm profile, submitted to the facility; printable pack at `/apply/[id]` |
| **Book** the 3-day reserved slot fairly | `/book`: published priority rule, deterministic batching scheduler (`lib/core/scheduler.ts`), with vs without batching, waitlist with reasons, bump with a logged reason, approve and publish |
| **Prove** results QA can trust | `/record/[id]`: files hashed with SHA-256 in the browser, sign-offs, server-side Ed25519 seal (`/api/v1/seal`), verification (`/api/v1/verify`), tamper demo, file check |
| **Sell**: path to an order | `/order`: seven-stage tracker that advances on real events (share → QA → pass → buyer invite), buyer-need matching |
| A console for **every party** | Operator, range authority, QA, programme body, buyer, Ministry, admin, each with its own dashboard on the same record |
| EN / हिन्दी | Language switch in the top bar (interface text; record data stays as entered) |

### Demo story (about 3 minutes)

1. Sign in as **Industry applicant** → Find → Check eligibility → Start application → Submit.
2. **Book a slot** → Request this slot (LM-7). Open **Evidence** → TR-2026-1118 → Verify integrity → Try a tampered copy → Share with QA.
3. Switch to **Range authority** (top-right) → Reserved window → Close window → **Run allocation** (watch trials drop into days; 6 without batching vs 11 with) → Approve and publish.
4. **Facility operator** → Applications → Approve. Trial records → Open record → drop files → Sign ×3 → Seal record.
5. **QA and certification** → Verify → plan visit → Pass. **Programme body** → Confirm sanction. **Buyer** → Invite to user trials.
6. **Ministry oversight** → live demand vs capacity, requests by scheme, audit trail. **Admin** → Reset demo data.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # scheduler, eligibility and sealing tests
```

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel: **Add New → Project → Import** the repository. Framework: Next.js (auto-detected). No build settings to change.
3. Optional but recommended: **Settings → Environment Variables → `SEAL_SECRET`** = a long random string. Without it, a public demo key seals records (the seeded records are sealed with that demo key and will show "older platform key" once you set your own).
4. Deploy. Check `https://<your-app>.vercel.app/api/v1/health`.

Or from a terminal: `npx vercel` then `npx vercel --prod`.

## How it is built

- Next.js 14 (App Router) + TypeScript, no UI framework; design tokens from the AstraTest Bharat "Console" design system in `app/globals.css`.
- `lib/core/`: pure, tested logic: eligibility rules, scheduler, sealing helpers, buyer matching.
- `app/api/v1/`: `seal`, `verify`, `key`, `allocate`, `eligibility`, `health`. Seal and verify recompute the canonical record digest on the server.
- `lib/store.ts`: demo persistence with Zustand in the browser's localStorage, so every role sees one shared record as you switch roles. **Production step:** replace this module with API calls to PostgreSQL (Drizzle) as planned in doc 02; the core logic and API contracts stay the same.
- `scripts/seal-seed.mjs`: re-seals the seeded records if you change their demo files.

## Security notes

Unclassified data only. Files are hashed in the browser and never uploaded. The sealing key is derived from `SEAL_SECRET` on the server. Production hosting: NIC Cloud or a MeitY-empanelled Indian cloud, following CERT-In rules (6-hour incident reporting, 180-day logs). Security headers are set in `next.config.mjs`.
