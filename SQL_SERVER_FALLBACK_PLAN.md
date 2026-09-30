# SQL Server Fallback Architecture Plan

## 1. CURRENT ARCHITECTURE

### Primary: Supabase (PostgreSQL)
- **Client**: `@supabase/supabase-js` 
- **Location**: [backend/src/db/client.ts](backend/src/db/client.ts)
- **Connection**: HTTP REST API + WebSockets
- **Pattern**: Direct Supabase client usage across services
- **Risk**: Single provider dependency

### Database Usage Patterns
```
Services → Supabase Client → PostgreSQL (Supabase)
            └─ Direct query execution
            └─ No abstraction layer
            └─ No fallback mechanism
```

---

## 2. PROPOSED FALLBACK ARCHITECTURE

### Two-Tier Connection Strategy

```
Application Requests
    ↓
Database Abstraction Layer (NEW)
    ├─ Connection Manager
    │   ├─ Supabase Connection (PRIMARY)
    │   └─ SQL Server Connection (FALLBACK)
    ├─ Health Check Service (monitors both)
    ├─ Failover Circuit Breaker
    └─ Query Router (directs to active DB)
```

### Files to Create/Modify

```
backend/src/
├── db/
│   ├── client.ts (EXISTING - update to support fallback)
│   ├── connectionManager.ts (NEW)
│   ├── connectionPool.ts (NEW)
│   ├── healthCheck.ts (NEW)
│   ├── circuitBreaker.ts (NEW)
│   └── queryAdapter.ts (NEW - abstracting SQL differences)
├── types/
│   └── database.ts (NEW - shared types)
├── config/
│   └── database.ts (NEW - connection configuration)
└── middleware/
    └── databaseHealth.ts (NEW - health check endpoint)
```

---

## 3. IMPLEMENTATION PHASES

### PHASE 1: Foundation (2-3 hours)
**Goal**: Add MSSQL infrastructure without changing existing code

#### Step 1.1: Install Dependencies
```bash
npm install mssql@latest pg-types
npm install --save-dev @types/mssql
```

#### Step 1.2: Create Database Configuration
**New file**: `backend/src/config/database.ts`
```typescript
export const databaseConfig = {
  primary: {
    type: 'supabase',
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  fallback: {
    type: 'mssql',
    server: process.env.MSSQL_SERVER || 'localhost',
    database: process.env.MSSQL_DATABASE || 'healthcare_pricing',
    authentication: {
      type: 'default',
      options: {
        userName: process.env.MSSQL_USER,
        password: process.env.MSSQL_PASSWORD,
      },
    },
    options: {
      encrypt: true,
      trustServerCertificate: process.env.NODE_ENV !== 'production',
      port: parseInt(process.env.MSSQL_PORT || '1433'),
    },
  },
};
```

#### Step 1.3: Create Connection Manager
**New file**: `backend/src/db/connectionManager.ts`
```typescript
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import ConnectionPool from 'mssql';

interface DatabaseConnection {
  type: 'supabase' | 'mssql';
  client: SupabaseClient | ConnectionPool;
  isHealthy: boolean;
  lastHealthCheck: Date;
}

export class ConnectionManager {
  private primaryConnection: DatabaseConnection | null = null;
  private fallbackConnection: DatabaseConnection | null = null;
  private activeConnection: DatabaseConnection | null = null;

  async initialize(): Promise<void> {
    // Initialize both connections
    // Set activeConnection to whichever is healthy
  }

  async executeQuery(query: any): Promise<any> {
    // Route query to active connection
  }

  async failover(): Promise<void> {
    // Switch from primary to fallback
  }
}
```

#### Step 1.4: Create Health Check Service
**New file**: `backend/src/db/healthCheck.ts`
```typescript
export class HealthCheckService {
  async checkSupabaseHealth(): Promise<boolean> {
    // Ping Supabase and verify connection
  }

  async checkMSSQLHealth(): Promise<boolean> {
    // Ping MSSQL Server and verify connection
  }

  async monitorConnections(): Promise<void> {
    // Continuous health monitoring (every 30 seconds)
  }
}
```

### PHASE 2: Query Adaptation (2-3 hours)
**Goal**: Create unified query interface that works for both databases

