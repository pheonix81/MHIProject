# 🏥 Healthcare Price Transparency Platform

A comprehensive, HIPAA-aligned healthcare price transparency system built with **Next.js**, **Express.js**, and **Supabase**. Enables patients, providers, and payers to search procedures, compare prices, and estimate out-of-pocket costs.

**Status**: Phase 1 - Database & Data Layer Setup
**Timeline**: 4 weeks (March 8 - April 5, 2026)
**Target**: Production-ready with 1M+ pricing records, 5 API endpoints, responsive UI

---

## 📋 Quick Links

- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [5-Phase Roadmap](#5-phase-roadmap)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [HIPAA Compliance](#hipaa-compliance)

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router) | 14.x |
| **UI Framework** | React + TailwindCSS | 18.x / 3.4+ |
| **Backend** | Node.js + Express.js | 20.x / 4.18+ |
| **Database** | Supabase (PostgreSQL) | Latest |
| **Auth** | Supabase Auth | JWT + Email/OAuth |
| **Storage** | Supabase Storage | CSV/JSON uploads |
| **Charts** | Recharts | 2.10+ |
| **Validation** | Zod | 3.22+ |
| **Logging** | Pino | 8.x |
| **Hosting** | Vercel (frontend) + Render (backend) + Supabase | Latest |

---

## 📊 Database Schema

### Tables Overview

```
procedures (CPT codes + market stats)
  ├─ id (UUID PK)
  ├─ cpt_code (VARCHAR 10 UNIQUE)
  ├─ description (TEXT)
  ├─ category (VARCHAR 50)
  ├─ avg_market_price, low_price, high_price (NUMERIC)
  └─ data_points, created_at, updated_at

providers (Hospitals/Clinics)
  ├─ id (UUID PK)
  ├─ name, npi (VARCHAR UNIQUE)
  ├─ provider_type, address, zip_code, state
  ├─ latitude, longitude
  └─ is_active, created_at, updated_at

rates (💎 1M+ PRICING RECORDS - DENORMALIZED)
  ├─ id (UUID PK)
  ├─ procedure_id, provider_id, payer_id (FKs)
  ├─ payer_name (VARCHAR - denormalized for speed!)
  ├─ cash_price, insurance_price (NUMERIC)
  ├─ insurance_type (VARCHAR)
  ├─ effective_date, expiration_date
  ├─ source_file, version
  └─ Indexes: (procedure_id, provider_id, payer_id), (zip_code), (cpt_code)

payers (Insurance companies)
  ├─ id (UUID PK)
  ├─ name (VARCHAR 255)
  ├─ type (VARCHAR 50 - Commercial/Medicare/Medicaid)
  └─ is_active, created_at

users (Patients, Providers, Admins)
  ├─ id (UUID PK - Supabase auth.users FK)
  ├─ email, full_name
  ├─ role (enum: patient, provider, payer_admin, platform_admin)
  ├─ provider_id (FK nullable)
  ├─ zip_code
  └─ created_at, last_login

audit_logs (HIPAA COMPLIANCE - APPEND ONLY)
  ├─ id (BIGSERIAL PK)
  ├─ user_id, action, resource_type, resource_id
  ├─ changes (JSONB)
  ├─ ip_address, user_agent
  └─ created_at (Indexes on user_id, action)

file_uploads (Track CSV/JSON imports)
  ├─ id (UUID PK)
  ├─ filename, file_type
  ├─ uploaded_by (FK → users)
  ├─ row_count, status
  ├─ error_message
  └─ created_at, completed_at
```

### Key Design Decisions

✅ **Rates Table**: Denormalized (`payer_name` included) for fast search without JOINs
✅ **Indexing**: Composite index on `(procedure_id, provider_id, payer_id)` for common searches
✅ **RLS Policies**: Role-based row-level security (patient, provider, admin)
✅ **Audit Logs**: Append-only immutable log for HIPAA compliance
✅ **Mock Data**: 1M+ procedurally generated records (CPT codes, providers, rates)

---

## 📁 Project Structure

