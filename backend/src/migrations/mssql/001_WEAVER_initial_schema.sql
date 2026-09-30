-- ============================================================================
-- Healthcare Price Transparency Platform - SQL Server Migration Script
-- ============================================================================
-- Server: WEAVER
-- Database: healthcare_pricing
-- User: HP
-- Created: 2026-03-31
-- 
-- This script creates all necessary tables, indexes, and stored procedures
-- for the healthcare pricing transparency application on SQL Server.
-- ============================================================================

-- ============================================================================
-- 1. CREATE DATABASE (Run separately if needed)
-- ============================================================================
/*
Note: Execute this separately with sa login first, then use HP account

USE [master];
GO

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

-- Adjust paths based on your SQL Server installation
-- Default paths: C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\

-- After database is created, grant HP user access:
USE [master];
GO
CREATE USER [HP] FOR LOGIN [HP];
ALTER ROLE [db_owner] ADD MEMBER [HP];
GO
*/

-- ============================================================================
-- Switch to healthcare_pricing database
-- ============================================================================
USE [healthcare_pricing];
GO

-- ============================================================================
-- CLEANUP: Drop existing objects in reverse dependency order
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS dbo.tr_procedures_updated_at;
DROP TRIGGER IF EXISTS dbo.tr_providers_updated_at;
DROP TRIGGER IF EXISTS dbo.tr_payers_updated_at;
DROP TRIGGER IF EXISTS dbo.tr_rates_updated_at;
DROP TRIGGER IF EXISTS dbo.tr_users_updated_at;
DROP TRIGGER IF EXISTS dbo.tr_saved_searches_updated_at;
GO

-- Drop stored procedures
DROP PROCEDURE IF EXISTS dbo.sp_SearchProcedures;
DROP PROCEDURE IF EXISTS dbo.sp_SearchRates;
DROP PROCEDURE IF EXISTS dbo.sp_GetProcedureStats;
DROP PROCEDURE IF EXISTS dbo.sp_InsertAuditLog;
DROP PROCEDURE IF EXISTS dbo.sp_GetUserBookmarks;
GO

-- Disable foreign key constraints temporarily (only if tables exist)
IF OBJECT_ID('dbo.bookmarks', 'U') IS NOT NULL
    ALTER TABLE dbo.bookmarks NOCHECK CONSTRAINT ALL;
IF OBJECT_ID('dbo.file_uploads', 'U') IS NOT NULL
    ALTER TABLE dbo.file_uploads NOCHECK CONSTRAINT ALL;
IF OBJECT_ID('dbo.import_jobs', 'U') IS NOT NULL
    ALTER TABLE dbo.import_jobs NOCHECK CONSTRAINT ALL;
IF OBJECT_ID('dbo.rates', 'U') IS NOT NULL
    ALTER TABLE dbo.rates NOCHECK CONSTRAINT ALL;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL
    ALTER TABLE dbo.users NOCHECK CONSTRAINT ALL;
IF OBJECT_ID('dbo.saved_searches', 'U') IS NOT NULL
    ALTER TABLE dbo.saved_searches NOCHECK CONSTRAINT ALL;
GO

-- Drop dependent tables first (those with foreign key references)
DROP TABLE IF EXISTS dbo.bookmarks;
DROP TABLE IF EXISTS dbo.saved_searches;
DROP TABLE IF EXISTS dbo.import_jobs;
DROP TABLE IF EXISTS dbo.file_uploads;
DROP TABLE IF EXISTS dbo.audit_logs;
DROP TABLE IF EXISTS dbo.rates;
DROP TABLE IF EXISTS dbo.users;
DROP TABLE IF EXISTS dbo.providers;
DROP TABLE IF EXISTS dbo.payers;
DROP TABLE IF EXISTS dbo.procedures;
GO

PRINT 'Cleanup complete: All existing objects dropped';
GO

-- ============================================================================
-- 2. PROCEDURES TABLE - CPT codes and market statistics
-- ============================================================================
CREATE TABLE dbo.procedures (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    cpt_code            VARCHAR(10) NOT NULL UNIQUE,
    description         TEXT NOT NULL,
    category            VARCHAR(50) NULL,
    avg_market_price    NUMERIC(10, 2) NULL,
    low_price           NUMERIC(10, 2) NULL,
    high_price          NUMERIC(10, 2) NULL,
    data_points         INT DEFAULT 0,
    created_at          DATETIME2 DEFAULT GETUTCDATE(),
    updated_at          DATETIME2 DEFAULT GETUTCDATE()
);