#### Step 2.1: Create Query Adapter
**New file**: `backend/src/db/queryAdapter.ts`
```typescript
export class QueryAdapter {
  // Methods to convert queries between PostgreSQL (Supabase) and MSSQL
  
  convertSelectQuery(query: any): any {
    // Handle differences in:
    // - UUID handling (Supabase uses native UUID, MSSQL converts to string)
    // - JSON types (JSONB vs nvarchar)
    // - Pagination (LIMIT/OFFSET vs OFFSET/FETCH)
  }

  convertInsertQuery(query: any): any {
    // Adapt INSERT statements
  }

  convertUpdateQuery(query: any): any {
    // Adapt UPDATE statements
  }

  normalizeResults(results: any, type: 'supabase' | 'mssql'): any {
    // Convert results to uniform structure
    // Handle type differences
  }
}
```

#### Step 2.2: Create Circuit Breaker
**New file**: `backend/src/db/circuitBreaker.ts`
```typescript
enum CircuitState {
  CLOSED,    // Using primary
  OPEN,      // Switched to fallback
  HALF_OPEN, // Testing if primary recovered
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: Date | null = null;

  async executeWithFallback(operation: () => Promise<any>): Promise<any> {
    if (this.state === CircuitState.OPEN) {
      // Use fallback connection
      return this.executeFallback(operation);
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (this.shouldTriggertFailover()) {
        this.state = CircuitState.OPEN;
        // Attempt fallback
        return this.executeFallback(operation);
      }
      throw error;
    }
  }
}
```

### PHASE 3: Service Layer Updates (1-2 hours)
**Goal**: Update services to use abstraction layer

#### Step 3.1: Update SearchService
```typescript
// Current:
const { data } = await supabase.from('rates').select(...);

// New:
const { data } = await databaseManager.query({
  type: 'select',
  table: 'rates',
  ...
});
```

#### Services to Update:
- SearchService
- BenchmarkService
- EstimateService
- BookmarkService
- SavedSearchService
- ExportService
- AdminService
- FileUploadService

### PHASE 4: Schema Migration (2-3 hours)
**Goal**: Ensure MSSQL schema compatibility

#### Step 4.1: Analyze PostgreSQL Schema
Review [supabase/migrations/](supabase/migrations/) files and note differences:
- UUID handling
- Serial/BigSerial auto-increment
- JSON/JSONB data types
- Timestamp defaults
- Indexes and constraints

#### Step 4.2: Create MSSQL Schema Script
**New file**: `supabase/migrations/20260331_01_mssql_schema.sql`
```sql
-- Convert PostgreSQL schema to MSSQL compatible version
-- Key changes:
-- - UUID → UNIQUEIDENTIFIER
-- - SERIAL/BIGSERIAL → IDENTITY()
-- - JSONB → NVARCHAR(MAX)
-- - Timestamps with TIME ZONE → DATETIMEOFFSET
-- - BOOLEAN → BIT
-- - TEXT limits → NVARCHAR(MAX)
```

#### Step 4.3: Create Migration Scripts
```
supabase/migrations/
├── mssql_procedures.sql    # Stored procedures
├── mssql_triggers.sql       # Audit triggers
├── mssql_indexes.sql        # Performance indexes
└── mssql_seed_data.sql      # Pre-populate test data
```

### PHASE 5: Testing & Monitoring (2-3 hours)
**Goal**: Verify failover works correctly

#### Step 5.1: Add Health Check Endpoint
**Update**: [backend/src/app.ts](backend/src/app.ts)
```typescript
app.get('/api/health/database', async (req: Request, res: Response) => {
  const health = {
    supabase: await connectionManager.checkHealth('supabase'),
    mssql: await connectionManager.checkHealth('mssql'),
    active: connectionManager.getActiveDatabase(),
  };
  res.json(health);
});
```

#### Step 5.2: Integration Tests
```typescript
// Test 1: Normal operation (Supabase)
test('should use Supabase when both healthy', async () => {
  const user = await searchService.searchRates(...);
  expect(user).toBeDefined();
});

// Test 2: Supabase down → Fallback
test('should failover to MSSQL when Supabase down', async () => {
  // Simulate Supabase outage
  // Verify requests route to MSSQL
});

// Test 3: Recovery
test('should recover to Supabase after recovery', async () => {
  // Simulate recovery
  // Verify circuit breaker restores primary
});
```

