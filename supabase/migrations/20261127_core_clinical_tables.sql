-- ============================================================================
-- Victorio ABC — Phase 2.2 Core Clinical Tables, Seeds & Row-Level Security
-- Target: Supabase PostgreSQL (https://sjhascvejmnqoovqcbui.supabase.co)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop conflicting legacy tables if they exist from older draft schemas
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.stock_transfers CASCADE;
DROP TABLE IF EXISTS public.pep_schedules CASCADE;
DROP TABLE IF EXISTS public.clinical_orders CASCADE;
DROP TABLE IF EXISTS public.bite_cases CASCADE;
DROP TABLE IF EXISTS public.pep_doses CASCADE;
DROP TABLE IF EXISTS public.clinical_cases CASCADE;
DROP TABLE IF EXISTS public.vaccine_inventory CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;

-- ============================================================================
-- 1. branches (7 Official Victorio Animal Bite Center Locations)
-- ============================================================================
CREATE TABLE public.branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  maps_query TEXT NOT NULL,
  phone TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.branches (id, name, address, maps_query, phone, lat, lng, is_active)
VALUES
  (
    'baliwag',
    'Victorio ABC — Baliwag, Bulacan',
    '347 Benigno S. Aquino Avenue, Baliwag, Bulacan',
    '347 Benigno S. Aquino Avenue, Baliwag, Bulacan',
    '09933269641',
    14.9556,
    120.9009,
    TRUE
  ),
  (
    'santa-maria',
    'Victorio ABC — Santa Maria, Bulacan',
    'Santa Maria Bypass Rd, Santa Maria, Bulacan',
    'RXF3+GR7, Santa Maria Bypass Rd, Santa Maria, Bulacan',
    '09454378284',
    14.8238,
    120.9545,
    TRUE
  ),
  (
    'pandi',
    'Victorio ABC — Mapulang Lupa, Pandi',
    '98 Pandi Angat Rd, Mapulang Lupa, Pandi, Bulacan',
    '98 Pandi Angat Rd, Pandi, Bulacan',
    '09101909050',
    14.8777,
    120.9619,
    TRUE
  ),
  (
    'drt',
    'Victorio ABC — DRT, Bulacan',
    '201 M. Valte Road, Pulong Sampalok, Doña Remedios Trinidad, Bulacan',
    '201 M. Valte Road, Pulong Sampalok, Doña Remedios Trinidad, Bulacan',
    '09751861541',
    14.9964,
    121.0853,
    TRUE
  ),
  (
    'meycauayan-camalig',
    'Victorio ABC — Meycauayan, Bulacan (Camalig)',
    'Blk 63 Lot 9 El Camino Real, Camalig, Meycauayan, Bulacan',
    'Blk 63 Lot 9 El Camino Real, Camalig, Meycauayan, Bulacan',
    '09517734066',
    14.7664,
    120.9994,
    TRUE
  ),
  (
    'meycauayan-poblacion',
    'Victorio ABC — Poblacion / Calvario, Meycauayan',
    '009 Pacheco Street, Calvario, Meycauayan, 3020 Bulacan',
    '009 Pacheco Street, Calvario, Meycauayan, 3020 Bulacan',
    '09101909050',
    14.7369,
    120.9606,
    TRUE
  ),
  (
    'cefels-caloocan',
    'Victorio ABC — Cefels, Caloocan',
    'Flojems Building Second Floor, Cefels, Caloocan, 1427 Metro Manila',
    'Flojems Building Second Floor, Cefels, Caloocan, 1427 Metro Manila',
    '09453311310',
    14.7566,
    121.0445,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  maps_query = EXCLUDED.maps_query,
  phone = EXCLUDED.phone,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- 2. profiles (Linked to Supabase auth.users)
--    - admin & patient: branch_id is NULL (global / unrestricted branch login)
--    - doctor & nurse : branch_id is NOT NULL (strictly locked to assigned branch)
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'patient')),
  branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
  license_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_staff_branch_assignment CHECK (
    (role IN ('doctor', 'nurse') AND branch_id IS NOT NULL)
    OR (role IN ('admin', 'patient'))
  )
);

