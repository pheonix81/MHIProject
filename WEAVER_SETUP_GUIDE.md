# SQL Server Migration Setup for WEAVER

**Server**: WEAVER  
**Database**: healthcare_pricing  
**User**: HP  
**Date**: March 31, 2026

---

## 📋 Pre-requisites

- [ ] SQL Server 2016+ installed on WEAVER
- [ ] SQL Server Management Studio (SSMS) installed locally
- [ ] HP user account created with appropriate permissions
- [ ] Network access from your machine to WEAVER on port 1433

---

## 🚀 Step-by-Step Setup

### Step 1: Connect to WEAVER in SSMS

1. **Open SQL Server Management Studio**
2. **Connection Dialog**:
   - Server name: `WEAVER` (or `WEAVER\SQLEXPRESS` if not default instance)
   - Authentication: **Windows Authentication** (or SQL Server if configured)
   - Click **Connect**

### Step 2: Create Database and User (If Needed)

**Only run this if the database doesn't exist. Use sa account or admin credentials.**

```sql
-- Execute with sa login
USE master;
GO

-- Create database
IF EXISTS (SELECT 1 FROM sys.databases WHERE name = 'healthcare_pricing')
BEGIN
    DROP DATABASE [healthcare_pricing];
END
GO

CREATE DATABASE [healthcare_pricing]
    ON PRIMARY (
        NAME = N'healthcare_pricing',
        FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\healthcare_pricing.mdf',
        SIZE = 500MB,
        FILEGROWTH = 100MB
    )
    LOG ON (
        NAME = N'healthcare_pricing_log',
        FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\healthcare_pricing_log.ldf',
        SIZE = 100MB,
        FILEGROWTH = 50MB
    );
GO

-- Create HP user login
IF NOT EXISTS (SELECT 1 FROM sys.syslogins WHERE loginname = 'HP')
BEGIN
    CREATE LOGIN [HP] WITH PASSWORD = 'Test@1234';
END
GO

-- Create user in healthcare_pricing database and grant permissions
USE [healthcare_pricing];
GO

IF NOT EXISTS (SELECT 1 FROM sys.sysusers WHERE name = 'HP')
BEGIN
    CREATE USER [HP] FOR LOGIN [HP];
    ALTER ROLE [db_owner] ADD MEMBER [HP];
END
GO

PRINT 'Database and user setup complete';
GO
```

**Note**: Adjust file paths if your SQL Server installation is in a different location.

### Step 3: Run Schema Migration Script

1. **Download the migration script** to your local machine:
   - File: `001_WEAVER_initial_schema.sql`
   - Location: `backend\src\migrations\mssql\`

2. **Open in SSMS**:
   - File → Open → Select `001_WEAVER_initial_schema.sql`

3. **Connect to WEAVER**:
   - Select connection: **WEAVER**
   - Select database: **healthcare_pricing**

4. **Execute the script**:
   - Query → Execute (or press F5)
   - Wait for completion (~2-3 minutes)

5. **Verify output**:
   ```
   ========== DATABASE MIGRATION COMPLETE ==========
   Created Tables: 11 tables
   Created Indexes: 20+ indexes
   Created Stored Procedures: 6 procedures
   Created Triggers: 5 triggers
   ========== READY FOR DATA MIGRATION ==========
   ```

### Step 4: Verify Database Structure

Run this verification query in SSMS:

```sql
USE [healthcare_pricing];
GO

-- Count tables
SELECT COUNT(*) AS total_tables FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo';

-- Count indexes
SELECT COUNT(*) AS total_indexes FROM sys.indexes 
WHERE object_id IN (SELECT object_id FROM sys.objects WHERE schema_id = SCHEMA_ID('dbo'));

-- Count stored procedures
SELECT COUNT(*) AS total_procedures FROM sys.objects 
WHERE type = 'P' AND name LIKE 'sp_%';

-- List all tables
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo' 
ORDER BY TABLE_NAME;
GO
```

**Expected output**:
- total_tables: **11**
- total_indexes: **20+**
- total_procedures: **6**

### Step 5: Update Application Configuration

Update your `backend/.env.local`:

```bash
# SQL Server Configuration for WEAVER
MSSQL_SERVER=WEAVER
MSSQL_DATABASE=healthcare_pricing
MSSQL_USER=HP
MSSQL_PASSWORD=Test@1234
MSSQL_PORT=1433
MSSQL_ENCRYPT=false
MSSQL_ENABLED=true

# Enable automatic failover
DB_FAILOVER_ENABLED=true
```

### Step 6: Restart Backend and Test Connection

```powershell
# Stop the current backend process
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a moment
Start-Sleep -Seconds 2

# Restart backend
cd c:\Users\icefr\MHIProject\backend
npm run dev
```

### Step 7: Verify MSSQL Connection

```powershell
# Test the health endpoint
Invoke-WebRequest http://localhost:3001/api/v1/admin/database-health -UseBasicParsing | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected response** (both should be healthy):
```json
{
  "success": true,
  "data": {
    "supabase": "healthy",
    "mssql": "healthy",        ← Should now be healthy!
    "activeDatabase": "supabase",
    "circuitBreakerState": "CLOSED",
    "totalQueries": 0,
    "failoverEvents": 0
  }
}
```