```
MHIProject/
├── README.md (this file)
├── .gitignore
│
├── backend/                          # Express.js API
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT verification
│   │   │   ├── logger.ts             # Pino setup
│   │   │   └── errorHandler.ts       # Global error handling
│   │   │
│   │   ├── routes/
│   │   │   ├── routes.search.ts      # GET /api/search
│   │   │   ├── routes.benchmark.ts   # GET /api/benchmark/:procedure
│   │   │   ├── routes.estimate.ts    # POST /api/estimate
│   │   │   ├── routes.upload.ts      # POST /api/admin/upload
│   │   │   └── routes.health.ts      # GET /api/health
│   │   │
│   │   ├── controllers/
│   │   │   ├── searchController.ts
│   │   │   ├── benchmarkController.ts
│   │   │   ├── estimateController.ts
│   │   │   └── uploadController.ts
│   │   │
│   │   ├── services/
│   │   │   ├── pricingService.ts     # DB queries + search logic
│   │   │   ├── analysisService.ts    # Percentile calculations
│   │   │   └── csvService.ts         # CSV/JSON parsing
│   │   │
│   │   ├── db/
│   │   │   ├── client.ts             # Supabase client init
│   │   │   └── migrations/           # SQL migration files
│   │   │
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   │
│   │   ├── utils/
│   │   │   ├── validators.ts         # Zod schemas
│   │   │   └── constants.ts
│   │   │
│   │   ├── app.ts                    # Express app setup
│   │   └── server.ts                 # Entry point
│   │
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .eslintrc.json
│
├── frontend/                         # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Homepage / hero search
│   │   │
│   │   ├── search/
│   │   │   ├── page.tsx              # Search results page
│   │   │   └── [id]/page.tsx         # Provider detail page
│   │   │
│   │   ├── benchmark/
│   │   │   └── page.tsx              # Benchmarking dashboard
│   │   │
│   │   ├── estimator/
│   │   │   └── page.tsx              # Cost estimator calculator
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx              # User dashboard
│   │   │
│   │   └── admin/
│   │       ├── page.tsx              # Admin panel
│   │       └── upload/page.tsx       # Data import page
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   │
│   │   ├── search/
│   │   │   ├── SearchBar.tsx         # Hero search input
│   │   │   ├── ResultsTable.tsx      # Sortable results
│   │   │   ├── FilterPanel.tsx       # Filters sidebar
│   │   │   └── PriceCard.tsx         # Individual result card
│   │   │
│   │   ├── benchmark/
│   │   │   ├── BenchmarkChart.tsx    # Percentile chart
│   │   │   ├── PercentileTable.tsx   # Stats table
│   │   │   └── ComparisonWidget.tsx  # Provider comparison
│   │   │
│   │   ├── estimator/
│   │   │   ├── EstimatorForm.tsx     # Cost calculator form
│   │   │   ├── CostBreakdown.tsx     # Cost breakdown display
│   │   │   └── ScenarioModal.tsx     # Scenario comparison
│   │   │
│   │   └── ui/                       # Reusable Shadcn/ui
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── api.ts                    # API client (fetch wrapper)
│   │   ├── supabase.ts               # Supabase client init
│   │   ├── auth.ts                   # Auth utilities
│   │   └── utils.ts                  # Helpers (format price, etc)
│   │
│   ├── hooks/
│   │   ├── useSearch.ts              # Search API hook
│   │   ├── useBenchmark.ts           # Benchmark API hook
│   │   └── useAuth.ts                # Auth state
│   │
│   ├── styles/
│   │   └── globals.css               # TailwindCSS + theme
│   │
│   ├── .env.local.example
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .eslintrc.json
│
├── supabase/
│   ├── migrations/
│   │   ├── 20260308_00_initial_schema.sql    # Tables + RLS
│   │   └── 20260308_01_seed_rates.sql        # 1M+ mock records
│   │
│   └── config.toml                   # Supabase CLI config
│
└── .gitignore
```

---

## 🚀 5-Phase Roadmap

### Phase 1: Setup & Data Layer ✅ **CURRENT (Week 1)**
**Goals**: Supabase project initialized, schema created, 1M+ mock rates seeded, RLS policies configured  
**Status**: 🔄 In Progress

- [ ] Create Supabase project + enable Auth/Storage
- [ ] Write SQL migration: `initial_schema.sql` (tables + indexes + RLS)
- [ ] Write seed migration: `seed_rates.sql` (1M+ procedurally generated records)
- [ ] Configure Supabase Storage bucket for CSV/JSON uploads
- [ ] Initialize backend Node.js project + Supabase client
- [ ] Set up `.env.example` template

**Deliverables**:
- ✓ Supabase schema with 7 tables
- ✓ 1M+ mock rate records
- ✓ RLS policies for HIPAA-like security
- ✓ Backend boilerplate + DB connection

---

### Phase 2: Backend API Layer (Week 2)
**Goals**: 5 RESTful endpoints, JWT auth, Zod validation, structured errors  
**Status**: 🔲 Not Started

- [ ] Auth middleware (JWT verification + role checks)
- [ ] Search API: `GET /api/search?procedure=CPT&zip=94105&payer_type=PPO`
- [ ] Benchmark API: `GET /api/benchmark/:procedure` (percentiles)
- [ ] Estimate API: `POST /api/estimate` (OOP calculator)
- [ ] Upload API: `POST /api/admin/upload` (CSV/JSON import)
- [ ] Health check: `GET /api/health`
- [ ] Error handling middleware + Pino logging

