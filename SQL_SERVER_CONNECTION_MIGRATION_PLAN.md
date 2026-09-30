# SQL Server Connection & Migration Strategy

## 1. SQL SERVER SETUP & CONNECTION

### 1.1 SQL Server Installation Options

#### Option A: Local SSMS (Fastest for Development)
```powershell
# If not installed, install SQL Server Express
# Download: https://www.microsoft.com/sql-server/sql-server-downloads

# Default instance settings:
# - Server Name: (local) or LOCALHOST
# - Port: 1433 (default)
# - Authentication: Mixed (SQL & Windows)
```

#### Option B: Azure SQL Database (Production-Ready)
```
Create via Azure Portal:
- Resource Group: healthcare-pricing-prod
- Server Name: healthcare-pricing-server.database.windows.net
- Database: healthcare_pricing
- Admin Login: sqladmin
- DTU Tier: Standard (S2) or Serverless
- Cost: ~$50-150/month
```

#### Option C: Docker Container (Portable)
```bash
# Run SQL Server in Docker
docker run -e "ACCEPT_EULA=Y" \
  -e "SA_PASSWORD=YourSecurePassword123!" \
  -p 1433:1433 \
  -d mcr.microsoft.com/mssql/server:2022-latest

# Connection string:
# Server=localhost;Database=healthcare_pricing;User Id=sa;Password=YourSecurePassword123!
```

---

## 2. MSSQL CONNECTION SETUP

### 2.1 Install Dependencies

```bash
cd backend
npm install mssql@11.0.0 --save
npm install --save-dev @types/mssql
```

### 2.2 Create Connection Configuration

**File**: `backend/src/config/database.ts`

```typescript
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const databaseConfig = {
  // Primary database (Supabase)
  primary: {
    type: 'supabase' as const,
    enabled: process.env.SUPABASE_ENABLED !== 'false',
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Fallback database (SQL Server)
  fallback: {
    type: 'mssql' as const,
    enabled: process.env.MSSQL_ENABLED === 'true',
    config: {
      server: process.env.MSSQL_SERVER || 'localhost',
      database: process.env.MSSQL_DATABASE || 'healthcare_pricing',
      authentication: {
        type: 'default',
        options: {
          userName: process.env.MSSQL_USER || 'sa',
          password: process.env.MSSQL_PASSWORD,
        },
      },
      options: {
        encrypt: process.env.MSSQL_ENCRYPT === 'true' || process.env.NODE_ENV === 'production',
        trustServerCertificate: process.env.NODE_ENV !== 'production',
        port: parseInt(process.env.MSSQL_PORT || '1433'),
        connectionTimeout: 10000,
        requestTimeout: 30000,
      },
    },
  },

  // Failover behavior
  failover: {
    enabled: process.env.DB_FAILOVER_ENABLED === 'true',
    healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000'),
    failureThreshold: parseInt(process.env.DB_FAILOVER_THRESHOLD || '3'),
    recoveryCheckInterval: parseInt(process.env.DB_RECOVERY_CHECK_INTERVAL || '60000'),
  },
};

export default databaseConfig;
```

### 2.3 Environment Variables

**File**: `backend/.env.local`

```bash
# ============================================================================
# PRIMARY DATABASE (Supabase - PostgreSQL)
# ============================================================================
SUPABASE_URL=https://ahkmgnkuskncqckyooqb.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ENABLED=true

# ============================================================================
# FALLBACK DATABASE (SQL Server)
# ============================================================================
# Local Development (SSMS or Docker)
MSSQL_SERVER=localhost
MSSQL_DATABASE=healthcare_pricing
MSSQL_USER=sa
MSSQL_PASSWORD=YourSecurePassword123!
MSSQL_PORT=1433
MSSQL_ENCRYPT=false
MSSQL_ENABLED=true

# Azure SQL (Production)
# MSSQL_SERVER=healthcare-pricing-server.database.windows.net
# MSSQL_DATABASE=healthcare_pricing
# MSSQL_USER=sqladmin@healthcare-pricing-server
# MSSQL_PASSWORD=YourSecurePassword123!
# MSSQL_PORT=1433
# MSSQL_ENCRYPT=true

# ============================================================================
# FAILOVER CONFIGURATION
# ============================================================================
DB_FAILOVER_ENABLED=true
DB_HEALTH_CHECK_INTERVAL=30000
DB_FAILOVER_THRESHOLD=3
DB_RECOVERY_CHECK_INTERVAL=60000
```

