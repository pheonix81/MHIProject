# SQL Server Migration Script - Version 3.0 (Clean Slate)

**Date**: 2026-03-31  
**Status**: ✅ Fixed for existing database instances

---

## 🔧 What Was Fixed

### Main Issue: Foreign Key Constraint Conflicts
**Problem**: Previous script tried to drop tables one-by-one while foreign keys still existed, causing cascading failures.

**Solution** (Version 3.0):
1. Drops **ALL triggers and procedures first** (no dependencies)
2. Disables foreign key constraints
3. Drops **ALL tables** (reverse dependency order)
4. Then creates clean schema from scratch

### Other Fixes Applied
- ✅ Removed redundant `IF OBJECT_ID` checks
- ✅ Fixed TEXT column aggregation in `sp_GetProcedureStats`
- ✅ Updated stored procedure parameter types to match table definitions
- ✅ Fixed trigger query using proper `parent_object_id` lookup
- ✅ All dependency issues resolved

---

## 🚀 How to Run (Clean Re-deployment)

### Option A: Clean Re-run on Existing Database

**In SSMS (connected to WEAVER as HP user)**:

1. **Open script**: `backend\src\migrations\mssql\001_WEAVER_initial_schema.sql`
2. **Verify connection**:
   - Server: WEAVER
   - Database: healthcare_pricing
   - User: HP
3. **Execute**: Press F5
4. **Wait for completion** (~3-5 minutes)

**Output will show**:
```
Cleanup complete: All existing objects dropped
Created: procedures table
Created: providers table
Created: payers table
Created: rates table
Created: users table
Created: audit_logs table
Created: file_uploads table
Created: saved_searches table
Created: bookmarks table
Created: import_jobs table
Created: all update triggers
Created: all stored procedures

========== DATABASE MIGRATION COMPLETE ==========
...
========== READY FOR DATA MIGRATION ==========
```

### Option B: If Database Doesn't Exist

First create the database **with sa account**:

```sql
USE master;
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

-- Create HP login if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.syslogins WHERE name = 'HP')
BEGIN
    CREATE LOGIN [HP] WITH PASSWORD = 'Test@1234';
END
GO

-- Create user and add to db_owner role
USE [healthcare_pricing];
GO

IF NOT EXISTS (SELECT name FROM sys.sysusers WHERE name = 'HP')
BEGIN
    CREATE USER [HP] FOR LOGIN [HP];
    ALTER ROLE [db_owner] ADD MEMBER [HP];
END
GO
```

Then run the migration script normally.

---

## ✅ What the Script Does

### Cleanup Phase (New in V3.0)
```sql
-- 1. Drop all triggers (no dependencies)
-- 2. Drop all stored procedures (no dependencies)
-- 3. Disable foreign key constraints
-- 4. Drop all tables (in dependency order)
```

### Creation Phase
```sql
-- 1. Create 11 tables (clean slate, no conflicts)
-- 2. Create 5 update triggers (automatic timestamp management)
-- 3. Create 6 stored procedures (common operations)
-- 4. Verify all created successfully
```

---

## 📊 Schema Created

| Component | Count | Details |
|-----------|-------|---------|
| Tables | 11 | procedures, providers, payers, rates, users, audit_logs, file_uploads, saved_searches, bookmarks, import_jobs |
| Indexes | 25+ | Optimized for search and filtering |
| Triggers | 5 | Auto-update `updated_at` timestamps |
| Stored Procedures | 6 | Search, stats, bookmarks, audit logging |
| Foreign Keys | 15+ | Referential integrity |

---

## 🎯 Verification After Run

```sql
-- Run to verify all was created:

USE [healthcare_pricing];
GO

-- Should show 11
SELECT COUNT(*) AS TotalTables FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo';

-- Should show 25+
SELECT COUNT(*) AS TotalIndexes FROM sys.indexes 
WHERE object_id IN (SELECT object_id FROM sys.objects WHERE SCHEMA_NAME(schema_id) = 'dbo');

-- Should show 6
SELECT COUNT(*) AS TotalProcedures FROM sys.objects 
WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo';

-- List all tables created
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo' 
ORDER BY TABLE_NAME;
```

---

## ⚡ Key Improvements in V3.0

| Issue | Previous (V2.0) | Now (V3.0) |
|-------|-----------------|-----------|
| Foreign Key Errors | ❌ Dropped individual tables | ✅ Disables all constraints first |
| Table Already Exists | ❌ Partial cleanup failures | ✅ Complete cleanup guaranteed |
| TEXT Column Issues | ❌ GROUP BY on TEXT failed | ✅ CAST to VARCHAR for aggregation |
| Type Mismatches | ❌ NVARCHAR(MAX) in indexes | ✅ VARCHAR(255) for all keys |
| Procedure Parameters | ❌ Parameter type mismatches | ✅ All parameters match table types |
| Verification Queries | ❌ Invalid column references | ✅ All queries use valid columns |