CREATE NONCLUSTERED INDEX idx_procedures_cpt_code ON dbo.procedures(cpt_code);
CREATE NONCLUSTERED INDEX idx_procedures_category ON dbo.procedures(category);

PRINT 'Created: procedures table';
GO

-- ============================================================================
-- 3. PROVIDERS TABLE - Hospitals, clinics, ASCs
-- ============================================================================
CREATE TABLE dbo.providers (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name                VARCHAR(255) NOT NULL,
    npi                 VARCHAR(10) UNIQUE,
    provider_type       VARCHAR(50) NULL,
    address             TEXT NULL,
    city                VARCHAR(100) NULL,
    zip_code            VARCHAR(5) NULL,
    state               VARCHAR(2) NULL,
    latitude            NUMERIC(9, 6) NULL,
    longitude           NUMERIC(9, 6) NULL,
    phone               VARCHAR(20) NULL,
    website             VARCHAR(255) NULL,
    is_active           BIT DEFAULT 1,
    created_at          DATETIME2 DEFAULT GETUTCDATE(),
    updated_at          DATETIME2 DEFAULT GETUTCDATE()
);

CREATE NONCLUSTERED INDEX idx_providers_zip_code ON dbo.providers(zip_code);
CREATE NONCLUSTERED INDEX idx_providers_state ON dbo.providers(state);
CREATE NONCLUSTERED INDEX idx_providers_npi ON dbo.providers(npi);
CREATE NONCLUSTERED INDEX idx_providers_is_active ON dbo.providers(is_active);

PRINT 'Created: providers table';
GO

-- ============================================================================
-- 4. PAYERS TABLE - Insurance companies, Medicare, Medicaid
-- ============================================================================
CREATE TABLE dbo.payers (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name                VARCHAR(255) NOT NULL UNIQUE,
    type                VARCHAR(50) NULL,
    is_active           BIT DEFAULT 1,
    created_at          DATETIME2 DEFAULT GETUTCDATE(),
    updated_at          DATETIME2 DEFAULT GETUTCDATE()
);

CREATE NONCLUSTERED INDEX idx_payers_type ON dbo.payers(type);

PRINT 'Created: payers table';
GO

-- ============================================================================
-- 5. RATES TABLE - 1M+ PRICING RECORDS (DENORMALIZED FOR SPEED)
-- ============================================================================
CREATE TABLE dbo.rates (
    id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    procedure_id            UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.procedures(id) ON DELETE CASCADE,
    provider_id             UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.providers(id) ON DELETE CASCADE,
    payer_id                UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.payers(id) ON DELETE CASCADE,
    payer_name              VARCHAR(255) NOT NULL,
    cash_price              NUMERIC(10, 2) NULL,
    insurance_price         NUMERIC(10, 2) NULL,
    insurance_type          VARCHAR(50) NULL,
    effective_date          DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    expiration_date         DATE DEFAULT '2099-12-31',
    source_file             VARCHAR(255) NULL,
    version                 INT DEFAULT 1,
    created_at              DATETIME2 DEFAULT GETUTCDATE(),
    updated_at              DATETIME2 DEFAULT GETUTCDATE()
);

-- CRITICAL INDEXES for performance
CREATE NONCLUSTERED INDEX idx_rates_procedure_provider_payer 
    ON dbo.rates(procedure_id, provider_id, payer_id);

CREATE NONCLUSTERED INDEX idx_rates_payer_id ON dbo.rates(payer_id);
CREATE NONCLUSTERED INDEX idx_rates_provider_id ON dbo.rates(provider_id);
CREATE NONCLUSTERED INDEX idx_rates_updated_at ON dbo.rates(updated_at);
CREATE NONCLUSTERED INDEX idx_rates_payer_name ON dbo.rates(payer_name);
CREATE NONCLUSTERED INDEX idx_rates_effective_date ON dbo.rates(effective_date);

PRINT 'Created: rates table';
GO

-- ============================================================================
-- 6. USERS TABLE - User accounts with roles
-- ============================================================================
CREATE TABLE dbo.users (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    full_name           VARCHAR(255) NULL,
    role                VARCHAR(50) DEFAULT 'patient',
    provider_id         UNIQUEIDENTIFIER NULL REFERENCES dbo.providers(id) ON DELETE SET NULL,
    zip_code            VARCHAR(5) NULL,
    created_at          DATETIME2 DEFAULT GETUTCDATE(),
    updated_at          DATETIME2 DEFAULT GETUTCDATE(),
    last_login          DATETIME2 NULL,
    is_active           BIT DEFAULT 1
);