---

## 3. DATABASE SCHEMA MIGRATION

### 3.1 PostgreSQL (Supabase) → MSSQL Mapping

| PostgreSQL Feature | MSSQL Equivalent | Notes |
|-------------------|-----------------|-------|
| `UUID` | `UNIQUEIDENTIFIER` | Built-in UUID support |
| `SERIAL` | `INT IDENTITY(1,1)` | Auto-incrementing |
| `BIGSERIAL` | `BIGINT IDENTITY(1,1)` | Large auto-increment |
| `TEXT` | `NVARCHAR(MAX)` | Unlimited text |
| `VARCHAR(n)` | `VARCHAR(n)` | Fixed length string |
| `JSONB` | `NVARCHAR(MAX)` | Store as JSON string |
| `BOOLEAN` | `BIT` | 0=false, 1=true |
| `TIMESTAMP` | `DATETIMEOFFSET` | With timezone support |
| `TIMESTAMP(0)` | `DATETIME2(0)` | Without timezone |
| `INET` | `VARCHAR(45)` | IP address storage |
| `UUID_GENERATE_V4()` | `NEWID()` | Generate UUID |
| `NOW()` | `GETUTCDATE()` | Current timestamp |

### 3.2 MSSQL Schema Creation Script

**File**: `backend/src/migrations/sql-server/001_initial_schema.sql`

