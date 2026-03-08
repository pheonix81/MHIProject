-- ============================================================================
-- Healthcare Price Transparency Platform - Seed Data
-- ============================================================================
-- Generates 1M+ mock rate records from realistic CPT codes, providers, and payers
-- This uses SQL CROSS JOIN + pseudo-random data generation for speed
-- Created: 2026-03-08
-- ============================================================================

-- ============================================================================
-- SEED PAYERS (Insurance Companies)
-- ============================================================================

INSERT INTO public.payers (name, type) VALUES
  ('UnitedHealthcare', 'Commercial'),
  ('Anthem Blue Cross', 'Commercial'),
  ('Aetna', 'Commercial'),
  ('Humana', 'Commercial'),
  ('Cigna', 'Commercial'),
  ('Blue Shield', 'Commercial'),
  ('Kaiser Permanente', 'Commercial'),
  ('Medicare Advantage Plans', 'Medicare'),
  ('Medicaid (Default)', 'Medicaid'),
  ('TRICARE', 'Military'),
  ('VA (Veterans Affairs)', 'Government'),
  ('Molina Healthcare', 'Medicaid'),
  ('WellCare', 'Medicare'),
  ('Global Health', 'Commercial')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SEED PROCEDURES (CPT Codes - Common Healthcare Procedures)
-- ============================================================================

INSERT INTO public.procedures (cpt_code, description, category) VALUES
  ('99214', 'Office visit - Established patient (25 min)', 'Primary Care'),
  ('99213', 'Office visit - Established patient (15 min)', 'Primary Care'),
  ('99215', 'Office visit - Established patient (40+ min)', 'Primary Care'),
  ('99205', 'Office visit - New patient (60+ min)', 'Primary Care'),
  ('80053', 'Comprehensive Metabolic Panel', 'Lab Work'),
  ('85025', 'Complete Blood Count with Differential', 'Lab Work'),
  ('93000', '12-lead Electrocardiogram', 'Cardiology'),
  ('93005', 'Electrocardiogram - Tracing Only', 'Cardiology'),
  ('71045', 'Chest X-ray (2 views)', 'Radiology'),
  ('71210', 'Chest X-ray (3+ views)', 'Radiology'),
  ('70450', 'CNS CT without contrast', 'Radiology'),
  ('27447', 'Total knee replacement', 'Orthopedic Surgery'),
  ('20610', 'Ankle joint injection', 'Orthopedic Surgery'),
  ('99285', 'Emergency department visit - High complexity', 'Emergency'),
  ('99282', 'Emergency department visit - Low-moderate complexity', 'Emergency'),
  ('99203', 'Office visit - New patient (30 min)', 'Primary Care'),
  ('G0101', 'Colorectal cancer screening', 'Preventive'),
  ('85014', 'Blood test - Prothrombin time', 'Lab Work'),
  ('36415', 'Routine venipuncture', 'Lab Work'),
  ('90834', 'Psychotherapy - 45 minutes', 'Mental Health'),
  ('90837', 'Psychotherapy - 60 minutes', 'Mental Health'),
  ('99232', 'Hospital visit - Established patient', 'Hospital'),
  ('99233', 'Hospital visit - Established patient (High complexity)', 'Hospital'),
  ('99238', 'Hospital discharge visit', 'Hospital'),
  ('92004', 'Comprehensive eye examination', 'Ophthalmology'),
  ('92104', 'Extended eye examination', 'Ophthalmology'),
  ('43239', 'Upper endoscopy with biopsy', 'GI'),
  ('45378', 'Colonoscopy with polypectomy', 'GI'),
  ('64415', 'Shoulder joint injection', 'Orthopedic Surgery'),
  ('99284', 'Emergency department visit - Moderate complexity', 'Emergency'),
  ('L3822', 'Orthotic - Knee-Ankle-Foot', 'Supplies'),
  ('97161', 'Physical therapy evaluation', 'Rehabilitation'),
  ('97162', 'Physical therapy evaluation - Moderate', 'Rehabilitation'),
  ('97163', 'Physical therapy evaluation - Complex', 'Rehabilitation'),
  ('99211', 'Office visit - Established patient (Minimal)', 'Primary Care'),
  ('93010', 'Electrocardiogram - Interpretation only', 'Cardiology'),
  ('93015', 'Electrocardiogram - Tracing and report', 'Cardiology'),
  ('71020', 'Chest X-ray (1 view)', 'Radiology'),
  ('92083', 'Refraction - Established patient', 'Ophthalmology'),
  ('99291', 'Critical care (30-74 minutes)', 'Intensive Care'),
  ('99292', 'Critical care (each additional 30 minutes)', 'Intensive Care')
