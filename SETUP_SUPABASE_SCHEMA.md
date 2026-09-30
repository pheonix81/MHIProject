# 🚀 Setup: Run Database Migrations via Supabase SQL Editor

## Quick Setup (5 minutes)

Your Supabase credentials are now configured! But first, we need to create the database schema. Follow these steps:

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com and log into your project
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query** button

### Step 2: Copy & Paste Initial Schema

Copy this SQL and paste it into the SQL editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROCEDURES TABLE
CREATE TABLE IF NOT EXISTS public.procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cpt_code VARCHAR(10) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(50),
  cost_index NUMERIC(5, 2) DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_procedures_cpt_code ON public.procedures(cpt_code);

-- 2. PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(5),
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_providers_zip ON public.providers(zip);

-- 3. PAYERS TABLE
CREATE TABLE IF NOT EXISTS public.payers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RATES TABLE
CREATE TABLE IF NOT EXISTS public.rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES public.payers(id) ON DELETE CASCADE,
  cash_price NUMERIC(10, 2),
  insurance_price NUMERIC(10, 2),
  insurance_allowed_amount NUMERIC(10, 2),
  sample_size INT,
  min_price NUMERIC(10, 2),
  max_price NUMERIC(10, 2),
  p25_price NUMERIC(10, 2),
  p50_price NUMERIC(10, 2),
  p75_price NUMERIC(10, 2),
  p90_price NUMERIC(10, 2),
  data_quality_score NUMERIC(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rates_procedure_provider_payer ON public.rates(procedure_id, provider_id, payer_id);
CREATE INDEX idx_rates_procedure ON public.rates(procedure_id);
CREATE INDEX idx_rates_provider ON public.rates(provider_id);
CREATE INDEX idx_rates_payer ON public.rates(payer_id);

-- 5. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'patient',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
```

### Step 3: Run the Query

Click **Run** (or press Ctrl+Enter) to execute the SQL.

✅ You should see "Success" once the schema is created!

### Step 4: Seed Dummy Data

Once the schema is created, go back to your terminal and run:

```powershell
# Make sure you're in the backend directory
cd c:\Users\icefr\MHIProject\backend

# Call the seed endpoint
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/admin/seed" -Method Post
$response | ConvertTo-Json
```

**Expected response:**
```json
{
  "success": true,
  "message": "Data seeded successfully",
  "summary": {
    "procedures": 10,
    "providers": 5,
    "payers": 6,
    "rates": 100,
    "demoUser": "demo@example.com"
  }
}
```

---

## Your Supabase Credentials (Already Configured ✅)

```
Project URL: https://ahkmgnkuskncqckyooqb.supabase.co
Anon Key: sb_publishable_0sHB0DubDMOx7v9r5e3xjg_3r5giHSs
Service Key: sb_secret_AVyCvZ-8kajUkhMsxQwmTA_BJZMpPif
JWT Secret: c6361768-b1e4-4841-8ed5-111d0bb13c01
DB Password: gceoA4EwPzzA4gB3
```

---

## Error: Table "procedures" Does Not Exist?

This means the schema hasn't been created yet. Follow Step 1-3 above to create the schema in Supabase.

## Everything Ready?

Once the schema is created and data is seeded:

1. **Backend**: http://localhost:3001/api/health (should show `status: ok`)
2. **Frontend**: http://localhost:3000 (should load the home page)
3. **Search**: Try searching for "office visit" to see procedures
4. **Demo Login**: demo@example.com / DemoPassword123!

---

**Need Help?**
- Check Supabase docs: https://supabase.com/docs
- Review [DUMMY_DATA_SETUP.md](DUMMY_DATA_SETUP.md)
- Check backend logs: Look at terminal output for error details