```sql
-- ============================================================================
-- HEALTHCARE PRICE TRANSPARENCY - SQL SERVER SCHEMA
-- Converted from PostgreSQL (Supabase)
-- ============================================================================

-- ============================================================================
-- 1. PROCEDURES TABLE
-- ============================================================================
CREATE TABLE procedures (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  cpt_code VARCHAR(10) NOT NULL UNIQUE,
  description NVARCHAR(MAX) NOT NULL,
  category VARCHAR(50),
  avg_market_price NUMERIC(10, 2),
  low_price NUMERIC(10, 2),
  high_price NUMERIC(10, 2),
  data_points INT DEFAULT 0,
  created_at DATETIMEOFFSET DEFAULT GETUTCDATE(),
  updated_at DATETIMEOFFSET DEFAULT GETUTCDATE()
);

CREATE INDEX idx_procedures_cpt_code ON procedures(cpt_code);
CREATE INDEX idx_procedures_category ON procedures(category);

-- ============================================================================
-- 2. PROVIDERS TABLE
-- ============================================================================
CREATE TABLE providers (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(255) NOT NULL,
  npi VARCHAR(10) UNIQUE,
  provider_type VARCHAR(50),
  address NVARCHAR(MAX),
  city VARCHAR(100),
  zip_code VARCHAR(5),
  state VARCHAR(2),
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  phone VARCHAR(20),
  website VARCHAR(255),
  is_active BIT DEFAULT 1,
  created_at DATETIMEOFFSET DEFAULT GETUTCDATE(),
  updated_at DATETIMEOFFSET DEFAULT GETUTCDATE()
);

CREATE INDEX idx_providers_zip_code ON providers(zip_code);
CREATE INDEX idx_providers_state ON providers(state);
CREATE INDEX idx_providers_npi ON providers(npi);
CREATE INDEX idx_providers_is_active ON providers(is_active);

-- ============================================================================
-- 3. PAYERS TABLE
-- ============================================================================
CREATE TABLE payers (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50),
  is_active BIT DEFAULT 1,
  created_at DATETIMEOFFSET DEFAULT GETUTCDATE(),
  updated_at DATETIMEOFFSET DEFAULT GETUTCDATE()
);

CREATE INDEX idx_payers_type ON payers(type);

-- ============================================================================
-- 4. RATES TABLE (1M+ records, denormalized)
-- ============================================================================
CREATE TABLE rates (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  procedure_id UNIQUEIDENTIFIER NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  provider_id UNIQUEIDENTIFIER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  payer_id UNIQUEIDENTIFIER NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
  payer_name VARCHAR(255) NOT NULL,
  cash_price NUMERIC(10, 2),
  insurance_price NUMERIC(10, 2),
  insurance_type VARCHAR(50),
  effective_date DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
  expiration_date DATE DEFAULT '2099-12-31',
  source_file VARCHAR(255),
  version INT DEFAULT 1,
  created_at DATETIMEOFFSET DEFAULT GETUTCDATE(),
  updated_at DATETIMEOFFSET DEFAULT GETUTCDATE()
);

-- Critical indexes for performance
CREATE INDEX idx_rates_procedure_provider_payer 
  ON rates(procedure_id, provider_id, payer_id);
CREATE INDEX idx_rates_provider_id ON rates(provider_id);
CREATE INDEX idx_rates_payer_id ON rates(payer_id);
CREATE INDEX idx_rates_updated_at ON rates(updated_at);

-- ============================================================================
-- 5. USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'patient',
  provider_id UNIQUEIDENTIFIER REFERENCES providers(id) ON DELETE SET NULL,
  zip_code VARCHAR(5),
  created_at DATETIMEOFFSET DEFAULT GETUTCDATE(),
  last_login DATETIMEOFFSET,
  is_active BIT DEFAULT 1
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- 6. AUDIT_LOGS TABLE (Append-only)
-- ============================================================================
CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY IDENTITY(1,1),
  user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UNIQUEIDENTIFIER,
  changes NVARCHAR(MAX), -- JSON string
  ip_address VARCHAR(45),
  user_agent NVARCHAR(MAX),
  created_at DATETIMEOFFSET DEFAULT GETUTCDATE()
);

CREATE INDEX idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- 7. SAVED_SEARCHES TABLE
-- ============================================================================
CREATE TABLE saved_searches (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id VARCHAR(255) NOT NULL, -- Can be non-UUID for flexibility
  name VARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  search_query NVARCHAR(MAX) NOT NULL, -- JSON string
  result_count INT DEFAULT 0,
  last_executed_at DATETIMEOFFSET,
  created_at DATETIMEOFFSET DEFAULT GETUTCDATE(),
  updated_at DATETIMEOFFSET DEFAULT GETUTCDATE()
);

CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_created_at ON saved_searches(created_at DESC);

-- ============================================================================
-- 8. BOOKMARKS TABLE
-- ============================================================================
CREATE TABLE bookmarks (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id VARCHAR(255) NOT NULL,
  rate_id UNIQUEIDENTIFIER NOT NULL REFERENCES rates(id) ON DELETE CASCADE,
  notes NVARCHAR(MAX),
  created_at DATETIMEOFFSET DEFAULT GETUTCDATE(),
  UNIQUE(user_id, rate_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_rate_id ON bookmarks(rate_id);

-- ============================================================================
-- 9. IMPORT_JOBS TABLE
-- ============================================================================
CREATE TABLE import_jobs (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  file_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  total_records INT DEFAULT 0,
  successful_records INT DEFAULT 0,
  failed_records INT DEFAULT 0,
  errors NVARCHAR(MAX), -- JSON string
  started_at DATETIMEOFFSET,
  completed_at DATETIMEOFFSET,
  created_at DATETIMEOFFSET DEFAULT GETUTCDATE()
);

CREATE INDEX idx_import_jobs_user_id ON import_jobs(user_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_created_at ON import_jobs(created_at DESC);

-- ============================================================================
-- SCHEMA VERIFICATION
-- ============================================================================
SELECT 
  TABLE_NAME,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) AS column_count
FROM INFORMATION_SCHEMA.TABLES t
WHERE TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;
```

