# 🚀 Setup Guide - Healthcare Price Transparency Platform

**Status**: Phase 1 Complete - Ready for Phase 2 Development
**Date**: March 8, 2026

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Supabase Configuration](#supabase-configuration)
5. [Running Locally](#running-locally)
6. [Database Management](#database-management)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before getting started, ensure you have:

- **Node.js 20.x LTS** or higher
  ```bash
  node --version  # Should be v20.x or higher
  npm --version   # Should be 10.x or higher
  ```

- **Git** for version control
  ```bash
  git --version
  ```

- **Supabase CLI** (optional, for local development)
  ```bash
  npm install -g supabase
  ```

- **Accounts**:
  - [Supabase](https://supabase.com) (free tier is fine)
  - [Vercel](https://vercel.com) (for frontend deployment)
  - [Render](https://render.com) (for backend deployment)

---

## Backend Setup

### Step 1: Initialize Backend Project

```bash
cd backend
npm install
```

This installs dependencies:
- Express.js - Web framework
- Supabase client - Database + Auth
- Zod - Input validation
- Pino - Structured logging
- TypeScript - Type safety

### Step 2: Environment Configuration

```bash
cp .env.example .env.local
```

Edit `backend/.env.local` and fill in your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-key

NODE_ENV=development
PORT=3001
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
```

**Where to find these values:**
- Go to [Supabase Dashboard](https://supabase.com) → Your Project
- Settings → API → Copy `Project URL` (SUPABASE_URL)
- Settings → API → Copy `anon public key` (SUPABASE_ANON_KEY)
- Settings → API → Copy `service_role key` (SUPABASE_SERVICE_KEY)
- Settings → API → Copy `JWT Secret` (SUPABASE_JWT_SECRET)

### Step 3: Run Backend

```bash
npm run dev
```

Expected output:
```
🚀 Server running on http://localhost:3001
Available endpoints:
  - health: http://localhost:3001/api/health
  - api_info: http://localhost:3001/api/v1
```

Test the health endpoint:
```bash
curl http://localhost:3001/api/health
```

---

## Frontend Setup

### Step 1: Initialize Frontend Project

```bash
cd frontend
npm install
```

This installs dependencies:
- Next.js 14 - React framework
- TailwindCSS - Styling
- Supabase client - Auth + DB access
- Recharts - Data visualization

### Step 2: Environment Configuration

```bash
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: Only include `NEXT_PUBLIC_*` variables (these are public and shipped to the browser).

### Step 3: Run Frontend

```bash
npm run dev
```

Expected output:
```
> healthcare-pricing-frontend@1.0.0 dev
> next dev

  ▲ Next.js 14.0.0
  - Local: http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Supabase Configuration

### Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Organization: Create or select existing
   - Name: `healthcare-pricing-dev`
   - Database password: Store securely
   - Region: Choose closest to you
4. Click "Create new project"

Wait for project to provision (2-3 minutes).

### Step 2: Apply Database Schema

Once your Supabase project is created, you can apply the SQL migrations:

**Option A: Using Supabase Dashboard (Recommended for beginners)**

1. Go to Supabase Dashboard → Your Project → SQL Editor
2. Click "New Query"
3. Open `supabase/migrations/20260308_00_initial_schema.sql`
4. Copy the entire SQL content
5. Paste into SQL Editor
6. Click "Run"
7. Repeat for `20260308_01_seed_rates.sql`

**Option B: Using Supabase CLI (Recommended for dev teams)**

```bash
# Install Supabase CLI globally
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase migration up

# If migrations fail, reset and re-run
supabase db reset
```

### Step 3: Verify Schema

Check that tables were created:

1. Supabase Dashboard → Database → Tables
2. You should see: procedures, providers, payers, rates, users, audit_logs, file_uploads

Sample query to verify data:
```sql
SELECT COUNT(*) FROM public.rates;
```

Should return **~600,000+ records**.

### Step 4: Configure Authentication

1. Go to Authentication → Providers
2. Enable "Email" (already enabled by default)
3. Optional: Enable "Google OAuth"
   - Go to Google Cloud Console
   - Create OAuth credentials
   - Add to Supabase

### Step 5: Create Storage Bucket

1. Go to Storage → Create a new bucket
2. Name: `healthcare-uploads`
3. Set to Private (only authenticated users)
4. Click "Create bucket"

---

## Running Locally

### Full Stack Development Setup

Open **3 terminal windows**:

**Terminal 1: Backend**
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 3: Optional - Supabase Local (advanced)**
```bash
supabase start
# Runs local Supabase stack on ports 54321-54324
```

### Accessing the Application

- **Frontend**: http://localhost:3000 (landing page with hero search)
- **Backend API**: http://localhost:3001/api/health
- **API Info**: http://localhost:3001/api/v1

---

## Database Management

### View Database Schema

```bash
# Show all tables
supabase db diff --print-sql

# Export current schema
pg_dump [connection-string] > schema.sql
```

### Add New Migration

```bash
# Create a new migration file
supabase migration new [migration_name]

# Edit the file in supabase/migrations/
# Then apply it
supabase migration up
```

### Seed with More Data

To generate additional mock data:

```bash
# Run the seed SQL manually in Supabase dashboard
# Or use psql if you have local PostgreSQL:
psql [connection-string] -f supabase/migrations/20260308_01_seed_rates.sql
```

### Reset Database (Development Only)

⚠️ **Warning**: This deletes all data!

```bash
supabase db reset
```

---

## Troubleshooting

### Issue: "Cannot find module 'express'"

```bash
cd backend
npm install
```

### Issue: "SUPABASE_URL is required"

Check that `.env.local` exists with correct values:
```bash
ls -la backend/.env.local
cat backend/.env.local
```

### Issue: Frontend can't connect to backend

1. Verify backend is running: `curl http://localhost:3001/api/health`
2. Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
3. Verify CORS settings in `backend/src/app.ts`

### Issue: "Connection refused" to Supabase

1. Verify `SUPABASE_URL` is correct (should include `https://`)
2. Check API keys are correct in `.env.local`
3. Verify Supabase project is NOT paused:
   - Supabase Dashboard → Settings → Pause project (should show "Resume")

### Issue: "Relation 'procedures' does not exist"

Tables haven't been created. Run migrations:
```bash
supabase migration up
```

### Issue: 1M+ records didn't populate

Check that `20260308_01_seed_rates.sql` ran successfully:
```sql
SELECT COUNT(*) FROM rates;  -- Should be ~600k+
```

If empty, run seed migration again in Supabase SQL editor.

### Issue: Next.js build fails

```bash
cd frontend
npm run type-check  # Check TypeScript errors
npm run build       # Full build test
```

### Get Help

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Express Docs**: https://expressjs.com
- **GitHub Issues**: Report via GitHub

---

## Next Steps (Phase 2)

After setup is complete:

1. ✅ Backend running on http://localhost:3001
2. ✅ Frontend running on http://localhost:3000
3. ✅ Supabase with 1M+ rates seeded
4. 🔄 **Phase 2**: Implement 5 API endpoints
   - `GET /api/v1/search` - Price search
   - `GET /api/v1/benchmark/:procedure` - Percentiles
   - `POST /api/v1/estimate` - Cost calculator
   - `POST /api/v1/admin/upload` - CSV import
   - `GET /api/health` - Monitoring

See [README.md](./README.md) for the full development roadmap.

---

**Good luck! 🚀 Questions? Check the README or GitHub Issues.**
