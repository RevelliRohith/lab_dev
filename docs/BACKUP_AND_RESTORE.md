# Backup & Disaster Recovery Runbook

## 1. Scope of Backup
A reliable laboratory disaster recovery strategy requires simultaneous protection of two distinct data assets:
1. **PostgreSQL Database Records**: Patient demographics, orders, specimen logs, clinical results, revision histories, invoices, payments, refunds, expenses, and immutable audit logs.
2. **Private PDF Storage Bucket (`lab-reports`)**: Immutable server-rendered A4 clinical PDF reports corresponding to authorized releases.

---

## 2. Automated Point-in-Time Database Backups

### Automated Scheduled Daily Dumps
Run automated nightly dumps using `pg_dump` with custom compressed archive format (`-Fc`):

```bash
# Export full database schema and data
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE -Fc -f "/backups/db/lab_db_$(date +%Y%m%d_%H%M%S).dump"
```

### Encryption & Storage
- Backups must be encrypted at rest using AES-256 (e.g., GPG or AWS KMS).
- Off-site replication to a geographically separated cloud region (e.g. AWS S3 Glacier or Cloudflare R2).

---

## 3. Storage Bucket PDF Synchronization

PDF reports in the private `lab-reports` bucket must be synchronized incrementally:

```bash
# Using AWS CLI / S3-compatible utility
aws s3 sync s3://lab-reports/ /backups/reports/$(date +%Y%m%d)/ --storage-class STANDARD_IA
```

---

## 4. Disaster Recovery & Restoration Procedure

### Step 1: Database Restoration
In the event of database failure or corrupted state:

```bash
# 1. Stop active Next.js application traffic (maintenance page)
# 2. Re-create target database
dropdb -h $PGHOST -U $PGUSER $PGDATABASE
createdb -h $PGHOST -U $PGUSER $PGDATABASE

# 3. Restore from verified dump
pg_restore -h $PGHOST -U $PGUSER -d $PGDATABASE -v "/backups/db/lab_db_TARGET.dump"
```

### Step 2: Storage Bucket Verification
Verify that all file paths referenced in `report_versions.pdf_storage_path` exist in the restored storage bucket:

```sql
SELECT report_number, pdf_storage_path, released_at
FROM report_versions
WHERE status = 'released';
```

Sync any missing PDF objects back to the storage bucket:

```bash
aws s3 sync /backups/reports/TARGET/ s3://lab-reports/
```

### Step 3: Integrity Check
Execute acceptance test suite to confirm RLS policies, role boundaries, and sequence continuity:

```bash
npm test
```

---

## 5. Retention Policy & Regional Compliance
- **Data Retention**: Diagnostic records and immutable report versions must be retained for a minimum of **7 years** (or the laboratory's local legal/regulatory standard).
- **Hosting Region**: Select a data center matching local patient privacy jurisdictions.
- **Audit Logs**: Database audit records are append-only; application users are prevented from executing `UPDATE` or `DELETE` on the `audit_events` table.