---

## 📊 Database Schema Overview

### 11 Tables Created

| Table | Purpose | Rows |
|-------|---------|------|
| procedures | CPT codes (medical procedures) | ~10K |
| providers | Hospitals, clinics, ASCs | ~2K |
| payers | Insurance companies, payer types | ~200 |
| rates | 1M+ pricing records | 1M+ |
| users | User accounts with roles | ~100 |
| audit_logs | HIPAA compliance audit trail | Growing |
| file_uploads | Track data imports | Growing |
| saved_searches | User-saved search queries | Growing |
| bookmarks | User bookmarked rates | Growing |
| import_jobs | Track bulk data imports | Growing |

### Key Indexes Created

- **rates_procedure_provider_payer** - Fastest queries
- **rates_payer_name** - Quick payer searches
- **rates_effective_date** - Date range queries
- **procedures_cpt_code** - Procedure lookups
- **providers_zip_code** - Location-based searches
- Plus 15+ more for performance optimization

### Key Stored Procedures

- `sp_SearchProcedures` - Find procedures by code
- `sp_SearchRates` - Find rates with filters
- `sp_GetProcedureStats` - Statistical analysis
- `sp_InsertAuditLog` - Compliance logging
- `sp_GetUserBookmarks` - User bookmarks with details

---

## 🔄 Data Migration (Next Steps)

After schema is ready, you'll need to:

1. **Export reference data from Supabase**:
   ```bash
   # Export procedures, providers, payers
   npm run export-reference-data
   ```

2. **Import to MSSQL**:
   ```bash
   # Batch import via bulk insert
   npm run migrate:reference-data
   ```

3. **Export rates (1M+ records)**:
   ```bash
   # Export in batches (5000 rows each)
   npm run export-rates
   ```

4. **Import rates to MSSQL**:
   ```bash
   # Bulk import with validation
   npm run migrate:rates
   ```

---

## ⚙️ Configuration Options

### Custom Data Paths (if needed)

Edit the database creation script to use your custom paths:

```sql
-- Replace default paths with your local paths:
FILENAME = N'D:\SQL_Data\healthcare_pricing.mdf',
FILENAME = N'D:\SQL_Logs\healthcare_pricing_log.ldf',
```

### Performance Tuning

For 1M+ records, consider:

```sql
-- Increase log file size if needed
ALTER DATABASE healthcare_pricing 
MODIFY FILE (NAME = healthcare_pricing_log, SIZE = 500MB);

-- Enable snapshot isolation for better concurrency
ALTER DATABASE healthcare_pricing SET ALLOW_SNAPSHOT_ISOLATION ON;
ALTER DATABASE healthcare_pricing SET READ_COMMITTED_SNAPSHOT ON;
```

---

## 🛠️ Troubleshooting

### Connection Error: "Server not found"

**Solution**: Verify server name and network access
```powershell
# Test connectivity to WEAVER
Test-NetConnection -ComputerName WEAVER -Port 1433

# If fails, check:
# 1. WEAVER server is online
# 2. SQL Server service is running
# 3. Windows Firewall allows port 1433
```

### Error: "Login failed for user 'HP'"

**Solution**: Verify HP account exists and password is correct
```sql
-- In SSMS with sa account:
USE master;
SELECT * FROM sys.syslogins WHERE loginname = 'HP';

-- If not found, create it:
CREATE LOGIN [HP] WITH PASSWORD = 'Test@1234';
```

### Error: "Database 'healthcare_pricing' does not exist"

**Solution**: Run database creation script first (see Step 2)

### Script execution error on line X

**Solution**: 
1. Check script formatting and line endings (CRLF)
2. Verify SQL Server version supports all syntax
3. Run lines individually to find error point
4. Increase command timeout in SSMS (Query → Query Options)

---

## ✅ Verification Checklist

- [ ] Connected to WEAVER server
- [ ] healthcare_pricing database created
- [ ] HP user account created
- [ ] Schema migration script executed successfully
- [ ] All 11 tables created
- [ ] All indexes created
- [ ] All stored procedures created
- [ ] Backend .env.local updated with WEAVER details
- [ ] Backend server restarted
- [ ] Health endpoint shows MSSQL as healthy
- [ ] No errors in application logs

---

## 📞 Support

**If you encounter issues**:

1. Check the MESSAGES tab in SSMS for error details
2. Run verification query to check table creation
3. Verify network connectivity to WEAVER
4. Check user permissions on healthcare_pricing database
5. Review `backend` application logs for connection errors

**Connection string used by application**:
```
Server=WEAVER;Database=healthcare_pricing;User Id=HP;Password=Test@1234;Encrypt=false;
```

---

## 🎯 Next Steps After Setup

1. ✅ Schema created and verified
2. ⏳ Migrate reference data (procedures, providers, payers)
3. ⏳ Migrate 1M+ rates records
4. ⏳ Enable automatic failover
5. ⏳ Test failover behavior
6. ⏳ Deploy to production

**Estimated Time**: 2-4 hours depending on data volume

---

**Created**: 2026-03-31  
**Last Updated**: 2026-03-31  
**Status**: Ready for deployment