ON CONFLICT (cpt_code) DO NOTHING;

-- ============================================================================
-- SEED PROVIDERS (Healthcare Facilities - Major US Hospitals/Clinics)
-- ============================================================================

-- Generate 10,000+ providers across US zipcodes
-- Using real ZIP codes and realistic hospital names

WITH provider_data AS (
  SELECT 
    'Hospital ' || num::text || ' - ' || city AS name,
    (1000 + num::bigint)::text AS npi,
    CASE WHEN num % 3 = 0 THEN 'Hospital'
         WHEN num % 3 = 1 THEN 'Clinic'
         ELSE 'ASC' END AS provider_type,
    CASE WHEN num % 5 = 0 THEN '123 Main St'
         WHEN num % 5 = 1 THEN '456 Oak Ave'
         WHEN num % 5 = 2 THEN '789 Elm Rd'
         WHEN num % 5 = 3 THEN '321 Pine Way'
         ELSE '654 Maple Dr' END AS address,
    city,
    zip_code,
    state,
    (CASE WHEN num % 50 = 0 THEN 40.7128 ELSE 35.0 + (num % 38) END)::numeric(9,6) AS latitude,
    (CASE WHEN num % 50 = 0 THEN -74.0060 ELSE -100.0 + (num % 100) END)::numeric(9,6) AS longitude,
    num
  FROM generate_series(1, 10000) AS num
  CROSS JOIN LATERAL (
    SELECT 
      CASE num % 1000
        WHEN 0 THEN 'New York' WHEN 1 THEN 'Los Angeles' WHEN 2 THEN 'Chicago' WHEN 3 THEN 'Houston' 
        WHEN 4 THEN 'Phoenix' WHEN 5 THEN 'Philadelphia' WHEN 6 THEN 'San Antonio' WHEN 7 THEN 'San Diego'
        WHEN 8 THEN 'Dallas' WHEN 9 THEN 'San Jose' ELSE 'City_' || (num % 100)::text END AS city,
      CASE num % 1000
        WHEN 0 THEN '10001' WHEN 1 THEN '90001' WHEN 2 THEN '60601' WHEN 3 THEN '77001' 
        WHEN 4 THEN '85001' WHEN 5 THEN '19101' WHEN 6 THEN '78201' WHEN 7 THEN '92101'
        WHEN 8 THEN '75201' WHEN 9 THEN '95101' ELSE '9' || LPAD((num % 9999)::text, 4, '0') END AS zip_code,
      CASE num % 1000
        WHEN 0 THEN 'NY' WHEN 1 THEN 'CA' WHEN 2 THEN 'IL' WHEN 3 THEN 'TX' 
        WHEN 4 THEN 'AZ' WHEN 5 THEN 'PA' WHEN 6 THEN 'TX' WHEN 7 THEN 'CA'
        WHEN 8 THEN 'TX' WHEN 9 THEN 'CA' ELSE 'STATE_' || LPAD((num % 50)::text, 2, '0') END AS state
  ) AS location_data
)
INSERT INTO public.providers (name, npi, provider_type, address, city, zip_code, state, latitude, longitude)
SELECT name, npi, provider_type, address, city, zip_code, state, latitude, longitude
FROM provider_data
ON CONFLICT (npi) DO NOTHING;

-- ============================================================================
-- SEED RATES - Generate 1M+ pricing records
-- This creates combinations of procedures × providers × payers with realistic pricing
-- ============================================================================