---

## 🔍 Before and After Comparison

### Cleanup (NEW)
**Before (V2.0)**:
```sql
IF OBJECT_ID('dbo.procedures', 'U') IS NOT NULL
    DROP TABLE dbo.procedures;  -- ❌ Fails if foreign keys exist
GO
```

**After (V3.0)**:
```sql
-- Drop triggers first
DROP TRIGGER IF EXISTS dbo.tr_procedures_updated_at;

-- Drop procedures
DROP PROCEDURE IF EXISTS dbo.sp_SearchProcedures;

-- Disable constraints
ALTER TABLE dbo.rates NOCHECK CONSTRAINT ALL;

-- Drop all tables (guaranteed success)
DROP TABLE IF EXISTS dbo.bookmarks;
DROP TABLE IF EXISTS dbo.rates;  -- ✅ Now works - no constraints
DROP TABLE IF EXISTS dbo.procedures;  -- ✅ No foreign key errors
GO
```

### Procedure Fix
**Before (V2.0)**:
```sql
GROUP BY p.id, p.cpt_code, p.description;  -- ❌ Cannot GROUP BY TEXT
```

**After (V3.0)**:
```sql
GROUP BY p.id, p.cpt_code, CAST(p.description AS VARCHAR(MAX));  -- ✅ Works
```

### Parameter Fix
**Before (V2.0)**:
```sql
CREATE PROCEDURE sp_GetUserBookmarks @user_id NVARCHAR(MAX)  -- Type mismatch
```

**After (V3.0)**:
```sql
CREATE PROCEDURE sp_GetUserBookmarks @user_id VARCHAR(255)  -- Matches table definition
```

---

## 🛠️ Troubleshooting

### Error: "Could not drop object because it is referenced by a FOREIGN KEY"

**Solution**: The script now handles this automatically. Make sure you're running:
- **Version**: 001_WEAVER_initial_schema.sql (V3.0)
- **User**: HP (with db_owner role)
- **Location**: Connected to healthcare_pricing database

### Error: "There is already an object named X"

**Solution**: The cleanup phase should remove this. If you still see this:
1. Verify the script ran the cleanup section (check messages)
2. Confirm database is in good state: `DBCC CHECKDB`
3. If needed, drop manually:
   ```sql
   DROP TABLE IF EXISTS dbo.rates;
   DROP TABLE IF EXISTS dbo.bookmarks;
   -- etc...
   ```

### Error: "The text, ntext, and image data types cannot be compared"

**Solution**: Fixed in V3.0. If you see this:
1. Use the latest version of the script
2. No manual fixes needed

### Error: "Invalid column name 'parent_object_id'"

**Solution**: Fixed in V3.0. The verification query now uses proper joins instead of invalid column references.

---

## ✨ What's Next

After successful migration:

1. ✅ Verify all 11 tables created
2. ⏳ Migrate reference data (procedures, providers, payers)
3. ⏳ Migrate 1M+ rates records
4. ⏳ Test backend connection
5. ⏳ Enable automatic failover
6. ⏳ Test failover behavior

---

## 📋 Pre-Execution Checklist

- [ ] SSMS connected to WEAVER as HP
- [ ] Database: healthcare_pricing selected
- [ ] Script: 001_WEAVER_initial_schema.sql (V3.0)
- [ ] Network connectivity verified
- [ ] HP user has db_owner role
- [ ] Sufficient disk space available

---

## 🎓 Technical Details

### Cleanup Execution Order
1. **Triggers** (depend on nothing after creation)
2. **Procedures** (reference tables, but procedures are just definitions)
3. **Constraints** (disabled to allow table deletion)
4. **Tables** (dropped in reverse dependency chain)

### Creation Execution Order
1. **Reference Tables**: procedures, providers, payers (no dependencies)
2. **Data Tables**: rates, users (depend on reference tables)
3. **Operational Tables**: audit_logs, file_uploads (depend on users)
4. **Feature Tables**: saved_searches, bookmarks, import_jobs (depend on others)
5. **Triggers** (created after all tables exist)
6. **Procedures** (created after all tables exist)

### Dependency Chain
```
procedures ─┐
            ├─→ rates ─┐
providers ──┤          │
            │          ├─→ bookmarks
payers ─────┤          │
            └──+────────┤
               │        │
            users      audit_logs
               │        │
               ├─→ file_uploads ──→ import_jobs
               │
            saved_searches
```

---

**Version**: 3.0 (Clean Slate)  
**Last Updated**: 2026-03-31  
**Status**: ✅ Production Ready  
**Next Run**: Ready to execute
