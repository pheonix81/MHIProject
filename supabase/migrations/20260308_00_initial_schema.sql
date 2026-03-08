-- ============================================================================
-- Healthcare Price Transparency Platform - Initial Schema
-- ============================================================================
-- Tables: procedures, providers, payers, rates, users, audit_logs, file_uploads
-- RLS Policies: HIPAA-aligned row-level security
-- Created: 2026-03-08
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROCEDURES TABLE - CPT codes and market statistics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cpt_code VARCHAR(10) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(50),
  avg_market_price NUMERIC(10, 2),
  low_price NUMERIC(10, 2),
  high_price NUMERIC(10, 2),
  data_points INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_procedures_cpt_code ON public.procedures(cpt_code);
CREATE INDEX idx_procedures_category ON public.procedures(category);

-- ============================================================================
-- 2. PROVIDERS TABLE - Hospitals, clinics, ASCs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  npi VARCHAR(10) UNIQUE,
  provider_type VARCHAR(50), -- 'Hospital', 'Clinic', 'ASC', etc.
  address TEXT,
  city VARCHAR(100),
  zip_code VARCHAR(5),
  state VARCHAR(2),
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  phone VARCHAR(20),
  website VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_providers_zip_code ON public.providers(zip_code);
CREATE INDEX idx_providers_state ON public.providers(state);
CREATE INDEX idx_providers_npi ON public.providers(npi);
CREATE INDEX idx_providers_is_active ON public.providers(is_active);

-- ============================================================================
-- 3. PAYERS TABLE - Insurance companies, Medicare, Medicaid
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50), -- 'Commercial', 'Medicare', 'Medicaid', 'Tricare', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payers_type ON public.payers(type);

-- ============================================================================
-- 4. RATES TABLE - 1M+ PRICING RECORDS (DENORMALIZED FOR SPEED)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES public.payers(id) ON DELETE CASCADE,
  payer_name VARCHAR(255) NOT NULL, -- DENORMALIZED for fast search
  cash_price NUMERIC(10, 2),
  insurance_price NUMERIC(10, 2),
  insurance_type VARCHAR(50), -- 'PPO', 'HMO', 'HDHP', etc.
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE DEFAULT '2099-12-31',
  source_file VARCHAR(255), -- Reference to import file
  version INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRITICAL INDEXES for performance
CREATE INDEX idx_rates_procedure_provider_payer 
  ON public.rates(procedure_id, provider_id, payer_id);

CREATE INDEX idx_rates_zip_code 
  ON public.rates USING btree ((
    (SELECT zip_code FROM public.providers WHERE id = provider_id)
  ));

CREATE INDEX idx_rates_cpt_code 
  ON public.rates USING btree ((
    (SELECT cpt_code FROM public.procedures WHERE id = procedure_id)
  ));

CREATE INDEX idx_rates_provider_id ON public.rates(provider_id);
CREATE INDEX idx_rates_payer_id ON public.rates(payer_id);
CREATE INDEX idx_rates_updated_at ON public.rates(updated_at);

-- ============================================================================
-- 5. USERS TABLE - Linked to Supabase auth.users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'patient', -- 'patient', 'provider', 'payer_admin', 'platform_admin'
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  zip_code VARCHAR(5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

-- ============================================================================
-- 6. AUDIT_LOGS TABLE - HIPAA COMPLIANCE (APPEND-ONLY)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'VIEW_RATES', 'EXPORT_DATA', 'ADMIN_IMPORT', etc.
  resource_type VARCHAR(50), -- 'rates', 'procedure', 'provider', etc.
  resource_id UUID,
  changes JSONB, -- What changed (before/after)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id_created_at 
  ON public.audit_logs(user_id, created_at DESC);

CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================================
-- 7. FILE_UPLOADS TABLE - Track CSV/JSON imports
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(20), -- 'csv', 'json'
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  row_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  storage_path VARCHAR(255)
);

CREATE INDEX idx_file_uploads_uploaded_by ON public.file_uploads(uploaded_by);
CREATE INDEX idx_file_uploads_status ON public.file_uploads(status);
CREATE INDEX idx_file_uploads_created_at ON public.file_uploads(created_at DESC);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- 1. PROCEDURES - Public read, admin write
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "procedures_read_all" ON public.procedures
  FOR SELECT USING (true);

CREATE POLICY "procedures_write_admin" ON public.procedures
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'platform_admin'
  );

