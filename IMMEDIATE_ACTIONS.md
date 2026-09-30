# MSSQL Migration - Immediate Actions

**Status**: Schema created successfully ✅  
**Next**: Execute verification and data migration  
**Time**: 2-5 hours total (mostly waiting for data import)

---

## 🚀 START HERE: 3-Step Process

### ⏱️ RIGHT NOW (5 minutes)

**Step 1: Run verification script in SSMS**

```sql
-- File: backend\src\migrations\mssql\002_WEAVER_verification.sql
-- Location: Connect to WEAVER, database: healthcare_pricing
-- Execute: F5
-- Expected: ✓ ALL CHECKS PASSED
```

If verification passes → Continue to Step 2

If verification fails → Check error messages and re-run migration script

---

### 📦 STEP 2: Export Reference Data (10 minutes)

**In Supabase (pgAdmin or SQL file export)**:

Export these queries to CSV files:

**A. Export Procedures (File: procedures.csv)**
```sql
SELECT id, cpt_code, description, category, avg_market_price, low_price, high_price, data_points 
FROM procedures 
ORDER BY cpt_code;
```

**B. Export Providers (File: providers.csv)**
```sql
SELECT id, name, npi, provider_type, address, city, zip_code, state, latitude, longitude, phone, website, is_active 
FROM providers 
ORDER BY name;
```

**C. Export Payers (File: payers.csv)**
```sql
SELECT id, name, type, is_active 
FROM payers 
ORDER BY name;
```

📍 Save all 3 CSV files to: `C:\temp\migration\`

---

### 💾 STEP 3: Import Reference Data to MSSQL (5-10 minutes)

**In SSMS (connected to WEAVER, healthcare_pricing)**:

Execute this script from the attachment below👇

---

## 📄 Import Script - Run in SSMS

```sql
-- ============================================================================
-- IMPORT REFERENCE DATA TO MSSQL
-- ============================================================================
-- Run in: SSMS connected to WEAVER, database: healthcare_pricing
-- Files needed:
--   C:\temp\migration\procedures.csv
--   C:\temp\migration\providers.csv
--   C:\temp\migration\payers.csv
-- Time: ~5 minutes
-- ============================================================================

USE [healthcare_pricing];
GO

PRINT 'Starting reference data import...';
PRINT '';

-- ============================================================================
-- IMPORT PROCEDURES
-- ============================================================================
PRINT 'Importing procedures...';

BULK INSERT dbo.procedures
FROM 'C:\temp\migration\procedures.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    TABLOCK
);

DECLARE @ProcCount INT = (SELECT COUNT(*) FROM dbo.procedures);
PRINT '✓ Imported ' + CAST(@ProcCount AS VARCHAR(10)) + ' procedures';
PRINT '';

-- ============================================================================
-- IMPORT PROVIDERS
-- ============================================================================
PRINT 'Importing providers...';

BULK INSERT dbo.providers
FROM 'C:\temp\migration\providers.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    TABLOCK
);

DECLARE @ProvCount INT = (SELECT COUNT(*) FROM dbo.providers);
PRINT '✓ Imported ' + CAST(@ProvCount AS VARCHAR(10)) + ' providers';
PRINT '';

-- ============================================================================
-- IMPORT PAYERS
-- ============================================================================
PRINT 'Importing payers...';

BULK INSERT dbo.payers
FROM 'C:\temp\migration\payers.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    TABLOCK
);

DECLARE @PayerCount INT = (SELECT COUNT(*) FROM dbo.payers);
PRINT '✓ Imported ' + CAST(@PayerCount AS VARCHAR(10)) + ' payers';
PRINT '';

-- ============================================================================
-- VERIFY IMPORTS
-- ============================================================================
PRINT '========== VERIFICATION ==========';
SELECT 'procedures' AS TableName, COUNT(*) AS RowCount FROM dbo.procedures
UNION ALL
SELECT 'providers', COUNT(*) FROM dbo.providers
UNION ALL
SELECT 'payers', COUNT(*) FROM dbo.payers
ORDER BY TableName;

