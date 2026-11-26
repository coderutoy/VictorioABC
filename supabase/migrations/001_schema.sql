-- ============================================================================
-- Victorio ABC — Migration 001: Core Multi-Tenant Schema, Enums & Indexes
-- Target: Supabase (PostgreSQL 15+)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Domain Enums
CREATE TYPE public.branch_status AS ENUM ('active', 'inactive');
CREATE TYPE public.user_role AS ENUM ('patient', 'nurse', 'doctor', 'admin');
CREATE TYPE public.notif_pref AS ENUM ('sms', 'email', 'push', 'all', 'none');
CREATE TYPE public.notif_channel AS ENUM ('sms', 'email', 'push');
CREATE TYPE public.notif_status AS ENUM ('queued', 'sent', 'failed');
CREATE TYPE public.animal_status AS ENUM ('stray', 'domestic_vaccinated', 'domestic_unvaccinated', 'unknown');
CREATE TYPE public.who_category AS ENUM ('I', 'II', 'III');
CREATE TYPE public.case_status AS ENUM ('pending_triage', 'validated', 'completed', 'referred');
CREATE TYPE public.regimen_type AS ENUM ('ID', 'IM', 'booster');
CREATE TYPE public.pep_dose_day AS ENUM ('Day 0', 'Day 3', 'Day 7', 'Day 14', 'Day 28');
CREATE TYPE public.schedule_status AS ENUM ('scheduled', 'completed', 'defaulted', 'rescheduled');
CREATE TYPE public.inventory_item_type AS ENUM ('anti_rabies', 'erig', 'tetanus');
CREATE TYPE public.transfer_status AS ENUM ('pending', 'approved', 'received', 'rejected');

-- 2. Branches (Tenants)
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  barangay TEXT NOT NULL,
  municipality TEXT NOT NULL DEFAULT 'San Jose del Monte',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  contact_number TEXT NOT NULL,
  operating_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.branch_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Profiles (Linked to Supabase Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
  role public.user_role NOT NULL DEFAULT 'patient',
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  notif_pref public.notif_pref NOT NULL DEFAULT 'all',
  fcm_token TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_profile_branch_by_role CHECK (
    (role IN ('nurse', 'doctor') AND branch_id IS NOT NULL)
    OR (role IN ('patient', 'admin') AND branch_id IS NULL)
  )
);

-- 4. Patients (Global to Victorio ABC — Supports Both Mobile & Walk-In)
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  registered_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  qr_code_hash TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  full_name TEXT NOT NULL,
  phone TEXT,
  birthdate DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  address TEXT NOT NULL,
  barangay TEXT NOT NULL,
  municipality TEXT NOT NULL DEFAULT 'San Jose del Monte',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bite Cases (Branch-Scoped Episode of Care + HITL AI Validation)
CREATE TABLE public.bite_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  exposure_date DATE NOT NULL,
  animal_type TEXT NOT NULL,
  animal_status public.animal_status NOT NULL,
  bite_site TEXT NOT NULL,
  clinical_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  wound_image_url TEXT,
  ai_suggested_category public.who_category,
  ai_confidence NUMERIC(5, 4) CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)),
  doctor_validated_category public.who_category,
  ai_override_reason TEXT,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  clinical_notes TEXT,
  adverse_reactions TEXT,
  animal_observation_status TEXT NOT NULL DEFAULT 'under_observation'
    CHECK (animal_observation_status IN ('under_observation', 'alive_healthy', 'died', 'lost_stray', 'killed_tested')),
  animal_observation_updated_at TIMESTAMPTZ,
  certificate_code TEXT UNIQUE,
  certificate_signed_at TIMESTAMPTZ,
  status public.case_status NOT NULL DEFAULT 'pending_triage',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_validated_requires_doctor CHECK (
    (doctor_validated_category IS NULL) OR (doctor_id IS NOT NULL)
  )
);