### 3.3 Migration Script Execution

**File**: `backend/src/migrations/sql-server/migrate.ts`

```typescript
import { ConnectionPool } from 'mssql';
import fs from 'fs';
import path from 'path';
import { logger } from '../../middleware/logger';

export async function runMigrations(pool: ConnectionPool): Promise<void> {
  try {
    logger.info('Starting MSSQL schema migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split into individual statements (SQL Server uses GO as batch separator)
    const statements = migrationSQL.split('GO').map(s => s.trim()).filter(s => s);

    for (const statement of statements) {
      logger.info(`Executing: ${statement.substring(0, 50)}...`);
      await pool.request().query(statement);
    }

    logger.info('✅ Schema migration completed successfully');
  } catch (error) {
    logger.error('❌ Schema migration failed:', error);
    throw error;
  }
}
```

---

## 4. DATA MIGRATION STRATEGY

### 4.1 Three-Tier Migration Approach

```
TIER 1: One-Time Initial Load (Reference Data)
├─ Procedures (static, ~100 records)
├─ Providers (reference, ~1K records)
└─ Payers (reference, ~50 records)

TIER 2: Historical Data (Rates)
├─ Full export from Supabase (1M+ records)
├─ Batch insert into MSSQL
└─ Validation & reconciliation

TIER 3: Active Data (User-Generated)
├─ Saved Searches
├─ Bookmarks
├─ Import Jobs
└─ Audit Logs
```

### 4.2 Migration Script

