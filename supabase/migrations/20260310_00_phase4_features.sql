-- ============================================================================
-- PHASE 4: Advanced Features Schema Updates
-- Saved Searches, Bookmarks, Audit Logs, Import Jobs
-- ============================================================================

-- 1. SAVED_SEARCHES TABLE
-- Allows users to save and reuse search queries
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  search_query JSONB NOT NULL,
  -- Query parameters stored as JSON:
  -- {
  --   "procedure": "string",
  --   "zip": "string",
  --   "minPrice": number,
  --   "maxPrice": number,
  --   "payer_id": "string",
  --   "limit": number,
  --   "offset": number
  -- }
  result_count INT DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON public.saved_searches(created_at DESC);

-- 2. BOOKMARKS TABLE
-- Allows users to bookmark specific pricing records
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  rate_id UUID NOT NULL REFERENCES public.rates(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, rate_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_rate_id ON public.bookmarks(rate_id);

-- 3. AUDIT_LOGS TABLE
-- Track all data modifications for HIPAA compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  action VARCHAR(50) NOT NULL,
  -- Action: CREATE, READ, UPDATE, DELETE, EXPORT, IMPORT
  table_name VARCHAR(50) NOT NULL,
  record_id UUID,
  changes JSONB,
  -- Changes: {before: {...}, after: {...}}
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 4. IMPORT_JOBS TABLE
-- Track data imports for validation and error handling
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  file_type VARCHAR(50),
  -- CSV, XLSX, JSON
  status VARCHAR(50) DEFAULT 'pending',
  -- pending, processing, completed, failed
  total_records INT DEFAULT 0,
  successful_records INT DEFAULT 0,
  failed_records INT DEFAULT 0,
  errors JSONB,
  -- Array of error objects: [{row: number, field: string, error: string}]
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_user_id ON public.import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON public.import_jobs(created_at DESC);

-- ============================================================================
-- VERIFY TABLES CREATED
-- ============================================================================

SELECT 'saved_searches' as table_name, COUNT(*) as count FROM public.saved_searches
UNION ALL
SELECT 'bookmarks', COUNT(*) FROM public.bookmarks
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM public.audit_logs
UNION ALL
SELECT 'import_jobs', COUNT(*) FROM public.import_jobs;
