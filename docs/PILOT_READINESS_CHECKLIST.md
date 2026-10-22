# Pilot Launch Readiness & Clinical Verification Checklist

## 1. Acceptance Criteria Verification Matrix

| Verification Domain | Test Scenario | Automated / Manual Verification | Status |
| :--- | :--- | :--- | :---: |
| **Role Security** | Anonymous / unauthorized access blocked by RLS policies | `tests/acceptance.test.ts` (suite 1) | ✅ PASS |
| **Role Security** | Admin alone cannot authorize reports without active Reviewer role | `tests/acceptance.test.ts` (suite 1) | ✅ PASS |
| **Role Security** | Immediate access revocation for disabled staff | `tests/acceptance.test.ts` (suite 1) | ✅ PASS |
| **Clinical Safety** | **Independent clinical authorization**: Reviewer cannot approve results they entered | `tests/acceptance.test.ts` (suite 1) | ✅ PASS |
| **Clinical Safety** | Incomplete submissions blocked without documented disposition | `tests/acceptance.test.ts` (suite 3) | ✅ PASS |
| **Clinical Safety** | Critical results blocked from release without confirmed read-back | `tests/acceptance.test.ts` (suite 3) | ✅ PASS |
| **Specimens** | Mandatory rejection reason; automatic replacement recollection creation | `tests/acceptance.test.ts` (suite 2) | ✅ PASS |
| **Specimens** | Invalid specimen state transitions rejected | `tests/acceptance.test.ts` (suite 2) | ✅ PASS |
| **Reporting** | Immutable JSON snapshot created upon authorization | `src/lib/pdf/report-generator.ts` | ✅ PASS |
| **Reporting** | Draft watermark ("DRAFT — NOT AUTHORIZED") on pre-authorized PDFs | `tests/acceptance.test.ts` (suite 6) | ✅ PASS |
| **Reporting** | Superseeded watermark ("SUPERSEDED") on amended PDF versions | `src/lib/pdf/report-generator.ts` | ✅ PASS |
| **Financial Integrity**| Balances recalculate accurately from invoices, payments, refunds | `tests/acceptance.test.ts` (suite 4) | ✅ PASS |
| **Financial Integrity**| Refunds restricted to Admin and cannot exceed net paid balance | `tests/acceptance.test.ts` (suite 4) | ✅ PASS |
| **Security & Export** | Formula-injection protection (`=`, `+`, `-`, `@`) on CSV exports | `tests/acceptance.test.ts` (suite 5) | ✅ PASS |
| **Audit Trails** | Append-only audit events logged; user modifications blocked | `supabase/migrations/20261022000002_rls_policies.sql` | ✅ PASS |

---

## 2. Explicit Launch Blockers (Pre-Production Requisites)

Before deploying this software for live human patient diagnostics, the laboratory must satisfy these four mandatory clinical prerequisites:

1. **Clinical Director Formal Approval**:
   - The laboratory Medical Director (Pathologist) must review and approve all reference ranges, critical threshold limits, and unit configurations in the test catalogue.
   - Never invent or deploy default clinical reference limits without written qualified approval.
2. **Reviewer Scope Verification**:
   - Each reviewing pathologist must have verified medical license numbers, board certifications, authorized specialty scopes (e.g., Hematology, Clinical Chemistry, Microbiology), and active validity dates registered.
3. **Critical Value Escalation Policy**:
   - The laboratory must configure emergency contact protocols and approved triage channels for read-back verification.
4. **Physical Hosting & Retention Certification**:
   - Ensure the database server region complies with regional patient health information privacy requirements.
   - Confirm automated nightly backups and PDF storage synchronization run with encryption at rest.

> [!WARNING]
> This system must **not** be represented as ready for live clinical use until all four launch blockers above have been formally signed off by the Laboratory Director.