PRINT '';
PRINT 'Reference data import complete!';
PRINT 'Next: Export and import rates (1M+ records)';
PRINT '';
GO
```

---

## ✅ After Reference Data Import

**Verify in MSSQL**:

```sql
USE [healthcare_pricing];
SELECT 'procedures' AS TableName, COUNT(*) AS RowCount FROM dbo.procedures
UNION ALL
SELECT 'providers', COUNT(*) FROM dbo.providers
UNION ALL
SELECT 'payers', COUNT(*) FROM dbo.payers;
```

**Expected counts** (approximately):
- procedures: ~10,000
- providers: ~2,000
- payers: ~200

---

## 🔄 Next Phase: Rates Migration (1-4 hours)

### Create SQL script to export rates from Supabase:

```sql
-- Export from Supabase (export all rates)
SELECT 
    id, procedure_id, provider_id, payer_id, payer_name,
    cash_price, insurance_price, insurance_type,
    effective_date, expiration_date, source_file, version
FROM rates
ORDER BY id;
```

Save as: `rates.csv` (~500MB+ file)

### Import rates to MSSQL:

```sql
USE [healthcare_pricing];
GO

PRINT 'Starting rates import (this will take 1-4 hours)...';

BULK INSERT dbo.rates
FROM 'C:\temp\migration\rates.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    TABLOCK,
    MAXERRORS = 100
);

SELECT COUNT(*) AS imported_rates FROM dbo.rates;
PRINT 'Rates import complete!';
```

---

## 🔧 Update Backend Configuration

Edit `backend/.env.local`:

```bash
# Change MSSQL_SERVER from localhost to WEAVER
MSSQL_SERVER=WEAVER

# Make sure these are set:
MSSQL_DATABASE=healthcare_pricing
MSSQL_USER=HP
MSSQL_PASSWORD=Test@1234
MSSQL_ENABLED=true          # Enable MSSQL
DB_FAILOVER_ENABLED=false   # Keep disabled for now
```

---

## 🚀 Restart Backend & Test

```powershell
# 1. Stop backend
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. Start backend
cd c:\Users\icefr\MHIProject\backend
npm run dev

# 3. Test health (in another terminal)
Invoke-WebRequest http://localhost:3001/api/v1/admin/database-health -UseBasicParsing | ConvertFrom-Json | ConvertTo-Json -Depth 10

# 4. Expected: Both supabase and mssql should be "healthy"
```

---

## 📋 Timeline

| Task | Time | Status |
|------|------|--------|
| ✅ Schema creation | 3-5 min | DONE |
| ⏳ Run verification | 5 min | DO NOW |
| ⏳ Export reference data | 5 min | DO NOW |
| ⏳ Import reference data | 10 min | DO NOW |
| ⏳ Export rates | 30 min | AFTER reference |
| ⏳ Import rates | 1-4 hours | AFTER rates export |
| ⏳ Update backend config | 2 min | AFTER data import |
| ⏳ Test connection | 5 min | AFTER config |
| ⏳ Enable failover (optional) | 2 min | AFTER testing |
| **TOTAL** | **2-5 hours** | |

---

## 🎯 By End of Today

✅ MSSQL schema created on WEAVER  
✅ Reference data migrated  
✅ Rates imported (if time permits)  
✅ Backend configured to use WEAVER  
✅ Automatic failover ready to activate  

---

## ❓ Quick Troubleshooting

**"Verification script shows errors"**
- Re-run migration script: `001_WEAVER_initial_schema.sql`
- Wait 2-3 minutes after drop before re-running

**"CSV import failed"**
- Check file path is correct
- Verify CSV headers match database columns
- Check for special characters in data

**"MSSQL connection failed"**
- Verify WEAVER is reachable: `ping WEAVER`
- Verify SQL Server is running on WEAVER
- Check credentials in .env.local match

**"Too slow"**
- This is normal for 1M+ records
- Expect 1-4 hours for rates import
- Use TABLOCK hint for faster inserts

---

## 📞 Commands Summary

```bash
# 1. Verify schema (SSMS)
# File: backend/src/migrations/mssql/002_WEAVER_verification.sql

# 2. Export from Supabase
# Use pgAdmin or custom export

# 3. Import to MSSQL (SSMS)
# Run import script above

# 4. Restart backend
npm run dev

# 5. Test connection
curl http://localhost:3001/api/v1/admin/database-health

# 6. Enable failover (when ready)
# Edit .env.local: DB_FAILOVER_ENABLED=true
```

---

**START**: Run verification script in SSMS NOW! ⏱️

**File**: `backend\src\migrations\mssql\002_WEAVER_verification.sql`
