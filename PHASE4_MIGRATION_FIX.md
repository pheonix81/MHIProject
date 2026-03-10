# 🔧 Phase 4 Migration Fix

## Issue Found
The Phase 4 migration had foreign key constraints referencing `auth.users` table, but your backend uses simple string user IDs (like 'test-user'). This causes the INSERT operations to fail.

## Solution
The migration has been corrected to use TEXT for user_id instead of UUID with foreign key constraints.

## Steps to Apply

### Option A: Fresh Database (Easiest)

If you haven't applied the Phase 4 migration yet:

1. Go to your Supabase project: https://supabase.com
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire content from: `supabase/migrations/20260310_00_phase4_features.sql`
5. Click **Run**

### Option B: Fix Existing Tables (If migration already applied)

If the migration was already applied, run this in Supabase SQL Editor:

```sql
-- Drop the old tables with foreign key constraints
DROP TABLE IF EXISTS public.import_jobs CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.saved_searches CASCADE;

-- Now recreate with correct schema (copy from migration file)
-- The corrected migration file at supabase/migrations/20260310_00_phase4_features.sql
-- has been updated to use TEXT for user_id instead of UUID with FK constraints
```

Then apply the corrected migration from `supabase/migrations/20260310_00_phase4_features.sql`

## What Changed in the Migration

**Before (❌ Broken):**
```sql
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
```

**After (✅ Fixed):**
```sql
user_id TEXT NOT NULL,
```

This allows test users with string IDs to work without requiring them to exist in Supabase's auth.users table.

## Testing

Once applied, test the save/bookmark functionality:

1. Run the backend (port 3001) and frontend (port 3000)
2. Search for a procedure
3. Click "Save Search" - should work now
4. Click "Add Bookmark" on a result - should work now
5. Check browser console for any errors (Ctrl+Shift+K in most browsers)

## Note
After moving to production with real authentication, you should update the schema to use proper UUID foreign keys to `auth.users`.