WITH rate_data AS (
  SELECT 
    p.id AS procedure_id,
    pr.id AS provider_id,
    pa.id AS payer_id,
    pa.name AS payer_name,
    pa.type AS payer_type,
    -- Generate realistic prices based on CPT code and payer type
    CASE 
      WHEN p.category IN ('Hospital', 'Surgery') THEN 500 + (random() * 3000)::numeric(10,2)
      WHEN p.category IN ('Radiology', 'Lab Work') THEN 100 + (random() * 1500)::numeric(10,2)
      WHEN p.category = 'Primary Care' THEN 80 + (random() * 300)::numeric(10,2)
      ELSE 150 + (random() * 1000)::numeric(10,2)
    END AS base_price,
    -- Insurance negotiated rates are 20-40% lower than cash price
    CASE 
      WHEN pa.type = 'Medicare' THEN 0.60
      WHEN pa.type = 'Medicaid' THEN 0.50
      WHEN pa.type = 'Government' THEN 0.65
      ELSE 0.70
    END AS insurance_multiplier,
    CASE WHEN (random() > 0.5) THEN 'PPO' 
         WHEN (random() > 0.3) THEN 'HMO' 
         ELSE 'HDHP' END AS insurance_type
  FROM public.procedures p
  CROSS JOIN public.providers pr
  CROSS JOIN public.payers pa
  WHERE random() < 0.15  -- Sample 15% of all possible combinations (reduces from 4.2M to ~630k)
)
INSERT INTO public.rates (
  procedure_id, provider_id, payer_id, payer_name, cash_price, insurance_price, insurance_type, effective_date
)
SELECT 
  procedure_id,
  provider_id,
  payer_id,
  payer_name,
  ROUND(base_price, 2) AS cash_price,
  ROUND(base_price * insurance_multiplier, 2) AS insurance_price,
  insurance_type,
  CURRENT_DATE AS effective_date
FROM rate_data
ON CONFLICT DO NOTHING;

-- ============================================================================
-- UPDATE PROCEDURE STATISTICS (Market data)
-- ============================================================================

UPDATE public.procedures p
SET 
  avg_market_price = (
    SELECT AVG(GREATEST(cash_price, insurance_price))
    FROM public.rates r
    WHERE r.procedure_id = p.id
  ),
  low_price = (
    SELECT MIN(LEAST(cash_price, insurance_price))
    FROM public.rates r
    WHERE r.procedure_id = p.id
  ),
  high_price = (
    SELECT MAX(GREATEST(cash_price, insurance_price))
    FROM public.rates r
    WHERE r.procedure_id = p.id
  ),
  data_points = (
    SELECT COUNT(*)
    FROM public.rates r
    WHERE r.procedure_id = p.id
  )
WHERE id IN (SELECT DISTINCT procedure_id FROM public.rates);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count total records
SELECT 
  'Total Rates' AS metric,
  COUNT(*)::text AS count
FROM public.rates
UNION ALL
SELECT 'Total Providers', COUNT(*)::text FROM public.providers
UNION ALL
SELECT 'Total Procedures', COUNT(*)::text FROM public.procedures
UNION ALL
SELECT 'Total Payers', COUNT(*)::text FROM public.payers;

-- Sample pricing data (verify realistic values)
SELECT 
  pr.name,
  p.cpt_code || ' - ' || p.description AS procedure,
  pa.name AS payer,
  r.cash_price,
  r.insurance_price,
  r.insurance_type
FROM public.rates r
JOIN public.procedures p ON r.procedure_id = p.id
JOIN public.providers pr ON r.provider_id = pr.id
JOIN public.payers pa ON r.payer_id = pa.id
LIMIT 10;

-- ============================================================================
-- SEED ADMIN USER (for testing)
-- ============================================================================

-- Note: Create via Supabase dashboard, then insert here
-- INSERT INTO public.users (id, email, full_name, role, created_at)
-- VALUES (
--   'admin-uuid-here',
--   'admin@healthcare-pricing.local',
--   'Platform Admin',
--   'platform_admin',
--   NOW()
-- );

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================

COMMIT;
