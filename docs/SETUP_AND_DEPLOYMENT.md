# Setup & Deployment Guide: Diagnostic Laboratory Management System

## 1. Architecture Overview
The Diagnostic Laboratory Management System (LIS) is engineered as a single-database, single-tenant, full-stack Next.js (App Router) application.
- **Frontend / Fullstack**: Next.js 14+ (Node.js runtime), React, Tailwind CSS, TypeScript (strict mode).
- **Database**: PostgreSQL 15+ (Supabase), Row Level Security (RLS), stored procedures.
- **Storage**: Supabase Private Storage (`lab-reports` bucket) with authenticated short-lived signed URLs.
- **Reporting Engine**: Server-rendered multi-page A4 PDF generated directly from immutable database JSON snapshots using `pdf-lib`.

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env.local` for local development or set these variables in your deployment environment (e.g. Vercel, Railway, Docker, AWS):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Laboratory Tenant Configuration
DEFAULT_LAB_ID=11111111-1111-1111-1111-111111111111
NEXT_PUBLIC_APP_TIMEZONE=America/New_York
NEXT_PUBLIC_APP_CURRENCY=USD
STORAGE_BUCKET_REPORTS=lab-reports

# Next.js Application URL
NEXT_PUBLIC_APP_URL=https://lab.yourdomain.com
```

> **Security Rule**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser client bundles. Routine requests retain the signed-in user's JWT credentials.

---

## 3. Database Migration & Provisioning

Execute the SQL migrations in order against your Supabase or PostgreSQL database:

1. `supabase/migrations/20261022000001_initial_schema.sql` (Creates core tables, foreign keys, sequential sequence generators, and indexes).
2. `supabase/migrations/20261022000002_rls_policies.sql` (Enables RLS on all tables, defines role checks, and makes audit history strictly append-only).
3. `supabase/migrations/20261022000003_transactional_functions.sql` (Installs transactional safety functions: `collect_and_receive_specimen`, `reject_specimen_and_recollect`, `submit_results_for_review`, `authorize_clinical_report`, `release_report_version`, `record_refund_transaction`).
4. `supabase/seed.sql` (Populates laboratory settings, pathologist credentials, test catalogue with reference ranges, and test patients).

### Private Storage Setup
In the Supabase Dashboard:
1. Create a storage bucket named `lab-reports`.
2. Set bucket visibility to **Private** (Public access disabled).
3. Add an RLS policy granting `SELECT` and `INSERT` access to authenticated staff members belonging to the lab tenant.

---

## 4. Running Locally

```bash
# Install dependencies
npm install

# Run unit and integration acceptance tests
npm test

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the application.

---

## 5. Production Build & Deployment

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

Deployable to Vercel, Node.js server, or containerized Docker host without microservices or external backend brokers.