CREATE POLICY "procedures_update_admin" ON public.procedures
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'platform_admin'
  );

-- 2. PROVIDERS - Public read, provider/admin manage
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "providers_read_all" ON public.providers
  FOR SELECT USING (true);

CREATE POLICY "providers_write_admin" ON public.providers
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('provider', 'platform_admin')
  );

CREATE POLICY "providers_update_self_or_admin" ON public.providers
  FOR UPDATE USING (
    auth.uid() = id OR auth.jwt() ->> 'role' = 'platform_admin'
  );

-- 3. PAYERS - Public read, admin write
ALTER TABLE public.payers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payers_read_all" ON public.payers
  FOR SELECT USING (true);

CREATE POLICY "payers_write_admin" ON public.payers
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'platform_admin'
  );

-- 4. RATES - Public read, admin write
ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rates_read_all" ON public.rates
  FOR SELECT USING (true);

CREATE POLICY "rates_write_admin" ON public.rates
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'platform_admin'
  );

CREATE POLICY "rates_update_admin" ON public.rates
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'platform_admin'
  );

-- 5. USERS - Self-read, admin manage
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_self" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR auth.jwt() ->> 'role' = 'platform_admin'
  );

CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE USING (
    auth.uid() = id OR auth.jwt() ->> 'role' = 'platform_admin'
  );

-- 6. AUDIT_LOGS - Admin read only (append-only)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_read_admin" ON public.audit_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'platform_admin'
  );

CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- 7. FILE_UPLOADS - Self + admin read/write
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_uploads_read_self_or_admin" ON public.file_uploads
  FOR SELECT USING (
    auth.uid() = uploaded_by OR auth.jwt() ->> 'role' = 'platform_admin'
  );

CREATE POLICY "file_uploads_write_admin" ON public.file_uploads
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'platform_admin'
  );

-- ============================================================================
-- UPDATED_AT TIMESTAMP TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_procedures_updated_at
  BEFORE UPDATE ON public.procedures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER trigger_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER trigger_payers_updated_at
  BEFORE UPDATE ON public.payers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER trigger_rates_updated_at
  BEFORE UPDATE ON public.rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- ============================================================================
-- AUDIT LOGGING TRIGGER (for sensitive operations)
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_log_operation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id, action, resource_type, resource_id, changes, ip_address
    ) VALUES (
      auth.uid(),
      'DELETE_' || TG_TABLE_NAME,
      TG_TABLE_NAME,
      OLD.id,
      jsonb_build_object('deleted_record', row_to_json(OLD)),
      current_setting('request.headers')::json->>'x-forwarded-for'
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id, action, resource_type, resource_id, changes, ip_address
    ) VALUES (
      auth.uid(),
      'UPDATE_' || TG_TABLE_NAME,
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('before', row_to_json(OLD), 'after', row_to_json(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id, action, resource_type, resource_id, changes, ip_address
    ) VALUES (
      auth.uid(),
      'INSERT_' || TG_TABLE_NAME,
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('inserted_record', row_to_json(NEW))
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach audit trigger to sensitive tables
CREATE TRIGGER trigger_audit_rates
  AFTER INSERT OR UPDATE OR DELETE ON public.rates
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_operation();

CREATE TRIGGER trigger_audit_users
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_operation();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.procedures IS 'Healthcare CPT codes with market statistics';
COMMENT ON TABLE public.providers IS 'Healthcare providers (hospitals, clinics, ASCs)';
COMMENT ON TABLE public.payers IS 'Insurance companies and payer entities';
COMMENT ON TABLE public.rates IS '1M+ pricing records (denormalized for performance)';
COMMENT ON TABLE public.users IS 'User accounts linked to Supabase auth.users';
COMMENT ON TABLE public.audit_logs IS 'HIPAA compliance audit trail (append-only)';
COMMENT ON TABLE public.file_uploads IS 'Track CSV/JSON data imports';

COMMENT ON COLUMN public.rates.payer_name IS 'DENORMALIZED: Includes payer name for fast search without JOIN';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.procedures TO anon, authenticated;
GRANT SELECT ON public.providers TO anon, authenticated;
GRANT SELECT ON public.payers TO anon, authenticated;
GRANT SELECT ON public.rates TO anon, authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT INSERT, UPDATE ON public.users TO authenticated;
GRANT INSERT ON public.audit_logs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.procedures TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.rates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.file_uploads TO authenticated;
