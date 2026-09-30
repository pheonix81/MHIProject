# 📋 Schema Verification Checklist

**Purpose**: Confirm that MSSQL schema was successfully created on WEAVER  
**Duration**: 5 minutes  
**Success**: All ✓ checks should pass

---

## ✅ Pre-Check: Database Connection

In SSMS, select database:

```
Server: WEAVER
Database: healthcare_pricing
Authentication: SQL Server (User: HP, Password: Test@1234)
```

**Confirmation**: Connected message shows ✓

---

## ✅ Check #1: Table Count

**Run this query**:

```sql
SELECT COUNT(*) AS table_count 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_TYPE = 'BASE TABLE';
```

**Expected result**: 11

**Verification**:
- [ ] Count is exactly 11

---

## ✅ Check #2: All Required Tables Exist

**Run this query**:

```sql
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

**Expected tables** (exact match):
1. audit_logs
2. bookmarks
3. file_uploads
4. import_jobs
5. payers
6. procedures
7. providers
8. rates
9. saved_searches
10. users
11. (1 additional table)

**Verification**:
- [ ] All 11 tables listed
- [ ] No extra tables

---

## ✅ Check #3: Index Count

**Run this query**:

```sql
SELECT COUNT(*) AS index_count
FROM sys.indexes
WHERE database_id = DB_ID('healthcare_pricing')
  AND object_id NOT IN (
      SELECT object_id FROM sys.tables 
      WHERE name IN ('dtproperties')
    );
```

**Expected result**: 25+

**Verification**:
- [ ] Count >= 25

---

## ✅ Check #4: Stored Procedures Count

**Run this query**:

```sql
SELECT COUNT(*) AS procedure_count
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'PROCEDURE'
  AND ROUTINE_SCHEMA = 'dbo';
```

**Expected result**: 6+

**Verification**:
- [ ] Count >= 6

---

## ✅ Check #5: Triggers Count

**Run this query**:

```sql
SELECT COUNT(*) AS trigger_count
FROM sys.triggers
WHERE database_id = DB_ID('healthcare_pricing');
```

**Expected result**: 5+

**Verification**:
- [ ] Count >= 5

---

## ✅ Check #6: Procedures List

**Run this query**:

```sql
SELECT ROUTINE_NAME 
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'PROCEDURE'
  AND ROUTINE_SCHEMA = 'dbo'
ORDER BY ROUTINE_NAME;
```

**Expected procedures** (check all present):
1. sp_GetProcedureStats
2. sp_GetUserBookmarks
3. sp_InsertAuditLog
4. sp_SearchProcedures
5. sp_SearchRates
6. sp_TrackImportJob

**Verification**:
- [ ] All 6 procedures listed

---

## ✅ Check #7: Table Structures

**Run this query to verify procedures table**:

```sql
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'procedures'
ORDER BY ORDINAL_POSITION;
```

**Expected columns** (sample - minimum):
- id (UNIQUEIDENTIFIER)
- cpt_code (VARCHAR)
- description (NVARCHAR)
- category (NVARCHAR)
- avg_market_price (FLOAT)
- updated_at (DATETIME2)

**Verification**:
- [ ] id exists as UNIQUEIDENTIFIER
- [ ] cpt_code exists as VARCHAR
- [ ] updated_at exists as DATETIME2

**Run for providers table**:

```sql
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'providers'
ORDER BY ORDINAL_POSITION;
```

**Expected columns** (minimum):
- id (UNIQUEIDENTIFIER)
- npi (VARCHAR)
- name (NVARCHAR)
- updated_at (DATETIME2)

**Verification**:
- [ ] Structure matches expectations

**Run for rates table**:

```sql
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'rates'
ORDER BY ORDINAL_POSITION;
```

**Expected columns** (minimum):
- id (UNIQUEIDENTIFIER)
- procedure_id (UNIQUEIDENTIFIER)
- provider_id (UNIQUEIDENTIFIER)
- payer_id (UNIQUEIDENTIFIER)
- cash_price (FLOAT)
- insurance_price (FLOAT)

**Verification**:
- [ ] Foreign key columns exist
- [ ] Pricing columns are FLOAT

---

## ✅ Check #8: Indexes on Rates Table

**Run this query**:

```sql
SELECT i.NAME as index_name,
       STRING_AGG(c.NAME, ', ') as columns
FROM sys.indexes i
JOIN sys.index_columns ic ON i.object_id = ic.object_id 
                          AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id 
                  AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('dbo.rates')
