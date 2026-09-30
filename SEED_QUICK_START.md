# 🚀 QUICK START - SEED DUMMY DATA

## 🏃 Fastest Way (30 seconds)

### Option 1: Copy-Paste SQL (NO CODE NEEDED)

1. Open: https://supabase.com → Your Project → **SQL Editor** → **New Query**
2. Copy entire contents from: [`COMPLETE_DUMMY_DATA.sql`](COMPLETE_DUMMY_DATA.sql)
3. Paste into SQL Editor
4. Click **RUN**

**Done!** ✅ All tables + 100 dummy records created in one command.

---

## 💻 If You Prefer Code

### Option 2: Simple Node Script (2 minutes)

```powershell
cd backend
npx ts-node src/scripts/simple-seed.ts
```

✅ No database migrations needed
✅ Creates schema + inserts data
✅ Full error reporting

---

### Option 3: API Endpoint (1 minute)

Backend must be running (`npm start`)

```powershell
# PowerShell
$r = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/admin/seed" -Method Post
$r | ConvertTo-Json

# Or curl
curl -X POST http://localhost:3001/api/v1/admin/seed
```

---

## 📋 After Seeding

### Verify Data in Supabase Dashboard:
1. Go to **Table Editor**
2. Click each table to see rows:
   - `procedures`: 10 rows ✓
   - `providers`: 5 rows ✓
   - `payers`: 6 rows ✓
   - `rates`: 100 rows ✓

### Test the App:
- Frontend: http://localhost:3000
- Search: "office visit" or "99213"
- Demo Login: demo@example.com / DemoPassword123!

---

## 🔧 Complete Options List

| Method | Speed | Code | Effort |
|--------|-------|------|--------|
| **SQL Copy-Paste** | ⚡ Fastest | None | 1 min |
| **Node Script** | ⚡ Fast | `npx ts-node` | 2 min |
| **API Endpoint** | ⚡ Fast | HTTP POST | 1 min |
| **Python Script** | Medium | Python | 5 min |
| **Supabase CLI** | Medium | CLI | 10 min |

---

## 🎯 Recommended Path

```
1. [BEST] Use SQL Editor (fastest, no setup)
   ↓
2. OR use simple-seed.ts script
   ↓
3. OR call API endpoint
```

For full details, see: [`DUMMY_DATA_OPTIONS.md`](DUMMY_DATA_OPTIONS.md)

---

## 📁 Files Reference

| File | Purpose |
|------|---------|
| [`COMPLETE_DUMMY_DATA.sql`](COMPLETE_DUMMY_DATA.sql) | Complete schema + data (copy to SQL Editor) |
| [`simple-seed.ts`](backend/src/scripts/simple-seed.ts) | Node.js seeding script |
| [`DUMMY_DATA_OPTIONS.md`](DUMMY_DATA_OPTIONS.md) | All 9 seeding methods explained |
| [`SETUP_SUPABASE_SCHEMA.md`](SETUP_SUPABASE_SCHEMA.md) | Schema-only (if you prefer step-by-step) |

---

## ❓ FAQ

**Q: Do I need to migrate the database first?**
A: No! The SQL script creates tables automatically.

**Q: Can I run seeding multiple times?**
A: Yes! It uses `ON CONFLICT DO NOTHING` to skip duplicates.

**Q: What if I get an error?**
A: Check [DUMMY_DATA_OPTIONS.md](DUMMY_DATA_OPTIONS.md) Troubleshooting section.

**Q: Can I use my own data?**
A: Yes! Modify the SQL or the seed scripts with your data.

---

## 🎉 You're Ready!

Pick any method above and seed your database now!
