-- ============================================================================
-- HEALTHCARE PRICE TRANSPARENCY - COMPLETE SETUP
-- Schema + Dummy Data
-- Paste this entire script into Supabase SQL Editor and click RUN
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- 1. PROCEDURES
CREATE TABLE IF NOT EXISTS public.procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cpt_code VARCHAR(10) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(50),
  cost_index NUMERIC(5, 2) DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_procedures_cpt_code ON public.procedures(cpt_code);

-- 2. PROVIDERS
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

CREATE INDEX IF NOT EXISTS idx_providers_zip ON public.providers(zip);

-- 3. PAYERS
CREATE TABLE IF NOT EXISTS public.payers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RATES
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

CREATE INDEX IF NOT EXISTS idx_rates_procedure_provider_payer ON public.rates(procedure_id, provider_id, payer_id);
CREATE INDEX IF NOT EXISTS idx_rates_procedure ON public.rates(procedure_id);
CREATE INDEX IF NOT EXISTS idx_rates_provider ON public.rates(provider_id);
CREATE INDEX IF NOT EXISTS idx_rates_payer ON public.rates(payer_id);

-- 5. USERS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'patient',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================================================
-- INSERT DUMMY DATA
-- ============================================================================

-- Insert Procedures
INSERT INTO public.procedures (cpt_code, description, category, cost_index)
VALUES
  ('99213', 'Office Visit - Established Patient (Low)', 'Office Visit', 1.0),
  ('99214', 'Office Visit - Established Patient (Moderate)', 'Office Visit', 1.5),
  ('99215', 'Office Visit - Established Patient (High)', 'Office Visit', 2.0),
  ('99204', 'Office Visit - New Patient (Moderate)', 'Office Visit', 2.0),
  ('99205', 'Office Visit - New Patient (High)', 'Office Visit', 3.0),
  ('27447', 'Knee Arthroscopy with Repair', 'Orthopedic Surgery', 10.0),
  ('29881', 'Knee Arthroscopy with Meniscectomy', 'Orthopedic Surgery', 9.0),
  ('70450', 'CT Head/Brain without Contrast', 'Imaging', 5.0),
  ('71046', 'Chest X-ray (2 Views)', 'Imaging', 1.0),
  ('76700', 'Abdominal Ultrasound', 'Imaging', 3.0)
ON CONFLICT (cpt_code) DO NOTHING;

-- Insert Providers
INSERT INTO public.providers (name, city, state, zip, latitude, longitude)
VALUES
  ('Stanford Medical Center', 'Palo Alto', 'CA', '94301', 37.4249, -122.1656),
  ('UCSF Medical Center', 'San Francisco', 'CA', '94143', 37.7619, -122.4580),
  ('Kaiser Permanente', 'Oakland', 'CA', '94612', 37.8044, -122.2712),
  ('Sutter Health', 'Sacramento', 'CA', '95814', 38.5816, -121.4944),
  ('Bay Medical Center', 'San Jose', 'CA', '95128', 37.3382, -121.8863)
ON CONFLICT DO NOTHING;

-- Insert Payers
INSERT INTO public.payers (name, type)
VALUES
  ('UnitedHealthcare', 'PPO'),
  ('Anthem Blue Cross', 'PPO'),
  ('Aetna', 'HMO'),
  ('Cigna', 'PPO'),
  ('Medicare', 'Government'),
  ('Medicaid', 'Government')
ON CONFLICT (name) DO NOTHING;

-- Insert Sample Rates (100 records)
-- This creates realistic pricing combinations
DO $$
DECLARE
  proc_ids UUID[];
  prov_ids UUID[];
  payer_ids UUID[];
  i INT;
  base_cost NUMERIC;
  variance NUMERIC;
  cash_price NUMERIC;
  allowed_amount NUMERIC;
BEGIN
  -- Get all IDs
  SELECT ARRAY_AGG(id) INTO proc_ids FROM public.procedures;
  SELECT ARRAY_AGG(id) INTO prov_ids FROM public.providers;
  SELECT ARRAY_AGG(id) INTO payer_ids FROM public.payers;

  -- Generate 100 rate records
  FOR i IN 1..100 LOOP
    base_cost := 150 + (RANDOM() * 5000)::NUMERIC;
    variance := (0.7 + RANDOM() * 0.6)::NUMERIC;
    cash_price := ROUND(base_cost * variance);
    allowed_amount := ROUND(cash_price * (0.6 + RANDOM() * 0.3));

    INSERT INTO public.rates (
      procedure_id,
      provider_id,
      payer_id,
      cash_price,
      insurance_price,
      insurance_allowed_amount,
      sample_size,
      min_price,
      max_price,
      p25_price,
      p50_price,
      p75_price,
      p90_price,
      data_quality_score
    ) VALUES (
      proc_ids[1 + (i % ARRAY_LENGTH(proc_ids, 1))],
      prov_ids[1 + ((i * 2) % ARRAY_LENGTH(prov_ids, 1))],
      payer_ids[1 + ((i * 3) % ARRAY_LENGTH(payer_ids, 1))],
      cash_price,
      ROUND(allowed_amount * 0.8),
      allowed_amount,
      (50 + (RANDOM() * 950))::INT,
      ROUND(cash_price * 0.7),
      ROUND(cash_price * 1.5),
      ROUND(cash_price * 0.8),
      ROUND(cash_price * 1.0),
      ROUND(cash_price * 1.2),
      ROUND(cash_price * 1.4),
      (0.7 + RANDOM() * 0.3)::NUMERIC(3, 2)
    );
  END LOOP;

  RAISE NOTICE 'Inserted 100 rates successfully';
END $$;

-- ============================================================================
-- VERIFY DATA
-- ============================================================================

SELECT 'Procedures created' as status, COUNT(*) as count FROM public.procedures
UNION ALL
SELECT 'Providers created', COUNT(*) FROM public.providers
UNION ALL
SELECT 'Payers created', COUNT(*) FROM public.payers
UNION ALL
SELECT 'Rates created', COUNT(*) FROM public.rates;
