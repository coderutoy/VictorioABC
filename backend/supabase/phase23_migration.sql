-- ============================================================================
-- Victorio ABC — Phase 2.3.1 Master Idempotent Supabase SQL Migration
-- File: backend/supabase/phase23_migration.sql
-- Instructions: Paste into Supabase SQL Editor and click "Run"
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Extend public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS prc_license_number TEXT,
  ADD COLUMN IF NOT EXISTS prc_expiry_date DATE DEFAULT '2028-06-30',
  ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark')),
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{"critical_clinical":true,"cold_chain":true,"inventory_alerts":true,"sound_alerts":false}'::jsonb;

UPDATE public.profiles
SET prc_license_number = license_number
WHERE prc_license_number IS NULL AND license_number IS NOT NULL;

-- 2. Extend public.clinical_cases
ALTER TABLE public.clinical_cases
  ADD COLUMN IF NOT EXISTS patient_weight_kg NUMERIC(5,2) DEFAULT 60.0,
  ADD COLUMN IF NOT EXISTS prior_pep_within_3_months BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS allergies TEXT DEFAULT 'None reported',
  ADD COLUMN IF NOT EXISTS is_pregnant BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS anatomical_site TEXT,
  ADD COLUMN IF NOT EXISTS is_high_risk_cat3 BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS regimen_type TEXT DEFAULT 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
  ADD COLUMN IF NOT EXISTS erig_hrig_type TEXT DEFAULT 'None',
  ADD COLUMN IF NOT EXISTS erig_hrig_iu NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS erig_hrig_ml NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS doctor_prc_signoff_license TEXT,
  ADD COLUMN IF NOT EXISTS doctor_prc_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS philhealth_abtp_validated BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.clinical_cases
SET
  anatomical_site = COALESCE(anatomical_site, wound_site),
  is_high_risk_cat3 = (exposure_category = 'III')
WHERE anatomical_site IS NULL;

-- 3. Extend public.pep_doses
ALTER TABLE public.pep_doses
  ADD COLUMN IF NOT EXISTS batch_lot_number TEXT,
  ADD COLUMN IF NOT EXISTS inventory_id UUID REFERENCES public.vaccine_inventory(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reconstituted_vial_id UUID,
  ADD COLUMN IF NOT EXISTS administered_by_prc TEXT;

UPDATE public.pep_doses
SET batch_lot_number = lot_number
WHERE batch_lot_number IS NULL AND lot_number IS NOT NULL;

-- 4. Create public.ai_triage_submissions
CREATE TABLE IF NOT EXISTS public.ai_triage_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.clinical_cases(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  wound_image_url TEXT NOT NULL,
  ai_predicted_category TEXT NOT NULL CHECK (ai_predicted_category IN ('I', 'II', 'III')),
  confidence_score NUMERIC(5,2) NOT NULL,
  anatomical_risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'confirmed', 'overridden')),
  doctor_final_category TEXT CHECK (doctor_final_category IN ('I', 'II', 'III')),
  override_reason TEXT,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_triage_branch_status
  ON public.ai_triage_submissions(branch_id, verification_status, created_at DESC);

-- 5. Create public.reconstituted_vials
CREATE TABLE IF NOT EXISTS public.reconstituted_vials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  inventory_id UUID REFERENCES public.vaccine_inventory(id) ON DELETE SET NULL,
  vaccine_name TEXT NOT NULL,
  lot_number TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  total_doses INT NOT NULL DEFAULT 5,
  administered_doses INT NOT NULL DEFAULT 0,
  wasted_doses INT NOT NULL DEFAULT 0,
  opened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconstituted_vials_branch_status
  ON public.reconstituted_vials(branch_id, status, expires_at);

-- 6. Create public.cold_chain_logs
CREATE TABLE IF NOT EXISTS public.cold_chain_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  temperature_c NUMERIC(4,1) NOT NULL,
  is_breach BOOLEAN NOT NULL DEFAULT FALSE,
  shift_label TEXT NOT NULL,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cold_chain_branch_recorded
  ON public.cold_chain_logs(branch_id, recorded_at DESC);

-- 7. Create public.billing_transactions
CREATE TABLE IF NOT EXISTS public.billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  case_id UUID REFERENCES public.clinical_cases(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  amount_php NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_php NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'gcash_maya', 'card', 'hmo', 'philhealth_abtp')),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending_philhealth', 'voided')),
  void_reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_branch_created
  ON public.billing_transactions(branch_id, status, created_at DESC);

-- 8. Create public.aefi_reports
CREATE TABLE IF NOT EXISTS public.aefi_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.clinical_cases(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  symptoms TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aefi_branch_created
  ON public.aefi_reports(branch_id, created_at DESC);

-- 9. Create public.defaulter_call_logs
CREATE TABLE IF NOT EXISTS public.defaulter_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dose_id UUID REFERENCES public.pep_doses(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.clinical_cases(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  nurse_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  outcome TEXT NOT NULL,
  notes TEXT,
  called_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_defaulter_calls_branch
  ON public.defaulter_call_logs(branch_id, called_at DESC);

-- 10. Create public.audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_branch_created
  ON public.audit_logs(branch_id, created_at DESC);

-- 11. Enable RLS & Grants for Authenticated Staff + Service Role
ALTER TABLE public.ai_triage_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconstituted_vials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cold_chain_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aefi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defaulter_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE
  public.branches,
  public.profiles,
  public.patients,
  public.clinical_cases,
  public.pep_doses,
  public.vaccine_inventory,
  public.ai_triage_submissions,
  public.reconstituted_vials,
  public.cold_chain_logs,
  public.billing_transactions,
  public.aefi_reports,
  public.defaulter_call_logs,
  public.audit_logs
TO authenticated, service_role;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'ai_triage_submissions',
    'reconstituted_vials',
    'cold_chain_logs',
    'billing_transactions',
    'aefi_reports',
    'defaulter_call_logs',
    'audit_logs'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%I_staff_branch_access" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "%I_staff_branch_access" ON public.%I FOR ALL TO authenticated USING (public.current_staff_role() = ''admin'' OR branch_id IS NULL OR branch_id = public.current_staff_branch_id()) WITH CHECK (public.current_staff_role() = ''admin'' OR branch_id IS NULL OR branch_id = public.current_staff_branch_id())',
      tbl,
      tbl
    );
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
