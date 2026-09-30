# Data Migration Roadmap - WEAVER MSSQL

**Date**: March 31, 2026  
**Status**: Schema created ✅ | Ready for data migration ⏳

---

## 📋 Step 1: Verify Schema Creation (5 minutes)

**Run verification script in SSMS**:

```sql
-- File: 002_WEAVER_verification.sql
-- Location: backend\src\migrations\mssql\002_WEAVER_verification.sql
-- Expected Output: ✓ ALL CHECKS PASSED
```

**Script checks**:
- ✅ 11 tables created
- ✅ 25+ indexes created
- ✅ 6 stored procedures created
- ✅ 5-6 triggers created
- ✅ Foreign key relationships established

---

## 📊 Step 2: Migrate Reference Data (15-30 minutes)

### What is Reference Data?

Reference data includes the foundational lookup tables:
- **procedures** (~10K records) - CPT codes and descriptions
- **providers** (~2K records) - Hospitals, clinics, ASCs
- **payers** (~200 records) - Insurance companies

These must exist before importing rates, as rates tables reference them via foreign keys.

### Option A: Manual Export/Import

**Export from Supabase** (use pgAdmin or psql):

```bash
# Export procedures
SELECT id, cpt_code, description, category, avg_market_price, low_price, high_price, data_points 
FROM procedures 
ORDER BY cpt_code;

# Export providers
SELECT id, name, npi, provider_type, address, city, zip_code, state, latitude, longitude, phone, website, is_active 
FROM providers 
ORDER BY name;

# Export payers
SELECT id, name, type, is_active 
FROM payers 
ORDER BY name;
```

**Save as**: `procedures.csv`, `providers.csv`, `payers.csv`

**Import to MSSQL** (SQL Server):

```sql
-- BULK INSERT into MSSQL
USE [healthcare_pricing];
GO

-- Import procedures
BULK INSERT dbo.procedures
FROM 'C:\path\to\procedures.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n'
);

-- Import providers
BULK INSERT dbo.providers
FROM 'C:\path\to\providers.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n'
);

-- Import payers
BULK INSERT dbo.payers
FROM 'C:\path\to\payers.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n'
);

-- Verify counts
SELECT 'procedures' AS TableName, COUNT(*) AS RowCount FROM dbo.procedures
UNION ALL
SELECT 'providers', COUNT(*) FROM dbo.providers
UNION ALL
SELECT 'payers', COUNT(*) FROM dbo.payers;
```

### Option B: Application-Based Export (Recommended)

Create Node.js script to export and import:

```bash
npm run export-reference-data  # Exports from Supabase
npm run migrate-reference-data # Imports to MSSQL
```

---

## 💾 Step 3: Migrate Rates (1-4 hours)

### What are Rates?

**Definition**: ~1M+ pricing records linking procedures, providers, and payers with cash/insurance prices.

**Strategy**: Batch inserts in chunks of 5,000 records to avoid timeouts.

### Migration Process

**Phase 1: Estimate size**

```sql
-- In Supabase
SELECT COUNT(*) AS estimated_rate_records FROM rates;
```

**Phase 2: Create export script**

```javascript
// backend/src/scripts/export-rates-to-mssql.ts
// Batches 5,000 records at a time
// Creates INSERT statements or CSV files
```

**Phase 3: Execute migration**

```bash
cd c:\Users\icefr\MHIProject\backend
npm run migrate:rates
```

**Typical output**:
```
Starting rates migration...
Batch 1-5000: Inserted 5000 records (2.3s)
Batch 5001-10000: Inserted 5000 records (2.1s)
...
[60+ batches]
...
Migration complete: 1,250,000 records imported in 4m 32s
```

---

## 🔄 Step 4: Update Backend Configuration (2 minutes)

### Update Connection String

Edit `backend/.env.local`:

```bash
# BEFORE (Current)
MSSQL_SERVER=localhost
MSSQL_DATABASE=healthcare_pricing
MSSQL_USER=HP
MSSQL_PASSWORD=Test@1234
MSSQL_ENABLED=false              # ← Still disabled
DB_FAILOVER_ENABLED=false        # ← Not active yet

# AFTER (Activating)
MSSQL_SERVER=WEAVER              # ← Changed
MSSQL_DATABASE=healthcare_pricing
MSSQL_USER=HP
MSSQL_PASSWORD=Test@1234
MSSQL_ENABLED=true               # ← Enable MSSQL
DB_FAILOVER_ENABLED=false        # ← Keep disabled for testing
```

### Restart Backend Server

```powershell
# Stop current server
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Restart
cd c:\Users\icefr\MHIProject\backend
npm run dev
```

---

## ✅ Step 5: Verify Connection (5 minutes)

### Test Health Endpoint

