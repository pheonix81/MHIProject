# 📋 DUMMY DATA SETUP GUIDE

## Quick Start - No Configuration Needed!

You now have **TWO ways** to populate dummy data:

---

## Method 1: API Endpoint (🎯 Easiest)

### Step 1: Ensure Supabase is connected

First, make sure your `.env.local` files have your actual Supabase credentials:

```bash
# backend/.env.local
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_KEY=eyJhbGciOi...
SUPABASE_JWT_SECRET=v3ryL0ngSecretK3y...
```

### Step 2: Call the seed endpoint

Once servers are running, just make a POST request:

```bash
curl -X POST http://localhost:3001/api/v1/admin/seed
```

Or using PowerShell:

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/admin/seed" -Method Post
$response | ConvertTo-Json -Depth 10
```

### Step 3: Check the response

**Success Response:**
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

## Method 2: CLI Script

Alternatively, if you prefer running a script directly:

```powershell
cd backend
npx ts-node src/scripts/seed-data.ts
```

---

## What Gets Populated

After running the seed endpoint, you'll have:

### 1. **10 Procedures**
- 99213: Office Visit (Established Patient)
- 99214: Extended Office Visit
- 99215: Complex Office Visit
- 99204-99205: New Patient Visits
- 27447: Knee Arthroscopy
- 29881: Knee Arthroscopy with Repair
- 70450: CT Head/Brain
- 71046: Chest X-ray
- 76700: Abdominal Ultrasound

### 2. **5 Provider Locations**
- Stanford Medical Center (Palo Alto, CA)
- UCSF Medical Center (San Francisco, CA)
- Kaiser Permanente (Oakland, CA)
- Sutter Health (Sacramento, CA)
- Bay Medical Center (San Jose, CA)

### 3. **6 Insurance Payers**
- UnitedHealthcare (PPO)
- Anthem Blue Cross (PPO)
- Aetna (HMO)
- Cigna (PPO)
- Medicare (Government)
- Medicaid (Government)

### 4. **100 Price Records**
- Mix of procedures across providers and payers
- Realistic pricing variations
- Cash prices + insurance-allowed amounts
- Statistical data (percentiles, sample sizes)

### 5. **Demo User Account**
- Email: `demo@example.com`
- Password: `DemoPassword123!`
- Use to test login and user dashboard

---

## Troubleshooting

### ❌ Error: "Missing Supabase credentials"

**Solution**: Update your `backend/.env.local` with real credentials from your Supabase project.

### ❌ Error: "Failed to seed data"

**Possible causes:**
1. Supabase credentials are invalid
2. Database schema not initialized (run migrations)
3. Backend server not running on port 3001

**Check:**
```powershell
# Verify backend is running
Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get
```

### ❌ No demo user created

**Reason**: Supabase Auth may not be enabled
- Go to Supabase Dashboard → Authentication → Providers
- Make sure "Email" is enabled

---

## Getting Supabase Credentials

### If you don't have a Supabase project:

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub or Google
4. Create a new organization and project
5. Wait for the project to initialize (~2 minutes)

### Once project is created:

1. Go to **Settings → API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

3. Update `backend/.env.local`:
   ```bash
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_JWT_SECRET=v3ryL0ngSecretK3y...
   ```

4. Restart the backend server: `npm start`

5. Call the seed endpoint (or run the script)

---

## What's Next?

After seeding data:

1. **Open Frontend**: http://localhost:3000
2. **Search Procedures**: Try searching for "office visit" or CPT code "99213"
3. **View Benchmarks**: Check procedure pricing data
4. **Estimate Costs**: Calculate patient responsibility
5. **Sign In**: Use demo@example.com / DemoPassword123!
6. **View Dashboard**: Access personalized user features

---

## API Documentation

### POST /api/v1/admin/seed

**Endpoint**: `http://localhost:3001/api/v1/admin/seed`
**Method**: POST
**Authentication**: None required (development)
**Response Time**: 15-30 seconds

**Response** (on success):
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

## Questions?

- Check [SETUP.md](SETUP.md) for initial project setup
- Check [DEPLOYMENT_COMPLETE.md](DEPLOYMENT_COMPLETE.md) for deployment info
- Review [Phase guides](README.md) for project documentation