-- 6. Clinical Orders (Doctor Prescriptions)
CREATE TABLE public.clinical_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.bite_cases(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  regimen_type public.regimen_type NOT NULL,
  erig_required BOOLEAN NOT NULL DEFAULT FALSE,
  tetanus_required BOOLEAN NOT NULL DEFAULT FALSE,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Vaccine Inventory (Branch Stock + HQ Central Stock when branch_id IS NULL)
CREATE TABLE public.vaccine_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
  item_type public.inventory_item_type NOT NULL,
  vaccine_name TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  lot_number TEXT NOT NULL,
  quantity_remaining INTEGER NOT NULL DEFAULT 0 CHECK (quantity_remaining >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
  expiration_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_inventory_branch_batch UNIQUE NULLS NOT DISTINCT (branch_id, item_type, batch_number, lot_number)
);

-- 8. PEP Schedules (Supports Cross-Branch Dose Administration)
CREATE TABLE public.pep_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.bite_cases(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  administered_branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
  dose_number public.pep_dose_day NOT NULL,
  scheduled_date DATE NOT NULL,
  administered_date TIMESTAMPTZ,
  nurse_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  inventory_batch_id UUID REFERENCES public.vaccine_inventory(id) ON DELETE RESTRICT,
  erig_inventory_batch_id UUID REFERENCES public.vaccine_inventory(id) ON DELETE RESTRICT,
  tetanus_inventory_batch_id UUID REFERENCES public.vaccine_inventory(id) ON DELETE RESTRICT,
  doses_deducted INTEGER NOT NULL DEFAULT 1 CHECK (doses_deducted > 0),
  reschedule_reason TEXT,
  rescheduled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.schedule_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_case_dose UNIQUE (case_id, dose_number),
  CONSTRAINT chk_completed_dose_fields CHECK (
    status <> 'completed' OR (
      administered_date IS NOT NULL
      AND nurse_id IS NOT NULL
      AND administered_branch_id IS NOT NULL
      AND inventory_batch_id IS NOT NULL
    )
  )
);

-- 9. Stock Transfers (HQ-to-Branch & Branch-to-Branch)
CREATE TABLE public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
  to_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  inventory_id UUID NOT NULL REFERENCES public.vaccine_inventory(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  received_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  notes TEXT,
  status public.transfer_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_distinct_transfer_branches CHECK (
    from_branch_id IS DISTINCT FROM to_branch_id
  )
);

-- 10. Notification Logs (Idempotent Cron Dispatch Tracking)
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  schedule_id UUID NOT NULL REFERENCES public.pep_schedules(id) ON DELETE CASCADE,
  channel public.notif_channel NOT NULL,
  recipient TEXT NOT NULL,
  scheduled_for_date DATE NOT NULL,
  provider_response JSONB,
  status public.notif_status NOT NULL DEFAULT 'queued',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_notif_idempotency UNIQUE (schedule_id, channel, scheduled_for_date)
);

-- 11. Audit Logs (Append-Only Governance Ledger)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Educational Content (Patient Mobile CMS)
CREATE TABLE public.educational_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('first_aid', 'animal_observation', 'pet_ownership', 'myth_busting', 'pep_guide')),
  body_content TEXT NOT NULL,
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Performance Indexes
CREATE INDEX idx_profiles_branch_role ON public.profiles(branch_id, role);
CREATE INDEX idx_patients_qr_hash ON public.patients(qr_code_hash);
CREATE INDEX idx_patients_barangay ON public.patients(LOWER(barangay));
CREATE INDEX idx_patients_name_phone ON public.patients(LOWER(full_name), phone);
CREATE INDEX idx_bite_cases_branch_status ON public.bite_cases(branch_id, status);
CREATE INDEX idx_bite_cases_patient ON public.bite_cases(patient_id, created_at DESC);
CREATE INDEX idx_bite_cases_exposure_date ON public.bite_cases(exposure_date);
CREATE INDEX idx_clinical_orders_case ON public.clinical_orders(case_id);
CREATE INDEX idx_clinical_orders_branch ON public.clinical_orders(branch_id);
CREATE INDEX idx_pep_schedules_branch_date_status ON public.pep_schedules(branch_id, scheduled_date, status);
CREATE INDEX idx_pep_schedules_admin_branch ON public.pep_schedules(administered_branch_id, administered_date);
CREATE INDEX idx_pep_schedules_case ON public.pep_schedules(case_id);
CREATE INDEX idx_inventory_branch_type_exp ON public.vaccine_inventory(branch_id, item_type, expiration_date);
CREATE INDEX idx_transfers_status_branches ON public.stock_transfers(status, to_branch_id, from_branch_id);
CREATE INDEX idx_audit_logs_branch_created ON public.audit_logs(branch_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- 14. Supabase Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('wound-images', 'wound-images', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('educational-media', 'educational-media', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