```powershell
# Check if MSSQL is healthy
Invoke-WebRequest http://localhost:3001/api/v1/admin/database-health -UseBasicParsing | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected response**:
```json
{
  "success": true,
  "data": {
    "supabase": "healthy",
    "mssql": "healthy",       ← Should now show healthy!
    "activeDatabase": "supabase",
    "circuitBreakerState": "CLOSED",
    "totalQueries": 0,
    "failoverEvents": 0
  }
}
```

### Test Search Endpoint

```powershell
# Query rates - should work with both databases
curl "http://localhost:3001/api/v1/search?procedure_name=knee&limit=5"
```

---

## 🧪 Step 6: Test Failover Behavior (15-20 minutes)

### Enable Automatic Failover

Edit `backend/.env.local`:

```bash
DB_FAILOVER_ENABLED=true  # ← Change from false to true
```

Restart backend.

### Simulate Failover

**Option A: Graceful Failover Test**

1. Keep backend running
2. Stop/pause Supabase connection (disconnect network or block port)
3. Execute search query
4. Observe: System switches to MSSQL automatically
5. Resume Supabase
6. Observe: System switches back after recovery timeout

**Option B: Check Logs**

```bash
# Watch backend logs for failover events
npm run dev 2>&1 | grep -i "failover\|circuit\|database"
```

Expected log output:
```
[INFO] Circuit breaker state changed to OPEN
[WARN] Failover triggered: Switching to MSSQL
[INFO] Query succeeded on fallback database
[INFO] Supabase recovered, switching back
[INFO] Circuit breaker state changed to CLOSED
```

---

## 📈 Complete Migration Timeline

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | Verify schema | 5 min | ✅ Ready |
| 2 | Export reference data | 5 min | ⏳ Next |
| 3 | Import reference data | 10 min | ⏳ After step 2 |
| 4 | Export rates (1M+ records) | 30 min | ⏳ After step 3 |
| 5 | Import rates | 1-4 hours | ⏳ After step 4 |
| 6 | Update backend config | 2 min | ⏳ After step 5 |
| 7 | Restart & verify | 5 min | ⏳ After step 6 |
| 8 | Test failover | 15 min | ⏳ After step 7 |
| **TOTAL** | | **2-5 hours** | |

---

## 🛠️ Migration Scripts Needed

### To Create (Next):

1. **003_reference_data_migration.sql**
   - INSERT statements for procedures, providers, payers
   - Can be auto-generated from CSV exports

2. **004_rates_data_migration.sql**
   - BULK INSERT or batched inserts for 1M+ rates
   - With progress tracking
   - Batches of 5,000 records

3. **TypeScript Export Scripts** (Optional but recommended)
   - `export-reference-data.ts` - Exports from Supabase to CSV
   - `import-reference-data.ts` - Imports CSV to MSSQL
   - `export-rates.ts` - Exports rates from Supabase in batches
   - `import-rates.ts` - Imports rates to MSSQL in batches

### To Run (Immediately):

1. **002_WEAVER_verification.sql** - Validate schema ← RUN NOW
2. **Manual export from Supabase** - Get reference data
3. **BULK INSERT into MSSQL** - Load reference data
4. **Prepare rates export** - From Supabase
5. **Execute rates import** - To MSSQL

---

## ⚡ Quick Start Commands

```bash
# 1. Verify schema (in SSMS)
# File: 002_WEAVER_verification.sql
# Expected: ✓ ALL CHECKS PASSED

# 2. Export reference data from Supabase
# Use pgAdmin or custom script

# 3. Import reference data to MSSQL
# Use SQL Server Management Studio bulk insert

# 4. Test connection
curl http://localhost:3001/api/v1/admin/database-health

# 5. Enable failover (when ready)
# Edit .env.local: DB_FAILOVER_ENABLED=true
# Restart backend: npm run dev
```

---

## 📋 Pre-Migration Checklist

- [ ] Schema verified (002_WEAVER_verification.sql runs successfully)
- [ ] Reference data exported from Supabase (procedures, providers, payers)
- [ ] Reference data imported to MSSQL
- [ ] Data counts match between Supabase and MSSQL
- [ ] Rates data estimated (~1M+ records)
- [ ] Rates export prepared
- [ ] Rates import script ready
- [ ] Backend connection configured for WEAVER
- [ ] Backend restarted with new configuration
- [ ] Health endpoint shows both DB healthy
- [ ] Search queries work with both databases
- [ ] Failover behavior tested
- [ ] Logs show no errors or warnings

---

## 🎯 Success Criteria

✅ **Migration Complete When**:
- Schema created and verified (11 tables, 25+ indexes, 6 procedures)
- Reference data migrated (~12K records)
- Rates migrated (~1M+ records)
- Backend configured to use WEAVER
- Health endpoint shows MSSQL healthy
- Search queries execute on both databases
- Failover test shows automatic switching
- No errors in application logs

---

## 🆘 Troubleshooting

### "MSSQL shows unhealthy"
- Verify WEAVER server is accessible
- Check connection credentials in .env.local
- Verify database exists with data
- Check firewall allows port 1433

### "Data counts don't match"
- Verify exported all records from Supabase
- Check for NULL IDs or missing foreign key values
- Rerun export and verify row counts

### "Ranks import takes too long"
- Expected: 1-4 hours depending on record count
- Using batches of 5,000 is optimal
- Check disk I/O and network latency

### "Failover not triggering"
- Verify DB_FAILOVER_ENABLED=true in .env.local
- Check circuit breaker threshold (3 failures)
- Test by actually stopping Supabase connection
- Review backend logs for error details

---

## 📞 Next: Run Verification Script

**Execute immediately**:

```sql
-- File: backend/src/migrations/mssql/002_WEAVER_verification.sql
-- In: SSMS connected to WEAVER
-- Time: ~30 seconds
-- Expected output: ✓ ALL CHECKS PASSED
```

Once verification passes, proceed with reference data export.

---

**Created**: 2026-03-31  
**Updated**: 2026-03-31  
**Status**: Ready for reference data migration