CREATE INDEX idx_profiles_branch_role ON public.profiles(branch_id, role);

-- ============================================================================
-- 3. patients (AES-256-GCM Encrypted PII Records)
-- ============================================================================
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  patient_code TEXT UNIQUE NOT NULL,
  full_name_enc TEXT NOT NULL,
  phone_enc TEXT,
  address_enc TEXT,
  age INT,
  sex TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_branch ON public.patients(branch_id, created_at DESC);
CREATE INDEX idx_patients_code ON public.patients(patient_code);

-- ============================================================================
-- 4. clinical_cases (Nurse Intake, Doctor WHO Cat I-III Assessment & Orders)
-- ============================================================================
CREATE TABLE public.clinical_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  animal_type TEXT NOT NULL CHECK (animal_type IN ('dog', 'cat', 'other')),
  exposure_category TEXT CHECK (exposure_category IN ('I', 'II', 'III')),
  wound_site TEXT,
  exposure_date DATE,
  status TEXT NOT NULL DEFAULT 'queued_nurse' CHECK (status IN ('queued_nurse', 'pending_doctor', 'active_pep', 'completed')),
  assessed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  erig_required BOOLEAN NOT NULL DEFAULT FALSE,
  tetanus_given BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clinical_cases_branch_status ON public.clinical_cases(branch_id, status, created_at DESC);
CREATE INDEX idx_clinical_cases_patient ON public.clinical_cases(patient_id);

-- ============================================================================
-- 5. pep_doses (Day 0, 3, 7, 14, 28 Schedule & Nurse Administration Tracking)
-- ============================================================================
CREATE TABLE public.pep_doses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.clinical_cases(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  dose_day INT NOT NULL CHECK (dose_day IN (0, 3, 7, 14, 28)),
  scheduled_date DATE NOT NULL,
  administered_at TIMESTAMPTZ,
  administered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vaccine_brand TEXT,
  lot_number TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed'))
);

CREATE INDEX idx_pep_doses_branch_date ON public.pep_doses(branch_id, scheduled_date, status);
CREATE INDEX idx_pep_doses_case ON public.pep_doses(case_id, dose_day);

-- ============================================================================
-- 6. vaccine_inventory (Live Stock Vials per Branch)
-- ============================================================================
CREATE TABLE public.vaccine_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('vaccine', 'erig', 'tetanus')),
  batch_number TEXT,
  stock_vials INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 10,
  expiry_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_branch_item_batch UNIQUE (branch_id, item_name, batch_number)
);

CREATE INDEX idx_vaccine_inventory_branch ON public.vaccine_inventory(branch_id, category);

-- Seed initial stock items (Verorab PVRV, Speeda PVRV, Equirab ERIG, Tetanus Toxoid) for all 7 branches
INSERT INTO public.vaccine_inventory (branch_id, item_name, category, batch_number, stock_vials, reorder_level, expiry_date)
SELECT
  b.id,
  item.item_name,
  item.category,
  item.batch_prefix || '-' || UPPER(SUBSTRING(b.id FROM 1 FOR 3)),
  item.stock_vials,
  item.reorder_level,
  item.expiry_date::DATE
FROM public.branches b
CROSS JOIN (
  VALUES
    ('Verorab PVRV', 'vaccine', 'VRB-2026', 45, 12, '2027-11-30'),
    ('Speeda PVRV', 'vaccine', 'SPD-2026', 60, 15, '2027-12-31'),
    ('Equirab ERIG', 'erig', 'EQR-2026', 18, 10, '2027-09-30'),
    ('Tetanus Toxoid', 'tetanus', 'TTX-2026', 50, 15, '2028-03-31')
) AS item(item_name, category, batch_prefix, stock_vials, reorder_level, expiry_date)
ON CONFLICT (branch_id, item_name, batch_number) DO UPDATE SET
  stock_vials = EXCLUDED.stock_vials,
  reorder_level = EXCLUDED.reorder_level,
  expiry_date = EXCLUDED.expiry_date,
  updated_at = NOW();