**File**: `backend/src/migrations/sql-server/dataMigration.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { ConnectionPool, IResult } from 'mssql';
import { logger } from '../../middleware/logger';

export class DataMigration {
  constructor(
    private supabase: SupabaseClient,
    private mssqlPool: ConnectionPool
  ) {}

  async migrateProcedures(): Promise<number> {
    logger.info('Migrating procedures...');
    
    const { data: procedures, error } = await this.supabase
      .from('procedures')
      .select('*');

    if (error) throw error;

    const request = this.mssqlPool.request();
    let inserted = 0;

    for (const proc of procedures) {
      await request.input('id', proc.id)
        .input('cpt_code', proc.cpt_code)
        .input('description', proc.description)
        .input('category', proc.category)
        .input('avg_market_price', proc.avg_market_price)
        .input('low_price', proc.low_price)
        .input('high_price', proc.high_price)
        .input('data_points', proc.data_points)
        .query(`
          INSERT INTO procedures 
          (id, cpt_code, description, category, avg_market_price, low_price, high_price, data_points)
          VALUES (@id, @cpt_code, @description, @category, @avg_market_price, @low_price, @high_price, @data_points)
        `);
      inserted++;
    }

    logger.info(`✅ Migrated ${inserted} procedures`);
    return inserted;
  }

  async migrateProviders(): Promise<number> {
    logger.info('Migrating providers...');
    
    const { data: providers, error } = await this.supabase
      .from('providers')
      .select('*');

    if (error) throw error;

    const request = this.mssqlPool.request();
    let inserted = 0;

    for (const prov of providers) {
      await request.input('id', prov.id)
        .input('name', prov.name)
        .input('npi', prov.npi)
        .input('provider_type', prov.provider_type)
        .input('address', prov.address)
        .input('city', prov.city)
        .input('zip_code', prov.zip_code)
        .input('state', prov.state)
        .input('latitude', prov.latitude)
        .input('longitude', prov.longitude)
        .input('phone', prov.phone)
        .input('website', prov.website)
        .input('is_active', prov.is_active ? 1 : 0)
        .query(`
          INSERT INTO providers 
          (id, name, npi, provider_type, address, city, zip_code, state, latitude, longitude, phone, website, is_active)
          VALUES (@id, @name, @npi, @provider_type, @address, @city, @zip_code, @state, @latitude, @longitude, @phone, @website, @is_active)
        `);
      inserted++;
    }

    logger.info(`✅ Migrated ${inserted} providers`);
    return inserted;
  }

  async migratePayers(): Promise<number> {
    logger.info('Migrating payers...');
    
    const { data: payers, error } = await this.supabase
      .from('payers')
      .select('*');

    if (error) throw error;

    const request = this.mssqlPool.request();
    let inserted = 0;

    for (const payer of payers) {
      await request.input('id', payer.id)
        .input('name', payer.name)
        .input('type', payer.type)
        .input('is_active', payer.is_active ? 1 : 0)
        .query(`
          INSERT INTO payers (id, name, type, is_active)
          VALUES (@id, @name, @type, @is_active)
        `);
      inserted++;
    }

    logger.info(`✅ Migrated ${inserted} payers`);
    return inserted;
  }

  async migrateRates(batchSize: number = 1000): Promise<number> {
    logger.info(`Migrating rates (batch size: ${batchSize})...`);
    
    let offset = 0;
    let totalMigrated = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: rates, error, count } = await this.supabase
        .from('rates')
        .select('*', { count: 'exact' })
        .range(offset, offset + batchSize - 1);

      if (error) {
        logger.error(`Error fetching rates at offset ${offset}:`, error);
        break;
      }

      if (!rates || rates.length === 0) {
        hasMore = false;
        break;
      }

      const request = this.mssqlPool.request();
      const valuesList = rates.map((rate, idx) => {
        request
          .input(`id_${idx}`, rate.id)
          .input(`procedure_id_${idx}`, rate.procedure_id)
          .input(`provider_id_${idx}`, rate.provider_id)
          .input(`payer_id_${idx}`, rate.payer_id)
          .input(`payer_name_${idx}`, rate.payer_name)
          .input(`cash_price_${idx}`, rate.cash_price)
          .input(`insurance_price_${idx}`, rate.insurance_price)
          .input(`insurance_type_${idx}`, rate.insurance_type);

        return `(@id_${idx}, @procedure_id_${idx}, @provider_id_${idx}, @payer_id_${idx}, @payer_name_${idx}, @cash_price_${idx}, @insurance_price_${idx}, @insurance_type_${idx})`;
      });

      const query = `
        INSERT INTO rates 
        (id, procedure_id, provider_id, payer_id, payer_name, cash_price, insurance_price, insurance_type)
        VALUES ${valuesList.join(', ')}
      `;

      await request.query(query);

      totalMigrated += rates.length;
      offset += batchSize;
      logger.info(`Progress: ${totalMigrated} rates migrated...`);
    }

    logger.info(`✅ Migrated ${totalMigrated} rates total`);
    return totalMigrated;
  }

  async runFullMigration(): Promise<void> {
    try {
      logger.info('====== STARTING FULL DATA MIGRATION ======');

      const stats = {
        procedures: await this.migrateProcedures(),
        providers: await this.migrateProviders(),
        payers: await this.migratePayers(),
        rates: await this.migrateRates(5000), // Larger batch for rates
      };

      logger.info('====== MIGRATION COMPLETE =====', stats);
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }
}
```

---

## 5. TESTING & VALIDATION

### 5.1 Pre-Migration Validation

**File**: `backend/src/migrations/sql-server/validate.ts`

```typescript
export class ValidationService {
  async validateSchemaCompleteness(): Promise<boolean> {
    // Check all tables exist
    // Check all columns mapped correctly
    // Check all indexes created
    return true;
  }

  async validateDataIntegrity(): Promise<boolean> {
    // Compare row counts: Supabase vs MSSQL
    // Spot-check random records
    // Verify UUID consistency
    // Check foreign key constraints
    return true;
  }

  async validatePerformance(): Promise<boolean> {
    // Run sample queries on both databases
    // Compare response times
    // Check query plans
    return true;
  }
}
```

### 5.2 Reconciliation Strategy

```sql
-- After migration, verify counts match
SELECT 'procedures' as table_name, COUNT(*) as count FROM procedures
UNION ALL
SELECT 'providers', COUNT(*) FROM providers
UNION ALL
SELECT 'payers', COUNT(*) FROM payers
UNION ALL
SELECT 'rates', COUNT(*) FROM rates
UNION ALL
SELECT 'users', COUNT(*) FROM users
```

