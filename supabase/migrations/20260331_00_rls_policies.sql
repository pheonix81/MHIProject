-- ============================================================================
-- Row Level Security (RLS) Policies
-- Healthcare Price Transparency Platform
-- Enforces data access control at the database level
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROCEDURES TABLE - Public read, admin write
-- ============================================================================
CREATE POLICY "procedures_public_read"
  ON public.procedures
  FOR SELECT
  USING (true); -- Anyone can read procedures

CREATE POLICY "procedures_admin_write"
  ON public.procedures
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  );

CREATE POLICY "procedures_admin_update"
  ON public.procedures
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  );

CREATE POLICY "procedures_admin_delete"
  ON public.procedures
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  );

-- ============================================================================
-- PROVIDERS TABLE - Public read, admin write
-- ============================================================================
CREATE POLICY "providers_public_read"
  ON public.providers
  FOR SELECT
  USING (true);

CREATE POLICY "providers_admin_write"
  ON public.providers
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  );

CREATE POLICY "providers_admin_update"
  ON public.providers
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  );

-- ============================================================================
-- PAYERS TABLE - Public read, admin write
-- ============================================================================
CREATE POLICY "payers_public_read"
  ON public.payers
  FOR SELECT
  USING (true);

CREATE POLICY "payers_admin_write"
  ON public.payers
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  );

CREATE POLICY "payers_admin_update"
  ON public.payers
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  );

-- ============================================================================
-- RATES TABLE - Public read, admin write
-- ============================================================================
CREATE POLICY "rates_public_read"
  ON public.rates
  FOR SELECT
  USING (true); -- Pricing data is public

CREATE POLICY "rates_admin_write"
  ON public.rates
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  );

CREATE POLICY "rates_admin_update"
  ON public.rates
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  );

-- ============================================================================
-- USERS TABLE - Users can read their own, admins can read all
-- ============================================================================
CREATE POLICY "users_read_own"
  ON public.users
  FOR SELECT
  USING (
    auth.uid() = id OR
    (
      auth.uid() IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'platform_admin'
      )
    )
  );

CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- SAVED_SEARCHES TABLE - Users can only access their own
-- ============================================================================
CREATE POLICY "saved_searches_user_read"
  ON public.saved_searches
  FOR SELECT
  USING (
    auth.uid()::text = user_id OR
    (
      auth.uid() IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'platform_admin'
      )
    )
  );

CREATE POLICY "saved_searches_user_insert"
  ON public.saved_searches
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "saved_searches_user_update"
  ON public.saved_searches
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "saved_searches_user_delete"
  ON public.saved_searches
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- BOOKMARKS TABLE - Users can only access their own
-- ============================================================================
CREATE POLICY "bookmarks_user_read"
  ON public.bookmarks
  FOR SELECT
  USING (
    auth.uid()::text = user_id OR
    (
      auth.uid() IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'platform_admin'
      )
    )
  );

CREATE POLICY "bookmarks_user_insert"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "bookmarks_user_delete"
  ON public.bookmarks
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- AUDIT_LOGS TABLE - Users can read their own, admins can read all
-- ============================================================================
CREATE POLICY "audit_logs_user_read"
  ON public.audit_logs
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    (
      auth.uid() IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'platform_admin'
      )
    )
  );

CREATE POLICY "audit_logs_admin_write"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (role = 'platform_admin' OR role = 'provider_admin')
    )
  );

-- ============================================================================
-- IMPORT_JOBS TABLE - Users can read their own, admins can read all
-- ============================================================================
CREATE POLICY "import_jobs_user_read"
  ON public.import_jobs
  FOR SELECT
  USING (
    auth.uid()::text = user_id OR
    (
      auth.uid() IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'platform_admin'
      )
    )
  );

CREATE POLICY "import_jobs_user_insert"
  ON public.import_jobs
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "import_jobs_user_update"
  ON public.import_jobs
  FOR UPDATE
  USING (
    (
      auth.uid()::text = user_id AND
      auth.uid() IS NOT NULL
    ) OR
    (
      auth.uid() IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'platform_admin'
      )
    )
  )
  WITH CHECK (
    (
      auth.uid()::text = user_id AND
      auth.uid() IS NOT NULL
    ) OR
    (
      auth.uid() IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'platform_admin'
      )
    )
  );

-- ============================================================================
-- Verify RLS is enabled
-- ============================================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