GROUP BY i.NAME
ORDER BY i.NAME;
```

**Expected indexes** (check includes):
- idx_rates_procedure_id
- idx_rates_provider_id
- idx_rates_payer_id
- idx_rates_composite (procedure, provider, payer)

**Verification**:
- [ ] At least 4+ indexes on rates table
- [ ] Composite index exists

---

## ✅ Check #9: Triggers on Tables

**Run this query**:

```sql
SELECT t.name as trigger_name,
       obj.name as table_name
FROM sys.triggers t
JOIN sys.objects obj ON t.parent_id = obj.object_id
WHERE t.parent_class = 1
ORDER BY obj.name, t.name;
```

**Expected patterns** (check include):
- tr_*_updated_at on audit_logs
- tr_*_updated_at on procedures
- tr_*_updated_at on providers
- tr_*_updated_at on users

**Verification**:
- [ ] Updated_at triggers exist on key tables

---

## ✅ Check #10: Foreign Key Constraints

**Run this query**:

```sql
SELECT CONSTRAINT_NAME, TABLE_NAME, REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;
```

**Expected relationships** (check include):
- rates → procedures
- rates → providers
- rates → payers
- bookmarks → users
- saved_searches → users

**Verification**:
- [ ] At least 5 FK constraints exist

---

## ✅ Check #11: Test Sample Data

**Run this query**:

```sql
SELECT TOP 5 * FROM dbo.procedures;
SELECT TOP 5 * FROM dbo.providers;
SELECT TOP 5 * FROM dbo.payers;
SELECT TOP 5 * FROM dbo.rates;
```

**Expected result**: Each table either empty (ok) or has sample test data

**Verification**:
- [ ] Queries execute without errors
- [ ] Results show valid structure

---

## ✅ Final Verification: All Counts

**Run all checks at once**:

```sql
DECLARE @tables INT, @indexes INT, @procs INT, @triggers INT;

SELECT @tables = COUNT(*) 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_TYPE = 'BASE TABLE';

SELECT @indexes = COUNT(*)
FROM sys.indexes
WHERE database_id = DB_ID('healthcare_pricing');

SELECT @procs = COUNT(*)
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_SCHEMA = 'dbo';

SELECT @triggers = COUNT(*)
FROM sys.triggers
WHERE database_id = DB_ID('healthcare_pricing');

PRINT 'MSSQL SCHEMA VERIFICATION - ' + CAST(GETDATE() AS varchar(20));
PRINT REPLICATE('=', 50);
PRINT 'Tables: ' + CAST(@tables AS VARCHAR(10)) + ' (Expected: 11)';
PRINT 'Indexes: ' + CAST(@indexes AS VARCHAR(10)) + ' (Expected: 25+)';
PRINT 'Procedures: ' + CAST(@procs AS VARCHAR(10)) + ' (Expected: 6)';
PRINT 'Triggers: ' + CAST(@triggers AS VARCHAR(10)) + ' (Expected: 5+)';
PRINT '';

IF @tables = 11 AND @indexes >= 25 AND @procs >= 6 AND @triggers >= 5
  PRINT '✓ ALL CHECKS PASSED - Schema successfully created!'
ELSE
  PRINT '✗ CHECKS FAILED - Review above counts';
```

---

## 📝 Checklist Summary

**Mark complete as you verify**:

- [ ] Database connected to WEAVER/healthcare_pricing
- [ ] Check #1: Table count = 11
- [ ] Check #2: All 11 required tables exist
- [ ] Check #3: Index count >= 25
- [ ] Check #4: Procedure count >= 6
- [ ] Check #5: Trigger count >= 5
- [ ] Check #6: All 6 procedures listed
- [ ] Check #7: Table structures verified
- [ ] Check #8: Indexes on rates exist
- [ ] Check #9: Updated_at triggers exist
- [ ] Check #10: FK constraints >= 5
- [ ] Check #11: Sample queries execute

---

## ✅ Success Criteria

**Schema is READY when ALL of the following are true**:
1. ✓ 11 tables exist
2. ✓ 25+ indexes created
3. ✓ 6 stored procedures compiled
4. ✓ 5+ triggers active
5. ✓ All FK constraints defined
6. ✓ Tables structure matches expectations

**If ANY check fails**: 
→ Review error message  
→ Re-run migration script: `001_WEAVER_initial_schema.sql`  
→ Wait 2-3 minutes and retry verification

---

## 🚀 After Verification Passes

**Next step**: Export and import reference data

- Procedures (→ provides constraint references)
- Providers (→ provides constraint references)
- Payers (→ provides constraint references)

See: `IMMEDIATE_ACTIONS.md` → **STEP 2: Export Reference Data**

---

**Verification Time**: ⏰ ~5 minutes total
