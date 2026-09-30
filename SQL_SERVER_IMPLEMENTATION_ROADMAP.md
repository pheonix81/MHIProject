# SQL Server Integration - Implementation Roadmap

## QUICK START (Choose Your Setup)

### Option 1: Local SQL Server (Fastest Setup)
```powershell
# 1. Download SQL Server 2022 Express
# https://www.microsoft.com/sql-server/sql-server-downloads

# 2. Run installer (use default settings)
# 3. Install SQL Server Management Studio (SSMS)
# 4. Connect: Server = (local), Auth = Windows or Mixed

# Environment:
MSSQL_SERVER=localhost
MSSQL_USER=sa
MSSQL_PASSWORD=
MSSQL_ENABLED=true
```

### Option 2: Docker (Most Portable)
```bash
cd backend
docker run -e "ACCEPT_EULA=Y" \
  -e "SA_PASSWORD=Dev123456!" \
  -p 1433:1433 \
  -d mcr.microsoft.com/mssql/server:2022-latest

# Environment:
MSSQL_SERVER=localhost
MSSQL_USER=sa
MSSQL_PASSWORD=Dev123456!
MSSQL_ENABLED=true
```

### Option 3: Azure Cloud (Production)
```bash
# Create resource group
az group create --name healthcare-pricing --location eastus

# Create SQL Server
az sql server create \
  --name healthcare-pricing \
  --resource-group healthcare-pricing \
  --admin-user sqladmin \
  --admin-password YourSecure123!

# Create database
az sql db create \
  --name healthcare_pricing \
  --server healthcare-pricing \
  --resource-group healthcare-pricing \
  --service-objective S2

# Environment:
MSSQL_SERVER=healthcare-pricing.database.windows.net
MSSQL_USER=sqladmin@healthcare-pricing
MSSQL_PASSWORD=YourSecure123!
MSSQL_ENABLED=true
```

---

## IMPLEMENTATION PHASES

### Phase 1: Dependencies & Configuration (30 minutes)

**Step 1.1**: Install MSSQL driver
```bash
cd backend
npm install mssql
npm install --save-dev @types/mssql
```

**Step 1.2**: Update `.env.local`
```bash
# Add these to existing .env.local
MSSQL_SERVER=localhost
MSSQL_DATABASE=healthcare_pricing
MSSQL_USER=sa
MSSQL_PASSWORD=Dev123456!
MSSQL_PORT=1433
MSSQL_ENCRYPT=false
MSSQL_ENABLED=true
DB_FAILOVER_ENABLED=false
```

**Step 1.3**: Create configuration file
- Copy the database config from SQL_SERVER_CONNECTION_MIGRATION_PLAN.md
- Save as `backend/src/config/database.ts`

---

### Phase 2: Connection Manager (1-2 hours)

**Step 2.1**: Create MSSQL connection pool
**File**: `backend/src/db/mssqlPool.ts`
```typescript
import sql from 'mssql';
import { databaseConfig } from '../config/database';
import { logger } from '../middleware/logger';

let mssqlPool: sql.ConnectionPool | null = null;

export async function initMSSQLPool(): Promise<sql.ConnectionPool> {
  if (mssqlPool) return mssqlPool;

  if (!databaseConfig.fallback.enabled) {
    throw new Error('MSSQL is not enabled');
  }

  try {
    mssqlPool = new sql.ConnectionPool(databaseConfig.fallback.config);
    await mssqlPool.connect();
    logger.info('✅ MSSQL connection pool established');
    return mssqlPool;
  } catch (error) {
    logger.error('❌ Failed to connect to MSSQL:', error);
    throw error;
  }
}

export function getMSSQLPool(): sql.ConnectionPool {
  if (!mssqlPool) {
    throw new Error('MSSQL pool not initialized');
  }
  return mssqlPool;
}

export async function closeMSSQLPool(): Promise<void> {
  if (mssqlPool) {
    await mssqlPool.close();
    mssqlPool = null;
    logger.info('MSSQL pool closed');
  }
}
```

**Step 2.2**: Create connection manager
**File**: `backend/src/db/connectionManager.ts`
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import sql from 'mssql';
import { logger } from '../middleware/logger';

