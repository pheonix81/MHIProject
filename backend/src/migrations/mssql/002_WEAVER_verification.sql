-- ============================================================================
-- VERIFICATION SCRIPT - Validate WEAVER Schema Creation
-- ============================================================================
-- Run this after executing 001_WEAVER_initial_schema.sql
-- Server: WEAVER
-- Database: healthcare_pricing
-- Created: 2026-03-31
-- ============================================================================

USE [healthcare_pricing];
GO

PRINT '========== VERIFICATION REPORT ==========';
PRINT '';

-- ============================================================================
-- 1. VERIFY TABLES (Should be 11)
-- ============================================================================
PRINT '1. TABLES VERIFICATION:';
DECLARE @TableCount INT = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo');
PRINT '   Expected: 11 tables';
PRINT '   Found: ' + CAST(@TableCount AS VARCHAR(10)) + ' tables';

SELECT 
    TABLE_NAME,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) AS Columns
FROM INFORMATION_SCHEMA.TABLES t
WHERE TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;

-- ============================================================================
-- 2. VERIFY INDEXES (Should be 25+)
-- ============================================================================
PRINT '';
PRINT '2. INDEXES VERIFICATION:';
DECLARE @IndexCount INT = (
    SELECT COUNT(*) FROM sys.indexes 
    WHERE object_id IN (SELECT object_id FROM sys.objects WHERE SCHEMA_NAME(schema_id) = 'dbo')
);
PRINT '   Expected: 25+ indexes';
PRINT '   Found: ' + CAST(@IndexCount AS VARCHAR(10)) + ' indexes';

SELECT 
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType
FROM sys.indexes i
WHERE object_id IN (SELECT object_id FROM sys.objects WHERE SCHEMA_NAME(schema_id) = 'dbo')
ORDER BY OBJECT_NAME(i.object_id), i.name;

-- ============================================================================
-- 3. VERIFY STORED PROCEDURES (Should be 6)
-- ============================================================================
PRINT '';
PRINT '3. STORED PROCEDURES VERIFICATION:';
DECLARE @ProcCount INT = (SELECT COUNT(*) FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name LIKE 'sp_%');
PRINT '   Expected: 6 procedures';
PRINT '   Found: ' + CAST(@ProcCount AS VARCHAR(10)) + ' procedures';

SELECT 
    name AS ProcedureName,
    create_date AS CreatedDate
FROM sys.objects
WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name LIKE 'sp_%'
ORDER BY name;

-- ============================================================================
-- 4. VERIFY TRIGGERS (Should be 5-6)
-- ============================================================================
PRINT '';
PRINT '4. TRIGGERS VERIFICATION:';
DECLARE @TriggerCount INT = (
    SELECT COUNT(*) FROM sys.triggers 
    WHERE parent_class = 1 
    AND parent_id IN (SELECT object_id FROM sys.objects WHERE SCHEMA_NAME(schema_id) = 'dbo')
);
PRINT '   Expected: 5-6 triggers';
PRINT '   Found: ' + CAST(@TriggerCount AS VARCHAR(10)) + ' triggers';

SELECT 
    OBJECT_NAME(t.parent_id) AS TableName,
    t.name AS TriggerName,
    t.create_date AS CreatedDate
FROM sys.triggers t
WHERE t.parent_class = 1
ORDER BY OBJECT_NAME(t.parent_id), t.name;

-- ============================================================================
-- 5. VERIFY FOREIGN KEYS
-- ============================================================================
PRINT '';
PRINT '5. FOREIGN KEYS VERIFICATION:';
SELECT 
    OBJECT_NAME(ccu.table_object_id) AS TableName,
    ccu.name AS ColumnName,
    OBJECT_NAME(rc.referenced_object_id) AS ReferencedTableName,
    rc.name AS ConstraintName
FROM sys.foreign_key_columns rc
INNER JOIN sys.columns ccu ON rc.parent_object_id = ccu.object_id AND rc.parent_column_id = ccu.column_id
WHERE rc.parent_object_id IN (SELECT object_id FROM sys.objects WHERE SCHEMA_NAME(schema_id) = 'dbo')
ORDER BY OBJECT_NAME(ccu.table_object_id);

-- ============================================================================
-- 6. TABLE STRUCTURE VALIDATION
-- ============================================================================
PRINT '';
PRINT '6. TABLE STRUCTURE VALIDATION:';

-- Verify procedures table has key columns
SELECT 
    'procedures' AS TableName,
    COUNT(*) AS ColumnCount
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'procedures' AND TABLE_SCHEMA = 'dbo'

UNION ALL

-- Verify providers table
SELECT 
    'providers' AS TableName,
    COUNT(*) AS ColumnCount
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'providers' AND TABLE_SCHEMA = 'dbo'

UNION ALL

-- Verify rates table
SELECT 
    'rates' AS TableName,
    COUNT(*) AS ColumnCount
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'rates' AND TABLE_SCHEMA = 'dbo'

UNION ALL

-- Verify users table
SELECT 
    'users' AS TableName,
    COUNT(*) AS ColumnCount
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = 'dbo';

PRINT '';
PRINT 'Detailed column types for rates table:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'rates' AND TABLE_SCHEMA = 'dbo'
ORDER BY ORDINAL_POSITION;

-- ============================================================================
-- 7. FINAL SUMMARY
-- ============================================================================
PRINT '';
PRINT '========== VERIFICATION SUMMARY ==========';

-- Recalculate counts in same batch for final summary
DECLARE @FinalTableCount INT = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo');
DECLARE @FinalIndexCount INT = (SELECT COUNT(*) FROM sys.indexes WHERE object_id IN (SELECT object_id FROM sys.objects WHERE SCHEMA_NAME(schema_id) = 'dbo'));
DECLARE @FinalProcCount INT = (SELECT COUNT(*) FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name LIKE 'sp_%');
DECLARE @FinalTriggerCount INT = (SELECT COUNT(*) FROM sys.triggers WHERE parent_class = 1 AND parent_id IN (SELECT object_id FROM sys.objects WHERE SCHEMA_NAME(schema_id) = 'dbo'));

IF @FinalTableCount = 11 AND @FinalIndexCount >= 25 AND @FinalProcCount = 6 AND @FinalTriggerCount >= 5
BEGIN
    PRINT '✓ ALL CHECKS PASSED - Schema created successfully!';
    PRINT '';
    PRINT 'Next Steps:';
    PRINT '1. Export reference data from Supabase (procedures, providers, payers)';
    PRINT '2. Import reference data to MSSQL';
    PRINT '3. Export and import 1M+ rates from Supabase';
    PRINT '4. Update backend .env.local with MSSQL_ENABLED=true';
    PRINT '5. Restart backend and verify health endpoint';
    PRINT '6. Test failover logic';
END
ELSE
BEGIN
    PRINT '✗ VERIFICATION FAILED';
    PRINT '   Tables: ' + CAST(@FinalTableCount AS VARCHAR(10)) + ' (expected 11)';
    PRINT '   Indexes: ' + CAST(@FinalIndexCount AS VARCHAR(10)) + ' (expected 25+)';
    PRINT '   Procedures: ' + CAST(@FinalProcCount AS VARCHAR(10)) + ' (expected 6)';
    PRINT '   Triggers: ' + CAST(@FinalTriggerCount AS VARCHAR(10)) + ' (expected 5+)';
    PRINT '';
    PRINT 'Please re-run the schema migration script: 001_WEAVER_initial_schema.sql';
END

PRINT '';