**Deliverables**:
- ✓ 5+ RESTful endpoints
- ✓ JWT auth + role-based access control
- ✓ Zod validation on all inputs
- ✓ Production-ready error responses

---

### Phase 3: Frontend (Next.js + TailwindCSS) ✅ **COMPLETE (March 9, 2026)**
**Goals**: Landing page, search results, benchmarking dashboard, cost estimator  
**Status**: ✅ Complete

- [x] Project setup (Next.js 14 + TailwindCSS + theme)
- [x] Landing page with hero search bar
- [x] Search results page (filterable, sortable, paginated)
- [x] Benchmarking dashboard (Recharts percentile chart)
- [x] Cost estimator calculator (scenario modeling)
- [x] User dashboard (saved searches, bookmarks)
- [x] Admin panel (upload, import status tracking)
- [x] Supabase Auth integration

**Deliverables**:
- ✓ Landing page + hero search
- ✓ Search results with filters/sorting
- ✓ Interactive charts (Recharts)
- ✓ Cost estimator with scenarios
- ✓ Responsive turquoise/aqua theme
- ✓ 6 fully functional pages (Home, Search, Benchmark, Estimate, Dashboard, Admin)
- ✓ 6 reusable components with full TypeScript support
- ✓ 4 custom React hooks (useSearch, useBenchmark, useEstimate, useAuth)
- ✓ Supabase authentication with sign-up/sign-in/sign-out
- ✓ Header and Footer navigation
- ✓ Role-based access control (admin-only pages)
- ✓ File UI support ready for Phase 4

---

### Phase 4: Advanced Features (Week 3-4)
**Goals**: Admin workflows, data quality, exports, favorites system  
**Status**: 🔲 Not Started

- [ ] Data import validation (schema checking, duplicate detection)
- [ ] Async file processing (batch operations)
- [ ] Export functionality (CSV/Excel results)
- [ ] HIPAA audit report generation
- [ ] Saved searches + bookmarks
- [ ] Provider performance reports
- [ ] API rate limiting
- [ ] Query caching (5-min TTL on benchmark endpoint)

**Deliverables**:
- ✓ Admin data import workflow
- ✓ Export + compliance reporting
- ✓ Saved searches + bookmarks
- ✓ Performance optimizations (indexing, caching)

---

### Phase 5: Deploy & Scale (Week 4)
**Goals**: Production deployment, monitoring, CI/CD pipeline  
**Status**: 🔲 Not Started

- [ ] Frontend deployment (Vercel)
- [ ] Backend deployment (Render)
- [ ] Supabase production environment
- [ ] Environment variable configuration
- [ ] Database connection pooling (pgBouncer)
- [ ] Monitoring (Sentry + Supabase logs + Pino)
- [ ] GitHub Actions CI/CD pipeline
- [ ] Load testing + performance verification
- [ ] Custom domain setup
- [ ] Uptime monitoring

**Deliverables**:
- ✓ Frontend live on Vercel
- ✓ Backend API live on Render
- ✓ Supabase prod configured
- ✓ Monitoring + alerting
- ✓ CI/CD pipeline

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x LTS installed
- Supabase account (free tier works)
- Render account (free tier for backend)
- Vercel account (free tier for frontend)
- Git + GitHub account

### Step 1: Backend Setup

```bash
cd backend
npm install
cp .env.example .env.local
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, etc.
npm run dev
```

Backend runs on `http://localhost:3001`

### Step 2: Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_API_URL, SUPABASE URLs
npm run dev
```

Frontend runs on `http://localhost:3000`

### Step 3: Supabase Setup

1. Create Supabase project at supabase.com
2. Copy project URL + API keys to `.env` files
3. Apply migrations:
   ```bash
   supabase migration up
   ```
4. Verify data:
   ```bash
   supabase db push
   ```

---

## 🔐 HIPAA Compliance

This platform is designed with HIPAA-aligned principles:

✅ **Access Control** — Row-level security by role (patient/provider/admin)
✅ **Audit Logging** — All sensitive actions logged with user_id, IP, timestamp
✅ **Encryption in Transit** — HTTPS/TLS on all endpoints
✅ **Encryption at Rest** — Supabase PostgreSQL encryption
✅ **Anonymization** — Public API doesn't expose PII
✅ **User Authentication** — Supabase Auth with JWT validation
✅ **Data Retention** — 7-year audit log retention policy
✅ **Input Validation** — Zod schemas on all API inputs