type DatabaseType = 'supabase' | 'mssql';

interface QueryResult {
  success: boolean;
  data?: any;
  error?: any;
  source: DatabaseType;
}

export class ConnectionManager {
  private supabaseClient: SupabaseClient;
  private mssqlPool: sql.ConnectionPool;
  private activeDatabase: DatabaseType = 'supabase';
  private supabaseHealthy: boolean = false;
  private mssqlHealthy: boolean = false;

  constructor(supabase: SupabaseClient, mssqlPool: sql.ConnectionPool) {
    this.supabaseClient = supabase;
    this.mssqlPool = mssqlPool;
  }

  async executeQuery(type: string, operation: (client: any) => Promise<any>): Promise<QueryResult> {
    try {
      // Try primary database
      if (this.activeDatabase === 'supabase') {
        const result = await operation(this.supabaseClient);
        return { success: true, data: result, source: 'supabase' };
      } else {
        const result = await operation(this.mssqlPool);
        return { success: true, data: result, source: 'mssql' };
      }
    } catch (error) {
      logger.error(`Query failed on ${this.activeDatabase}:`, error);
      
      // If primary fails and fallback available, try fallback
      if (this.activeDatabase === 'supabase' && this.mssqlHealthy) {
        logger.warn('Supabase failed, attempting fallback to MSSQL');
        this.activeDatabase = 'mssql';
        try {
          const result = await operation(this.mssqlPool);
          return { success: true, data: result, source: 'mssql' };
        } catch (fallbackError) {
          return { success: false, error: fallbackError, source: 'mssql' };
        }
      }

      return { success: false, error, source: this.activeDatabase };
    }
  }

  setActiveDatabase(db: DatabaseType): void {
    this.activeDatabase = db;
    logger.info(`Active database switched to: ${db}`);
  }

  getActiveDatabase(): DatabaseType {
    return this.activeDatabase;
  }

  setHealthStatus(database: DatabaseType, healthy: boolean): void {
    if (database === 'supabase') {
      this.supabaseHealthy = healthy;
    } else {
      this.mssqlHealthy = healthy;
    }
    logger.info(`${database} health: ${healthy ? '✅ healthy' : '❌ unhealthy'}`);
  }

  getHealthStatus(): { supabase: boolean; mssql: boolean; active: DatabaseType } {
    return {
      supabase: this.supabaseHealthy,
      mssql: this.mssqlHealthy,
      active: this.activeDatabase,
    };
  }
}

export let connectionManager: ConnectionManager | null = null;

export function initConnectionManager(supabase: SupabaseClient, mssqlPool: sql.ConnectionPool): void {
  connectionManager = new ConnectionManager(supabase, mssqlPool);
}

export function getConnectionManager(): ConnectionManager {
  if (!connectionManager) {
    throw new Error('Connection manager not initialized');
  }
  return connectionManager;
}
```

---

### Phase 3: Schema Migration (45 minutes)

**Step 3.1**: Create schema file
**File**: `backend/src/migrations/mssql/001_initial_schema.sql`
- Copy content from SQL_SERVER_CONNECTION_MIGRATION_PLAN.md section 3.2

**Step 3.2**: Create migration runner
**File**: `backend/src/migrations/mssql/runMigrations.ts`
```typescript
import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { logger } from '../../middleware/logger';

export async function runSchemaCreation(pool: sql.ConnectionPool): Promise<void> {
  try {
    logger.info('Creating MSSQL schema...');

    const schemaPath = path.join(__dirname, '001_initial_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Split by GO (MSSQL batch separator)
    const statements = schemaSql
      .split('\nGO\n')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      await pool.request().query(statement);
    }

    logger.info('✅ Schema created successfully');
  } catch (error) {
    logger.error('Schema creation failed:', error);
    throw error;
  }
}
```

**Step 3.3**: Execute in server startup
**File**: `backend/src/server.ts` (update)
```typescript
import { runSchemaCreation } from './migrations/mssql/runMigrations';