-- ============================================================================
-- 7. Row Level Security (RLS) & Non-Recursive Helper Functions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()),
    (auth.jwt() -> 'user_metadata' ->> 'role')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_staff_branch_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.branch_id FROM public.profiles p WHERE p.id = auth.uid()),
    (auth.jwt() -> 'user_metadata' ->> 'branch_id')
  );
$$;

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pep_doses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_inventory ENABLE ROW LEVEL SECURITY;

-- branches: readable by everyone (public branch directory + authenticated staff)
DROP POLICY IF EXISTS "branches_select_all" ON public.branches;
CREATE POLICY "branches_select_all"
  ON public.branches FOR SELECT
  USING (true);

-- profiles: users can read their own row; admin can read all profiles; doctor/nurse can read profiles in their assigned branch
DROP POLICY IF EXISTS "profiles_select_own_or_branch" ON public.profiles;
CREATE POLICY "profiles_select_own_or_branch"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.current_staff_role() = 'admin'
    OR (
      public.current_staff_role() IN ('doctor', 'nurse')
      AND branch_id = public.current_staff_branch_id()
    )
  );

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR public.current_staff_role() = 'admin'
  )
  WITH CHECK (
    id = auth.uid()
    OR public.current_staff_role() = 'admin'
  );

-- patients: admin has global access across all branches; doctor & nurse strictly locked to their assigned branch_id
DROP POLICY IF EXISTS "patients_branch_staff_all" ON public.patients;
CREATE POLICY "patients_branch_staff_all"
  ON public.patients FOR ALL
  TO authenticated
  USING (
    public.current_staff_role() = 'admin'
    OR (
      public.current_staff_role() IN ('doctor', 'nurse')
      AND branch_id = public.current_staff_branch_id()
    )
  )
  WITH CHECK (
    public.current_staff_role() = 'admin'
    OR (
      public.current_staff_role() IN ('doctor', 'nurse')
      AND branch_id = public.current_staff_branch_id()
    )
  );

-- clinical_cases: admin has global access across all branches; doctor & nurse strictly locked to their assigned branch_id
DROP POLICY IF EXISTS "clinical_cases_branch_staff_all" ON public.clinical_cases;
CREATE POLICY "clinical_cases_branch_staff_all"
  ON public.clinical_cases FOR ALL
  TO authenticated
  USING (
    public.current_staff_role() = 'admin'
    OR (
      public.current_staff_role() IN ('doctor', 'nurse')
      AND branch_id = public.current_staff_branch_id()
    )
  )
  WITH CHECK (
    public.current_staff_role() = 'admin'
    OR (
      public.current_staff_role() IN ('doctor', 'nurse')
      AND branch_id = public.current_staff_branch_id()
    )
  );

-- pep_doses: admin has global access across all branches; doctor & nurse strictly locked to their assigned branch_id
DROP POLICY IF EXISTS "pep_doses_branch_staff_all" ON public.pep_doses;
CREATE POLICY "pep_doses_branch_staff_all"
  ON public.pep_doses FOR ALL
  TO authenticated
  USING (
    public.current_staff_role() = 'admin'
    OR (
      public.current_staff_role() IN ('doctor', 'nurse')
      AND branch_id = public.current_staff_branch_id()
    )
  )
  WITH CHECK (
    public.current_staff_role() = 'admin'
    OR (
      public.current_staff_role() IN ('doctor', 'nurse')
      AND branch_id = public.current_staff_branch_id()
    )
  );

-- vaccine_inventory: admin has global access across all branches; doctor & nurse strictly locked to their assigned branch_id
DROP POLICY IF EXISTS "vaccine_inventory_branch_staff_all" ON public.vaccine_inventory;
CREATE POLICY "vaccine_inventory_branch_staff_all"
  ON public.vaccine_inventory FOR ALL
  TO authenticated
  USING (
    public.current_staff_role() = 'admin'
    OR (
      public.current_staff_role() IN ('doctor', 'nurse')
      AND branch_id = public.current_staff_branch_id()
    )
  )
  WITH CHECK (
    public.current_staff_role() = 'admin'
    OR (
      public.current_staff_role() IN ('doctor', 'nurse')
      AND branch_id = public.current_staff_branch_id()
    )
  );