#### Step 5.3: Add Monitoring Dashboard
```
GET /api/v1/admin/database-status
{
  "primary": {
    "type": "supabase",
    "status": "healthy",
    "responseTime": "45ms",
    "lastCheck": "2026-03-31T18:25:00Z"
  },
  "fallback": {
    "type": "mssql",
    "status": "healthy",
    "responseTime": "120ms",
    "lastCheck": "2026-03-31T18:25:00Z"
  },
  "activeDatabase": "supabase",
  "failoverCount": 0
}
```

---

## 4. ENVIRONMENT VARIABLES

### Add to `.env.local`

```bash
# Existing Supabase
SUPABASE_URL=https://ahkmgnkuskncqckyooqb.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# New MSSQL Fallback
MSSQL_SERVER=your-server.database.windows.net
MSSQL_DATABASE=healthcare_pricing
MSSQL_USER=admin
MSSQL_PASSWORD=YourSecurePassword!
MSSQL_PORT=1433
MSSQL_ENABLED=true

# Connection behavior
DB_FAILOVER_ENABLED=true
DB_HEALTH_CHECK_INTERVAL=30000
DB_FAILOVER_THRESHOLD=3
```

---

## 5. MIGRATION PATH (Minimal Disruption)

### Option A: Gradual Rollout (Recommended)
1. **Week 1**: Deploy connection manager + health checks (no traffic change)
2. **Week 2**: Route 5% of queries to fallback (test mode)
3. **Week 3**: Route 50% of queries
4. **Week 4**: Full failover capability active

### Option B: Immediate Active-Active
1. Deploy all changes at once
2. Run full integration tests
3. Monitor closely for 24-48 hours

---

## 6. ROLLBACK PLAN

If issues arise:
```bash
# Disable MSSQL fallback
DB_FAILOVER_ENABLED=false

# Revert to Supabase-only
# Set environment variable and restart
SUPABASE_ONLY=true
```

---

## 7. ESTIMATED TIMELINE

| Phase | Task | Hours | Difficulty |
|-------|------|-------|------------|
| 1 | Foundation & Dependencies | 3 | Low |
| 2 | Query Adaptation | 3 | Medium |
| 3 | Service Updates | 2 | Medium |
| 4 | Schema Migration | 3 | High |
| 5 | Testing & Monitoring | 3 | Medium |
| **TOTAL** | | **14 hours** | |

---

## 8. RISKS & MITIGATIONS

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Data inconsistency between DBs | High | Critical | Sync strategy, real-time replication |
| Query compatibility issues | Medium | High | Comprehensive testing, query adapter |
| Performance degradation | Medium | Medium | Connection pooling, query optimization |
| Migration complexity | High | Medium | Staged rollout, careful schema mapping |
| Cost increase (SQL Server) | High | Medium | Azure SQL Serverless tier for savings |

---

## 9. IMPLEMENTATION APPROACH

### Option 1: Minimal (Recommended)
- Add MSSQL pool alongside Supabase
- Implement circuit breaker only
- Simple failover without data sync
- **Pro**: Low complexity, quick implementation
- **Con**: Potential data drift

### Option 2: Full-Featured
- Bi-directional sync between databases
- Advanced monitoring dashboard
- Automatic schema sync
- **Pro**: True HA/DR capability
- **Con**: Complex, requires more infrastructure

---

## 10. NEXT STEPS

1. **Gather Requirements**:
   - SQL Server location (local, Azure, AWS)?
   - Failover behavior (automatic, manual, gradual)?
   - Data sync requirements (real-time, periodic, none)?

2. **Prepare SQL Server**:
   - Set up MSSQL instance
   - Create initial schema
   - Test connectivity

3. **Implement Phase 1**:
   - Start with connection manager
   - Deploy health checks
   - Run basic failover tests

4. **Monitor & Iterate**:
   - Collect metrics
   - Refine configuration
   - Optimize performance

---

## Questions for Planning

- [ ] What's the SQL Server environment? (local, cloud, hybrid)
- [ ] How quickly need automatic failover? (seconds, minutes, manual)
- [ ] Real-time data sync required? (critical for audit compliance)
- [ ] Budget for infrastructure? (affects failover approach)
- [ ] RTO/RPO requirements? (Recovery Time/Point Objectives)