// After MSSQL pool connection:
if (process.env.MSSQL_ENABLED === 'true') {
  await runSchemaCreation(mssqlPool);
}
```

---

### Phase 4: Data Migration (2 hours)

**Step 4.1**: Create data migration worker
**File**: `backend/src/migrations/mssql/dataMigration.ts`
- Copy content from SQL_SERVER_CONNECTION_MIGRATION_PLAN.md section 4.2

**Step 4.2**: Create CLI command
**File**: `backend/src/scripts/migrate-to-mssql.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
import sql from 'mssql';
import { databaseConfig } from '../config/database';
import { DataMigration } from '../migrations/mssql/dataMigration';
import { logger } from '../middleware/logger';

async function main() {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      databaseConfig.primary.url!,
      databaseConfig.primary.serviceKey!
    );

    // Initialize MSSQL pool
    const mssqlPool = new sql.ConnectionPool(databaseConfig.fallback.config);
    await mssqlPool.connect();

    // Run migration
    const migration = new DataMigration(supabase, mssqlPool);
    await migration.runFullMigration();

    await mssqlPool.close();
    logger.info('Migration completed');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
```

**Step 4.3**: Add to package.json scripts
```json
{
  "scripts": {
    "migrate:mssql": "ts-node -r dotenv/config src/scripts/migrate-to-mssql.ts"
  }
}
```

**Step 4.4**: Run migration
```bash
npm run migrate:mssql
```

---

### Phase 5: Health Checks (1 hour)

**File**: `backend/src/db/healthCheck.ts`
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import sql from 'mssql';
import { logger } from '../middleware/logger';

export class HealthCheckService {
  constructor(
    private supabase: SupabaseClient,
    private mssqlPool: sql.ConnectionPool
  ) {}

  async checkSupabaseHealth(): Promise<boolean> {
    try {
      await this.supabase.from('procedures').select('COUNT(*)').limit(1);
      return true;
    } catch (error) {
      logger.warn('Supabase health check failed:', error);
      return false;
    }
  }

  async checkMSSQLHealth(): Promise<boolean> {
    try {
      await this.mssqlPool.request().query('SELECT 1');
      return true;
    } catch (error) {
      logger.warn('MSSQL health check failed:', error);
      return false;
    }
  }

  async monitorHealth(intervalMs: number = 30000): Promise<void> {
    setInterval(async () => {
      const supabaseOk = await this.checkSupabaseHealth();
      const mssqlOk = await this.checkMSSQLHealth();

      logger.info('Health check results', {
        supabase: supabaseOk ? '✅' : '❌',
        mssql: mssqlOk ? '✅' : '❌',
      });
    }, intervalMs);
  }
}
```

---

### Phase 6: API Endpoints (30 minutes)

**Update**: `backend/src/app.ts`
```typescript
// Add health check endpoint
app.get('/api/v1/admin/database-health', async (_req: Request, res: Response) => {
  try {
    const health = getConnectionManager().getHealthStatus();
    res.json({
      success: true,
      data: {
        supabase: health.supabase ? 'healthy' : 'unhealthy',
        mssql: health.mssql ? 'healthy' : 'unhealthy',
        activeDatabase: health.active,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
    });
  }
});
```

---

## TESTING CHECKLIST

- [ ] Local MSSQL instance running
- [ ] Connection successful from Node.js
- [ ] Schema created without errors
- [ ] Data migration completed
- [ ] Row counts match Supabase
- [ ] Health checks passing
- [ ] Queries execute on MSSQL
- [ ] Queries execute on Supabase
- [ ] Failover works manually
- [ ] Performance acceptable

---

## MONITORING COMMANDS

```bash
# Check server status
curl http://localhost:3001/api/v1/admin/database-health

# View connection logs
tail -f logs/application.log | grep "database\|health"

# Monitor both databases
watch -n 5 'curl -s http://localhost:3001/api/v1/admin/database-health | jq'
```

---

## SUCCESS CRITERIA

✅ Both databases connected and healthy
✅ Data synchronized successfully
✅ All queries work on both databases
✅ Automatic failover functional
✅ Performance within acceptable range
✅ No data loss or corruption
✅ Audit logs functioning

Ready to start? React with your setup choice (Local/Docker/Azure) and I'll give you the exact commands!