CREATE NONCLUSTERED INDEX idx_users_role ON dbo.users(role);
CREATE NONCLUSTERED INDEX idx_users_email ON dbo.users(email);

PRINT 'Created: users table';
GO

-- ============================================================================
-- 7. AUDIT_LOGS TABLE - HIPAA COMPLIANCE (APPEND-ONLY)
-- ============================================================================
CREATE TABLE dbo.audit_logs (
    id                  BIGINT PRIMARY KEY IDENTITY(1,1),
    user_id             UNIQUEIDENTIFIER NULL REFERENCES dbo.users(id) ON DELETE SET NULL,
    action              VARCHAR(50) NOT NULL,
    resource_type       VARCHAR(50) NULL,
    resource_id         UNIQUEIDENTIFIER NULL,
    changes             NVARCHAR(MAX) NULL,
    ip_address          VARCHAR(45) NULL,
    user_agent          TEXT NULL,
    created_at          DATETIME2 DEFAULT GETUTCDATE()
);

CREATE NONCLUSTERED INDEX idx_audit_logs_user_id_created_at 
    ON dbo.audit_logs(user_id, created_at DESC);
CREATE NONCLUSTERED INDEX idx_audit_logs_action ON dbo.audit_logs(action);
CREATE NONCLUSTERED INDEX idx_audit_logs_created_at ON dbo.audit_logs(created_at DESC);

PRINT 'Created: audit_logs table';
GO

-- ============================================================================
-- 8. FILE_UPLOADS TABLE - Track CSV/JSON imports
-- ============================================================================
CREATE TABLE dbo.file_uploads (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    filename            VARCHAR(255) NOT NULL,
    file_type           VARCHAR(20) NULL,
    uploaded_by         UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.users(id) ON DELETE CASCADE,
    row_count           INT DEFAULT 0,
    status              VARCHAR(50) DEFAULT 'pending',
    error_message       TEXT NULL,
    created_at          DATETIME2 DEFAULT GETUTCDATE(),
    completed_at        DATETIME2 NULL,
    storage_path        VARCHAR(255) NULL
);

CREATE NONCLUSTERED INDEX idx_file_uploads_uploaded_by ON dbo.file_uploads(uploaded_by);
CREATE NONCLUSTERED INDEX idx_file_uploads_status ON dbo.file_uploads(status);
CREATE NONCLUSTERED INDEX idx_file_uploads_created_at ON dbo.file_uploads(created_at DESC);

PRINT 'Created: file_uploads table';
GO

-- ============================================================================
-- 9. SAVED_SEARCHES TABLE - Phase 4 Feature
-- ============================================================================
CREATE TABLE dbo.saved_searches (
    id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id                 VARCHAR(255) NOT NULL,
    name                    VARCHAR(255) NOT NULL,
    description             TEXT NULL,
    search_query            NVARCHAR(MAX) NOT NULL,
    result_count            INT DEFAULT 0,
    last_executed_at        DATETIME2 NULL,
    created_at              DATETIME2 DEFAULT GETUTCDATE(),
    updated_at              DATETIME2 DEFAULT GETUTCDATE()
);

CREATE NONCLUSTERED INDEX idx_saved_searches_user_id ON dbo.saved_searches(user_id);
CREATE NONCLUSTERED INDEX idx_saved_searches_created_at ON dbo.saved_searches(created_at DESC);

PRINT 'Created: saved_searches table';
GO

-- ============================================================================
-- 10. BOOKMARKS TABLE - Phase 4 Feature
-- ============================================================================
CREATE TABLE dbo.bookmarks (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id             VARCHAR(255) NOT NULL,
    rate_id             UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.rates(id) ON DELETE CASCADE,
    notes               TEXT NULL,
    created_at          DATETIME2 DEFAULT GETUTCDATE()
);

CREATE UNIQUE NONCLUSTERED INDEX idx_bookmarks_user_id_rate_id 
    ON dbo.bookmarks(user_id, rate_id);
CREATE NONCLUSTERED INDEX idx_bookmarks_rate_id ON dbo.bookmarks(rate_id);

PRINT 'Created: bookmarks table';
GO

