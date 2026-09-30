# 📊 DUMMY DATA SEEDING - ALL OPTIONS

## Option 1: ⭐ Supabase SQL Editor (EASIEST - No Code)

### Step 1: Open SQL Editor
1. Go to https://supabase.com → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Paste Complete Script
Open [COMPLETE_DUMMY_DATA.sql](COMPLETE_DUMMY_DATA.sql) and copy the entire content

### Step 3: Run
Click **Run** (or Ctrl+Enter)

**Expected Output:**
```
Procedures created       | 10
Providers created        | 5
Payers created           | 6
Rates created           | 100
```

✅ **Done in 30 seconds!** No setup needed.

---

## Option 2: API Endpoint (JavaScript/Node.js)

If backend is running, you can call the built-in endpoint:

```powershell
# PowerShell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/admin/seed" -Method Post
$response | ConvertTo-Json -Depth 10
```

```javascript
// JavaScript/Node.js
fetch('http://localhost:3001/api/v1/admin/seed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => console.log(data));
```

✅ **Requires:** Backend running on port 3001

---

## Option 3: CLI Script (Node.js/TypeScript)

### Manual approach using ts-node:

```powershell
cd backend
npx ts-node src/scripts/seed-data.ts
```

**Requirements:**
- Node.js 18+
- DB_PASSWORD environment variable set
- npm dependencies installed

---

## Option 4: Supabase CLI (Official Tool)

### Install Supabase CLI:

```powershell
npm install -g supabase
```

### Link your project:

```powershell
supabase link --project-ref ahkmgnkuskncqckyooqb
```

### Create migration:

```powershell
supabase migration new add_dummy_data
```

### Run migrations:

```powershell
supabase migration up
```

✅ **Official & Professional approach**

---

## Option 5: CSV Upload (Dashboard)

### Step 1: Generate CSV
Create a file `rates.csv`:
```csv
procedure_id,provider_id,payer_id,cash_price,insurance_price
[UUID],[UUID],[UUID],2500,2000
[UUID],[UUID],[UUID],1500,1200
```

### Step 2: Upload via Dashboard
1. Open Supabase → Your Project
2. Go to **Table Editor**
3. Select `rates` table
4. Click **Insert** → **Insert from CSV**
5. Upload your CSV

✅ **Best for bulk imports**

---

## Option 6: Direct SQL via pgAdmin (Advanced)

### Access pgAdmin:
```
Supabase Dashboard → Settings → Database → pgAdmin
```

Then paste the SQL from [COMPLETE_DUMMY_DATA.sql](COMPLETE_DUMMY_DATA.sql)

---

## Option 7: Python Script

### Install dependencies:
```bash
pip install supabase python-dotenv
```

### Create `seed.py`:
```python
from supabase import create_client

url = "https://ahkmgnkuskncqckyooqb.supabase.co"
key = "sb_secret_AVyCvZ-8kajUkhMsxQwmTA_BJZMpPif"

supabase = create_client(url, key)

# Insert procedures
procedures = [
    {"cpt_code": "99213", "description": "Office Visit", "cost_index": 1.0},
    # ... more procedures
]

result = supabase.table("procedures").insert(procedures).execute()
print(f"Inserted {len(result.data)} procedures")
```

### Run:
```bash
python seed.py
```

---

## Option 8: JavaScript/TypeScript SDK

### Install:
```bash
npm install @supabase/supabase-js
```

### Create `seed.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ahkmgnkuskncqckyooqb.supabase.co',
  'sb_secret_AVyCvZ-8kajUkhMsxQwmTA_BJZMpPif'
);

const procedures = [
  { cpt_code: '99213', description: 'Office Visit', cost_index: 1.0 },
  // ... more
];

const { data, error } = await supabase
  .from('procedures')
  .insert(procedures);

console.log(`Inserted ${data?.length || 0} procedures`);
```

### Run:
```bash
npx ts-node seed.ts
```

---

## Option 9: Seeding via Next.js API Route

Create `pages/api/seed.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Insert seed data
  const { data, error } = await supabase
    .from('procedures')
    .insert([ /* procedures */ ]);

  res.json({ success: !error, data });
}
```

Access via: `POST http://localhost:3000/api/seed`

---

## Recommended Approaches

| Method | Ease | Speed | Type |
|--------|------|-------|------|
| **SQL Editor** ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | No-code |
| **API Endpoint** | ⭐⭐⭐ | ⭐⭐⭐ | JavaScript |
| **Supabase CLI** | ⭐⭐ | ⭐⭐ | CLI |
| **CSV Upload** | ⭐⭐ | ⭐⭐ | Data |
| **Python Script** | ⭐⭐ | ⭐ | Python |
| **JS SDK** | ⭐⭐ | ⭐ | JavaScript |

---

## Quick Decision Tree

1. **Want the fastest?** → Use **SQL Editor** (Option 1)
2. **Already have backend?** → Use **API Endpoint** (Option 2)
3. **Want to automate?** → Use **Supabase CLI** (Option 4) or **Node Script** (Option 3)
4. **Have large CSV files?** → Use **CSV Upload** (Option 5)
5. **Prefer Python?** → Use **Python Script** (Option 7)

---

## Your Current Setup

✅ All credentials configured in:
- `backend/.env.local`
- `frontend/.env.local`

✅ Servers running:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api/health

✅ Ready to seed using ANY of the above methods!

---

## Verify Data Was Inserted

After seeding, check Supabase Dashboard:
1. Go to **Table Editor**
2. Select `procedures` → should show 10 rows
3. Select `providers` → should show 5 rows
4. Select `payers` → should show 6 rows
5. Select `rates` → should show 100 rows

---

## Troubleshooting

**Error: "permission denied"**
- Make sure you're using the SERVICE_ROLE key, not anon key

**Error: "relation does not exist"**
- Schema not created yet? Run schema creation first (in COMPLETE_DUMMY_DATA.sql)

**Error: "unique constraint violation"**
- Data already exists? No problem, it will skip duplicates (due to `ON CONFLICT DO NOTHING`)

---

## Files Reference

- **[COMPLETE_DUMMY_DATA.sql](COMPLETE_DUMMY_DATA.sql)** - Full schema + data (copy/paste into SQL Editor)
- **[SETUP_SUPABASE_SCHEMA.md](SETUP_SUPABASE_SCHEMA.md)** - Schema only
- **backend/src/routes/admin.ts** - API endpoint
- **backend/src/scripts/seed-data.ts** - CLI script
