# Small-Scale Diagnostic Laboratory Management System (LIS)

A secure, production-oriented Laboratory Information System engineered for small-scale diagnostic laboratories. Built using **Next.js (App Router)**, **TypeScript (Strict Mode)**, **Tailwind CSS**, and **PostgreSQL (Supabase)** with Row Level Security (RLS).

---

## 1. System Scope & Core Invariants

- **Single Database & Architecture**: No microservices or external backend brokers. One unified application running on Node.js.
- **Strict Role Boundaries (3 Roles)**:
  1. `Admin`: Laboratory settings, staff accounts, catalogue & limits, billing, expenses, refunds, and financial summaries.
  2. `Lab Staff`: Patient registration, order creation, specimen intake, draft result entry, quality attestation, and invoicing.
  3. `Authorized Reviewer`: Clinical review queue, returning submissions for correction, independent authorization within verified specialty scope, report release, and amendments.
- **Independent Clinical Authorization**: A reviewer is cryptographically and transactionally blocked from authorizing any report containing results they entered or clinically edited.
- **Specimen Lifecycle**: `Awaiting Collection` → `Collected` → `Received` → `Completed`. Rejection requires a mandatory reason and automatically triggers a linked replacement recollection.
- **Quality Attestation & Critical Results**: Every submission requires documented QC attestation. Results flagged `CRITICAL` require confirmed read-back communication before authorization.
- **Server-Generated A4 PDFs**: Immutable JSON snapshots generate multi-page A4 PDFs with dynamic watermarks (`DRAFT — NOT AUTHORIZED` on drafts; `SUPERSEDED` on amended reports).
- **Security & Financial Integrity**: Strict RLS, append-only audit trail, and RFC 4180 CSV formula-injection protection (`=`, `+`, `-`, `@` escaping).

---

## 2. Exactly Six Modules

1. **Dashboard** (`/dashboard`): Operational intake queues (today's orders, specimens awaiting collection, results awaiting entry, reports awaiting review). Financial summaries strictly restricted to Admin.
2. **Patients & Billing** (`/patients`): Search-first registration with duplicate warnings, order creation, test selector, invoice generation, discount permissions, manual payment recording, and balance tracking.
3. **Tests & Results** (`/tests` and `/tests/[orderId]`): Specimen intake worklist (Collect & Receive), rejection & recollection, typed parameter entry, real-time flags (Normal, Abnormal, Critical), and review submission.
4. **Reports** (`/reports`): Pathologist review queue, return for correction with mandatory reason, transactional authorization, PDF generation & release, and versioned amendments.
5. **Finance** (`/finance`): Billing source of truth, collections, outstanding receivables, controlled refunds, simple laboratory expense tracker, and formula-safe CSV export.
6. **Settings & Staff** (`/settings`): Laboratory accreditation configuration (CLIA), report branding, timezone, currency, staff role management, reviewer credentials/scopes, and immutable security audit logs.

---

## 3. Quick Start & Verification

### Prerequisites
- Node.js v18+ (tested on Node v20/v24)
- npm

### Installation & Test Execution
```bash
# Install dependencies
npm install

# Run automated acceptance test suite (Vitest)
npm test

# Run Next.js production build
npm run build

# Start local server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the system. The top-bar includes a role profile switcher allowing instant testing of all three roles and their permission boundaries.

---

## 4. Documentation Directory

- [Setup & Deployment Guide](docs/SETUP_AND_DEPLOYMENT.md)
- [Backup & Disaster Recovery Procedures](docs/BACKUP_AND_RESTORE.md)
- [Staff Standard Operating Guide](docs/STAFF_OPERATING_GUIDE.md)
- [Pilot Launch Readiness Checklist & Blockers](docs/PILOT_READINESS_CHECKLIST.md)

---

## 5. SQL Database Migrations
Migrations and seed data are located in `supabase/`:
- `supabase/migrations/20261022000001_initial_schema.sql` (Tables, FKs, sequences)
- `supabase/migrations/20261022000002_rls_policies.sql` (Row Level Security policies)
- `supabase/migrations/20261022000003_transactional_functions.sql` (Clinical transactions)
- `supabase/seed.sql` (Synthetic test data)