-- ============================================================================
-- 11. IMPORT_JOBS TABLE - Phase 4 Feature
-- ============================================================================
CREATE TABLE dbo.import_jobs (
    id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id                 VARCHAR(255) NOT NULL,
    file_name               VARCHAR(255) NOT NULL,
    file_size               INT NULL,
    file_type               VARCHAR(50) NULL,
    status                  VARCHAR(50) DEFAULT 'pending',
    total_records           INT DEFAULT 0,
    successful_records      INT DEFAULT 0,
    failed_records          INT DEFAULT 0,
    errors                  NVARCHAR(MAX) NULL,
    started_at              DATETIME2 NULL,
    completed_at            DATETIME2 NULL,
    created_at              DATETIME2 DEFAULT GETUTCDATE()
);

CREATE NONCLUSTERED INDEX idx_import_jobs_user_id ON dbo.import_jobs(user_id);
CREATE NONCLUSTERED INDEX idx_import_jobs_status ON dbo.import_jobs(status);
CREATE NONCLUSTERED INDEX idx_import_jobs_created_at ON dbo.import_jobs(created_at DESC);

PRINT 'Created: import_jobs table';
GO

-- ============================================================================
-- 12. TRIGGERS FOR AUDITING - Update timestamps
-- ============================================================================

-- Procedures updated_at trigger
CREATE OR ALTER TRIGGER tr_procedures_updated_at
ON dbo.procedures
AFTER UPDATE
AS
BEGIN
    UPDATE dbo.procedures
    SET updated_at = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END;
GO

-- Providers updated_at trigger
CREATE OR ALTER TRIGGER tr_providers_updated_at
ON dbo.providers
AFTER UPDATE
AS
BEGIN
    UPDATE dbo.providers
    SET updated_at = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END;
GO

-- Payers updated_at trigger
CREATE OR ALTER TRIGGER tr_payers_updated_at
ON dbo.payers
AFTER UPDATE
AS
BEGIN
    UPDATE dbo.payers
    SET updated_at = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END;
GO

-- Rates updated_at trigger
CREATE OR ALTER TRIGGER tr_rates_updated_at
ON dbo.rates
AFTER UPDATE
AS
BEGIN
    UPDATE dbo.rates
    SET updated_at = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END;
GO

-- Users updated_at trigger
CREATE OR ALTER TRIGGER tr_users_updated_at
ON dbo.users
AFTER UPDATE
AS
BEGIN
    UPDATE dbo.users
    SET updated_at = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END;
GO

-- Saved Searches updated_at trigger
CREATE OR ALTER TRIGGER tr_saved_searches_updated_at
ON dbo.saved_searches
AFTER UPDATE
AS
BEGIN
    UPDATE dbo.saved_searches
    SET updated_at = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END;
GO

PRINT 'Created: all update triggers';
GO

-- ============================================================================
-- 13. STORED PROCEDURES FOR COMMON OPERATIONS
-- ============================================================================

-- Search procedures by CPT code
CREATE OR ALTER PROCEDURE sp_SearchProcedures
    @cpt_code VARCHAR(10) = NULL,
    @category VARCHAR(50) = NULL
AS
BEGIN
    SELECT 
        id,
        cpt_code,
        description,
        category,
        avg_market_price,
        low_price,
        high_price,
        data_points,
        created_at,
        updated_at
    FROM dbo.procedures
    WHERE 
        ((@cpt_code IS NULL) OR (cpt_code LIKE '%' + @cpt_code + '%'))
        AND ((@category IS NULL) OR (category = @category))
    ORDER BY cpt_code;
END;
GO

-- Search rates by procedure and zip code
CREATE OR ALTER PROCEDURE sp_SearchRates
    @procedure_id UNIQUEIDENTIFIER = NULL,
    @zip_code VARCHAR(5) = NULL,
    @payer_id UNIQUEIDENTIFIER = NULL,
    @limit INT = 100,
    @offset INT = 0
AS
BEGIN
    SELECT 
        r.id,
        r.procedure_id,
        r.provider_id,
        r.payer_id,
        r.payer_name,
        r.cash_price,
        r.insurance_price,
        r.insurance_type,
        r.effective_date,
        r.expiration_date,
        p.name AS provider_name,
        p.city,
        p.state,
        p.zip_code,
        pr.cpt_code,
        pr.description
    FROM dbo.rates r
    INNER JOIN dbo.providers p ON r.provider_id = p.id
    INNER JOIN dbo.procedures pr ON r.procedure_id = pr.id
    WHERE 
        ((@procedure_id IS NULL) OR (r.procedure_id = @procedure_id))
        AND ((@zip_code IS NULL) OR (p.zip_code = @zip_code))
        AND ((@payer_id IS NULL) OR (r.payer_id = @payer_id))
        AND (p.is_active = 1)
        AND (r.effective_date <= CAST(GETUTCDATE() AS DATE))
        AND (r.expiration_date >= CAST(GETUTCDATE() AS DATE))
    ORDER BY r.cash_price ASC, r.insurance_price ASC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY;