⚠️ **Note**: Not a substitute for legal compliance review. Consult healthcare compliance experts before production deployment.

---

## 📝 API Reference (Phase 2+)

### Search Prices
```
GET /api/search?procedure=99214&zip=94105&payer_type=PPO
Response: {
  "success": true,
  "data": [
    {
      "id": "uuid",
      "provider": "Hospital Name",
      "procedure": "Office visit - Established patient",
      "cash_price": 150.00,
      "insurance_price": 120.00,
      "insurance_type": "PPO",
      "distance_miles": 2.3
    }
  ],
  "total": 450,
  "page": 1
}
```

### Benchmark Percentiles
```
GET /api/benchmark/99214
Response: {
  "procedure": "Office visit - Established patient",
  "percentiles": {
    "p10": 80.00,
    "p25": 110.00,
    "p50": 150.00,
    "p75": 190.00,
    "p90": 250.00
  },
  "avg_price": 150.00,
  "data_points": 50000
}
```

### Cost Estimate
```
POST /api/estimate
Body: {
  "procedure": "99214",
  "zip": "94105",
  "insurance_type": "PPO",
  "copay": 50,
  "deductible": 1000
}
Response: {
  "scenarios": [
    {
      "name": "Low Cost",
      "procedure_cost": 100,
      "facility_cost": 50,
      "total": 150,
      "out_of_pocket": 100
    },
    ...
  ]
}
```

---

## 🌍 Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set environment variables
3. Auto-deploy on push to `main`
4. [Vercel deployment guide](https://vercel.com/docs)

### Backend (Render)
1. Connect GitHub repo (`backend/` folder)
2. Select Node.js environment
3. Set health check endpoint: `GET /api/health`
4. Auto-deploy on push
5. [Render deployment guide](https://render.com/docs)

### Supabase
1. Create production Supabase project
2. Run migrations: `supabase db push`
3. Enable backups + SSL
4. Configure read replicas (for performance)
5. [Supabase production guide](https://supabase.com/docs/going-to-prod)

---

## 📈 Performance Checklist

- [x] Database indexing on `(procedure_id, provider_id, payer_id)`, `(zip_code)`, `(cpt_code)`
- [x] Denormalized `rates` table (include `payer_name`)
- [ ] API caching (5-min TTL on benchmark endpoint)
- [ ] CDN for static assets (Vercel Edge)
- [ ] Connection pooling (pgBouncer via Supabase)
- [ ] gzip compression on Express + Next.js
- [ ] Query optimization (avoid N+1 queries)
- [ ] Lazy loading on frontend tables
- [ ] Image optimization (Next.js Image component)

---

## 🧪 Testing Strategy (Phase 5+)

- **Backend**: Jest + Supertest (API endpoint tests)
- **Frontend**: Vitest + React Testing Library
- **E2E**: Playwright (critical flows: search → results → estimate)
- **Load Testing**: k6 or Locust (1M+ record queries)
- **Database**: Seeded test DB for reproducibility

---

## 📚 Key Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Recharts Docs](https://recharts.org)
- [TailwindCSS Config](https://tailwindcss.com/docs/configuration)
- [HIPAA Compliance Overview](https://www.hhs.gov/hipaa/)
- [Zod Validation](https://zod.dev/)

---

## ⚠️ Gotchas & Best Practices

1. **Denormalized Rates Table** — Keep `payer_name` for fast search (avoid JOINs)
2. **Service Role Key** — Never expose in frontend; backend only
3. **JWT Custom Claims** — Use Supabase `app_metadata` for role-based RLS
4. **RLS Performance** — Complex RLS can slow queries; use materialized views if needed
5. **File Upload Limits** — Max 100MB; process large files asynchronously
6. **API Rate Limiting** — Implement on Render to prevent abuse
7. **pgBouncer Connection Limits** — Monitor 20-connection pool on Supabase
8. **Bulk Operations** — Use `COPY` command or bulk insert for 1M+ records
9. **Search Optimization** — Use PostgreSQL full-text search for procedure names (Phase 4)
10. **Caching Strategy** — Cache benchmark queries (highly requested, low volatility)

---

## 📞 Support & Contributing

- **Issues**: Report bugs via GitHub Issues
- **Questions**: Start a Discussion in GitHub
- **Contributing**: Submit PRs with clear descriptions

---

## 📄 License

[Add license here - MIT, Apache 2.0, etc.]

---

## 🎯 Current Status

**Phase**: 1 - Setup & Data Layer
**Last Updated**: March 8, 2026
**Next Milestone**: Database schema + 1M records seeded (by March 12, 2026)

Track progress and updates here as we build! 🚀
