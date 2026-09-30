# 🚀 Phase 4: Dummy Data Seeding

## ✅ What's Been Set Up

I've created a complete dummy data seeding system with an easy API endpoint:

### Created Files:
- ✅ `backend/src/routes/admin.ts` - Admin routes including `/seed` endpoint
- ✅ `backend/src/scripts/seed-data.ts` - Standalone seed script (if you prefer CLI)
- ✅ `DUMMY_DATA_SETUP.md` - Comprehensive setup guide

### New API Endpoint:

```
POST /api/v1/admin/seed
```

**Location**: `http://localhost:3001/api/v1/admin/seed` (when backend is running)

---

## 📋 Seeding System Features

### What Seeding Populates:

1. **10 Procedures**
   - Office visits (CPT: 99213, 99214, 99215, 99204, 99205)
   - Orthopedic surgery (CPT: 27447, 29881)
   - Imaging (CPT: 70450, 71046, 76700)

2. **5 Provider Locations**
   - Stanford Medical Center, UCSF, Kaiser, Sutter, Bay Medical
   - Geographic coordinates included (for map features)

3. **6 Insurance Payers**
   - UnitedHealthcare, Anthem, Aetna, Cigna (commercial)
   - Medicare, Medicaid (government)

4. **100 Pricing Records**
   - Realistic variation across providers/payers
   - Cash pricing + insurance allowed amounts
   - Statistical percentiles (P25, P50, P75, P90)
   - Sample sizes and data quality scores

5. **Demo User Account**
   - Email: `demo@example.com`
   - Password: `DemoPassword123!`
   - For testing authentication flows

---

## 🔧 How to Use

### Option 1: Simple API Call ⭐ (Recommended)

Once both servers are running:

```powershell
# PowerShell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/admin/seed" -Method Post
$response | ConvertTo-Json -Depth 10
```

Success response:
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

### Option 2: CLI Script

```powershell
cd backend
npx ts-node src/scripts/seed-data.ts
```

---

## ⚠️ Important: Configure Supabase First

Before seeding, you **MUST** update your environment files with real Supabase credentials:

### Step 1: Get Credentials
1. Log into your Supabase project
2. Go to **Settings → API**
3. Copy:
   - Project URL
   - Anon public key
   - Service role key
   - JWT Secret

### Step 2: Update `backend/.env.local`

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5c...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5c...
SUPABASE_JWT_SECRET=jwt_secret_from_settings...
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug
```

### Step 3: Update `frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5c...
```

### Step 4: Restart Backend

```powershell
cd backend
npm start
```

### Step 5: Call Seed Endpoint

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/admin/seed" -Method Post | ConvertTo-Json
```

---

## 📊 Current State

| Component | Status | Path |
|-----------|--------|------|
| Seeding endpoint | ✅ Ready | `backend/src/routes/admin.ts` |
| Seed script | ✅ Ready | `backend/src/scripts/seed-data.ts` |
| Backend integration | ✅ Done | Registered in `app.ts` |
| Build | ✅ Success | No TypeScript errors |
| Documentation | ✅ Complete | `DUMMY_DATA_SETUP.md` |
| Supabase credentials | ❌ Needed | Update `.env.local` files |

---

## 🎯 Next Steps

1. **Get Supabase Credentials** (if not done already)
   - Create account at https://supabase.com
   - Create a new project
   - Note the API credentials

2. **Update Environment Files**
   - Edit `backend/.env.local` with real credentials
   - Edit `frontend/.env.local` with real credentials

3. **Restart Backend Server**
   ```powershell
   cd backend
   npm start
   ```

4. **Run Seeding**
   ```powershell
   # Call the API endpoint
   Invoke-RestMethod -Uri "http://localhost:3001/api/v1/admin/seed" -Method Post
   ```

5. **Verify Data**
   - Go to http://localhost:3000
   - Try searching for procedures
   - Sign in with demo@example.com / DemoPassword123!

---

## 📚 Files Reference

### Backend Route
- **File**: `backend/src/routes/admin.ts`
- **Purpose**: Admin endpoints including data seeding
- **Endpoint**: POST `/api/v1/admin/seed`

### Seed Script
- **File**: `backend/src/scripts/seed-data.ts`
- **Purpose**: Standalone CLI script for seeding
- **Usage**: `npx ts-node src/scripts/seed-data.ts`

### App Integration
- **File**: `backend/src/app.ts`
- **Change**: Added `import adminRoutes from './routes/admin'` and registered route

### Documentation
- **File**: `DUMMY_DATA_SETUP.md` - Detailed setup guide
- **File**: `PHASE_4_SEEDING.md` - This file

---

## 🔍 Troubleshooting

### Error: "Failed to seed data"
- Verify Supabase credentials in `.env.local`
- Ensure backend is running on port 3001
- Check backend logs for specific error

### Error: "Missing Supabase credentials"
- Script checked `.env.local`
- Found placeholder values instead of real credentials
- Update `.env.local` with actual Supabase project credentials

### Database connection issues
- Confirm Supabase project is accessible
- Verify credentials are correct
- Run migrations first (they were already applied in Phase 1)

---

## ✨ Features Enabled

With dummy data seeded, you can now:

- ✅ **Search**: Find procedures by name or CPT code
- ✅ **Compare**: View price benchmarks across providers
- ✅ **Estimate**: Calculate patient out-of-pocket costs
- ✅ **Authenticate**: Sign in with demo account
- ✅ **Analyze**: View percentile distributions and pricing trends

---

## 📞 Support

For issues or questions:
1. Check [DUMMY_DATA_SETUP.md](DUMMY_DATA_SETUP.md) for detailed instructions
2. Review [SETUP.md](SETUP.md) for project setup
3. Check backend logs: `npm start` shows real-time output
4. Visit [Supabase docs](https://supabase.com/docs) for Supabase-specific issues

---

**Status**: 🟡 Ready to Seed (Awaiting Supabase Credentials)
**Progress**: Phase 4 implementation 30% complete