END;
GO

-- Get procedure statistics
CREATE OR ALTER PROCEDURE sp_GetProcedureStats
    @procedure_id UNIQUEIDENTIFIER
AS
BEGIN
    SELECT 
        p.id,
        p.cpt_code,
        CAST(p.description AS VARCHAR(MAX)) AS description,
        COUNT(DISTINCT r.id) AS total_rates,
        COUNT(DISTINCT r.provider_id) AS unique_providers,
        COUNT(DISTINCT r.payer_id) AS unique_payers,
        MIN(r.cash_price) AS min_cash_price,
        MAX(r.cash_price) AS max_cash_price,
        AVG(CAST(r.cash_price AS FLOAT)) AS avg_cash_price,
        STDEV(CAST(r.cash_price AS FLOAT)) AS stddev_cash_price
    FROM dbo.procedures p
    LEFT JOIN dbo.rates r ON p.id = r.procedure_id
    WHERE p.id = @procedure_id
    GROUP BY p.id, p.cpt_code, CAST(p.description AS VARCHAR(MAX));
END;
GO

-- Insert audit log
CREATE OR ALTER PROCEDURE sp_InsertAuditLog
    @user_id UNIQUEIDENTIFIER = NULL,
    @action VARCHAR(50),
    @resource_type VARCHAR(50) = NULL,
    @resource_id UNIQUEIDENTIFIER = NULL,
    @changes NVARCHAR(MAX) = NULL,
    @ip_address VARCHAR(45) = NULL
AS
BEGIN
    INSERT INTO dbo.audit_logs (user_id, action, resource_type, resource_id, changes, ip_address)
    VALUES (@user_id, @action, @resource_type, @resource_id, @changes, @ip_address);
END;
GO

-- Get user bookmarks with details
CREATE OR ALTER PROCEDURE sp_GetUserBookmarks
    @user_id VARCHAR(255)
AS
BEGIN
    SELECT 
        b.id,
        b.user_id,
        b.rate_id,
        b.notes,
        b.created_at,
        pr.name AS provider_name,
        pr.city,
        pr.state,
        pr.zip_code,
        p.cpt_code,
        p.description,
        r.cash_price,
        r.insurance_price,
        r.payer_name
    FROM dbo.bookmarks b
    INNER JOIN dbo.rates r ON b.rate_id = r.id
    INNER JOIN dbo.providers pr ON r.provider_id = pr.id
    INNER JOIN dbo.procedures p ON r.procedure_id = p.id
    WHERE b.user_id = @user_id
    ORDER BY b.created_at DESC;
END;
GO

PRINT 'Created: all stored procedures';
GO

-- ============================================================================
-- 14. VERIFICATION AND SUMMARY
-- ============================================================================

PRINT '';
PRINT '========== DATABASE MIGRATION COMPLETE ==========';
PRINT '';
PRINT 'Created Tables:';
SELECT 
    TABLE_NAME,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) AS ColumnCount
FROM INFORMATION_SCHEMA.TABLES t
WHERE TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;

PRINT '';
PRINT 'Created Indexes:';
SELECT 
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType
FROM sys.indexes i
INNER JOIN sys.objects o ON i.object_id = o.object_id
WHERE SCHEMA_NAME(o.schema_id) = 'dbo' AND i.name IS NOT NULL
ORDER BY OBJECT_NAME(i.object_id), i.name;

PRINT '';
PRINT 'Created Stored Procedures:';
SELECT 
    OBJECT_NAME(object_id) AS ProcedureName
FROM sys.objects
WHERE type = 'P' AND name LIKE 'sp_%'
ORDER BY OBJECT_NAME(object_id);

PRINT '';
PRINT 'Created Triggers:';
SELECT 
    OBJECT_NAME(t.parent_id) AS TableName,
    t.name AS TriggerName
FROM sys.triggers t
WHERE t.parent_class = 1  -- 1 = Object or Column
ORDER BY OBJECT_NAME(t.parent_id), t.name;

PRINT '';
PRINT '========== READY FOR DATA MIGRATION ==========';
PRINT 'Next Steps:';
PRINT '1. Verify all tables and indexes created successfully';
PRINT '2. Run data migration scripts to populate reference data';
PRINT '3. Load 1M+ rates records from Supabase export';
PRINT '4. Update connection string in application to point to WEAVER';
PRINT '5. Run integration tests to verify connectivity';
PRINT '';