---

## 6. MIGRATION EXECUTION PLAN

### Step-by-Step Timeline (with SQL Server local instance)

#### Week 1: Preparation
- **Day 1**: Install SQL Server locally or set up Docker container
- **Day 2**: Create MSSQL schema using migration script
- **Day 3**: Test connection from Node.js application
- **Day 4**: Validate schema matches Supabase exactly
- **Day 5**: Run dry-run migration on test data

#### Week 2: Migration & Testing
- **Day 1**: Perform full data migration (reference data + rates)
- **Day 2**: Validate data integrity and counts
- **Day 3**: Implement fallback connection manager
- **Day 4**: Run end-to-end tests with MSSQL
- **Day 5**: Performance benchmarking

#### Week 3: Deployment
- **Day 1**: Deploy connection manager to staging
- **Day 2**: Monitor 24 hours in shadow mode (logs queries to both DBs)
- **Day 3**: Enable automatic failover in test
- **Day 4**: Deploy to production with MSSQL disabled
- **Day 5**: Monitor, document, create runbook

---

## 7. ROLLBACK PROCEDURE

If issues occur during migration:

```bash
# Option 1: Revert to Supabase only
DB_FAILOVER_ENABLED=false
MSSQL_ENABLED=false
# Restart application

# Option 2: Drop MSSQL tables and restart
# Run in MSSQL:
DROP TABLE bookmarks;
DROP TABLE saved_searches;
DROP TABLE import_jobs;
DROP TABLE audit_logs;
DROP TABLE rates;
DROP TABLE payers;
DROP TABLE providers;
DROP TABLE procedures;
DROP TABLE users;
```

---

## 8. PRODUCTION CHECKLIST

- [ ] SQL Server instance created and accessible
- [ ] Network connectivity verified (firewall rules)
- [ ] Connection pooling configured (min: 5, max: 20)
- [ ] Indexes created on all critical columns
- [ ] Backup strategy implemented
- [ ] Data migration successfully tested
- [ ] Rollback procedure documented
- [ ] Team trained on failover behavior
- [ ] Monitoring alerts configured
- [ ] Logging configured for both databases
- [ ] Performance benchmarks acceptable
- [ ] Audit trails validated
- [ ] Encryption configured
- [ ] Connection tested from production environment

---

## 9. ENVIRONMENT-SPECIFIC SETUP

### Local Development (Docker)
```bash
# Start SQL Server
docker-compose up sqlserver

# In docker-compose.yml:
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: DevPassword123!
      ACCEPT_EULA: Y
    ports:
      - "1433:1433"
    volumes:
      - sqlserver_data:/var/opt/mssql
```

### Azure SQL (Production)
```bash
# Create via Azure CLI
az sql server create \
  --name healthcare-pricing-server \
  --resource-group healthcare-pricing-prod \
  --location eastus \
  --admin-user sqladmin \
  --admin-password YourSecurePassword123!

az sql db create \
  --name healthcare_pricing \
  --server healthcare-pricing-server \
  --resource-group healthcare-pricing-prod \
  --service-objective S2
```

---

## 10. ESTIMATED COSTS

### SQL Server Licensing
- **Local SSMS (Free)**: $0
- **Docker Container (Free)**: $0
- **Azure SQL Server (Production)**:
  - Standard Tier S2: ~$145/month
  - Serverless (pay-per-use): ~$50-80/month

### Migration Effort
- **Schema Creation**: 2 hours
- **Data Migration**: 4 hours
- **Testing & Validation**: 8 hours
- **Connection Manager**: 6 hours
- **Total**: ~20 hours

---

## 11. NEXT STEPS

1. **Confirm SQL Server location**: Local, Docker, or Azure?
2. **Confirm failover strategy**: Automatic, manual, or hybrid?
3. **Ready to implement Phase 1**?

Would you like me to proceed with implementing the connection infrastructure?
